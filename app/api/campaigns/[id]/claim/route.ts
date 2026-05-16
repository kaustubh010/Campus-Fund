import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lucia } from "@/lib/auth";
import { cookies } from "next/headers";
import { waitForConfirmation } from "@/lib/algorand";
import algosdk from "algosdk";
import { algodClient, appArgMethod, encodeAddressArg, encodeUintArg, getAppGlobalState } from "@/lib/algorand";
import { buildRefundPlan, validateDonationsForRefundPlan } from "@/lib/refunds";
import { toSafeJson } from "@/lib/json";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(lucia.sessionCookieName);
    const p = await params;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, session } = await lucia.validateSession(sessionCookie.value);
    if (!session || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "COMPANY") {
      return NextResponse.json({ error: "Only organization accounts can claim funds." }, { status: 403 });
    }

    const campaignId = p.id;
    const campaign: any = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { creator: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.creatorId !== user.id) {
      return NextResponse.json({ error: "You are not the creator of this campaign" }, { status: 403 });
    }

    if (campaign.status === "claimed") {
      return NextResponse.json({ error: "Funds have already been claimed" }, { status: 400 });
    }
    if (campaign.status === "cancelled") {
      return NextResponse.json({ error: "Campaign was cancelled" }, { status: 400 });
    }

    if (!campaign.appId) {
      return NextResponse.json({ error: "Campaign appId missing" }, { status: 400 });
    }
    const signerAddress = campaign.creator.walletAddress;
    if (!signerAddress) {
      return NextResponse.json({ error: "Creator wallet address missing" }, { status: 400 });
    }

    const payload = await req.json();
    const action = payload.action || "prepare";

    if (action === "prepare") {
      const invMicro =
        campaign.invoiceAmountMicroALGO != null
          ? BigInt(String(campaign.invoiceAmountMicroALGO))
          : 0n;
      if (invMicro <= 0n) {
        return NextResponse.json(
          { error: "Accept invoice line items and lock totals before claiming." },
          { status: 400 }
        );
      }

      const donations = await prisma.donation.findMany({
        where: { campaignId: campaign.id },
        include: { donor: { select: { walletAddress: true } } },
      });

      const appAddress = algosdk.getApplicationAddress(campaign.appId);
      const accountInfo = await algodClient.accountInformation(appAddress).do();
      const appBalance = Number(accountInfo.amount || 0);
      const minBalance = Number(accountInfo["min-balance"] || 0);
      const invoiceAmountMicro = Number(invMicro);
      const distributable = Math.max(0, appBalance - invoiceAmountMicro - minBalance);

      const v = validateDonationsForRefundPlan(donations, distributable);
      if (v) return NextResponse.json({ error: v }, { status: 400 });

      const fullPlan = buildRefundPlan(donations, distributable);
      const refundPlan = fullPlan.filter((r) => r.microAlgos >= 1);
      const refundSum = refundPlan.reduce((acc, item) => acc + item.microAlgos, 0);

      if (refundPlan.length > 7) {
        return NextResponse.json(
          { error: "Too many donors for one claim call. Exceeds Algorand 16 ApplicationArgs limit. Batch support is TODO." },
          { status: 400 }
        );
      }
      if (refundSum > distributable) {
        return NextResponse.json({ error: "Refund plan exceeds distributable balance." }, { status: 400 });
      }

      const onChain = await getAppGlobalState(campaign.appId);
      if (Number(onChain.invoice_verified || 0) !== 1) {
        return NextResponse.json(
          { error: "Invoice total is not set on-chain yet. Sign the lock-invoice transaction first." },
          { status: 400 }
        );
      }

      const suggestedParams = await algodClient.getTransactionParams().do();

      const claimArgs: Uint8Array[] = [appArgMethod("claim_with_invoice")];
      const foreignAccounts: string[] = [];
      for (const item of refundPlan) {
        claimArgs.push(encodeAddressArg(item.address));
        claimArgs.push(encodeUintArg(item.microAlgos));
        if (!foreignAccounts.includes(item.address) && item.address !== signerAddress) {
          foreignAccounts.push(item.address);
        }
      }

      const claimTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from: signerAddress,
        appIndex: campaign.appId,
        appArgs: claimArgs,
        accounts: foreignAccounts,
        suggestedParams,
      });

      return NextResponse.json(
        toSafeJson({
          claimTxnB64: Buffer.from(claimTxn.toByte()).toString("base64"),
          invoiceAmountMicro,
          distributable,
          refundSum,
          refunds: refundPlan,
        })
      );
    }

    if (action === "finalize") {
      const { txId } = payload;
      if (!txId) {
        return NextResponse.json({ error: "Transaction ID required" }, { status: 400 });
      }

      const confirmResult = await waitForConfirmation(txId);
      if (!confirmResult.success) {
        return NextResponse.json({ error: "Transaction verification failed" }, { status: 400 });
      }

      const globalState = await getAppGlobalState(campaign.appId);
      if (Number(globalState.claimed || 0) !== 1) {
        return NextResponse.json({ error: "Claim not reflected on-chain yet" }, { status: 400 });
      }

      const updatedCampaign = await prisma.$transaction(async (tx) => {
        const updated = await tx.campaign.update({
          where: { id: campaignId },
          data: { status: "claimed", claimTxId: txId, claimedAt: new Date() } as any,
          include: {
            creator: { select: { name: true, picture: true } },
            _count: { select: { donations: true } },
          },
        } as any);

        await tx.transaction.create({
          data: {
            campaignId,
            userId: user.id,
            amountINR: campaign.invoiceAmountINR ?? campaign.raisedINR,
            amountALGO: campaign.invoiceAmountALGO ?? campaign.raisedALGO,
            type: "Claim",
            status: "success",
            txId,
          },
        });

        return updated;
      });

      return NextResponse.json(toSafeJson(updatedCampaign));
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Claim Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
