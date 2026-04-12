import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { lucia } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import algosdk from "algosdk";
import { algodClient, appArgMethod, encodeAddressArg, encodeUintArg, getAppGlobalState, waitForConfirmation } from "@/lib/algorand";
import { buildRefundPlan } from "@/lib/refunds";
import { toSafeJson } from "@/lib/json";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { user, session } = await lucia.validateSession(sessionId);
    if (!session || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const campaignId = (await params).id;
    const campaign: any = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { creator: { select: { walletAddress: true } } },
    });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    if (campaign.creatorId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!campaign.appId) return NextResponse.json({ error: "Campaign appId missing" }, { status: 400 });
    const signerAddress = campaign.creator.walletAddress;
    if (!signerAddress) return NextResponse.json({ error: "Creator wallet address missing" }, { status: 400 });

    const payload = await req.json();
    const action = payload.action || "prepare";

    if (action === "prepare") {
      const donations = await prisma.donation.findMany({
        where: { campaignId },
        include: { donor: { select: { walletAddress: true } } },
      });

      const totalRaisedMicro = Math.round(campaign.raisedALGO * 1_000_000);
      const refundPlan = buildRefundPlan(donations, totalRaisedMicro);
      const refundSum = refundPlan.reduce((acc, item) => acc + item.microAlgos, 0);
      if (refundPlan.length > 255) {
        return NextResponse.json({ error: "Too many donors for one delete call." }, { status: 400 });
      }
      if (totalRaisedMicro > 0 && refundSum !== totalRaisedMicro) {
        return NextResponse.json({ error: "Refund sum must match total raised." }, { status: 400 });
      }

      const suggestedParams = await algodClient.getTransactionParams().do();
      const appArgs: Uint8Array[] = [appArgMethod("delete_campaign")];
      const foreignAccounts: string[] = [];
      for (const item of refundPlan) {
        appArgs.push(encodeAddressArg(item.address));
        appArgs.push(encodeUintArg(item.microAlgos));
        if (!foreignAccounts.includes(item.address) && item.address !== signerAddress) {
          foreignAccounts.push(item.address);
        }
      }

      const txn = algosdk.makeApplicationDeleteTxnFromObject({
        from: signerAddress,
        appIndex: campaign.appId,
        appArgs,
        accounts: foreignAccounts,
        suggestedParams,
      });

      return NextResponse.json(toSafeJson({
        deleteTxnB64: Buffer.from(txn.toByte()).toString("base64"),
        refunds: refundPlan,
      }));
    }

    if (action === "finalize") {
      const { txId } = payload;
      if (!txId) return NextResponse.json({ error: "Transaction ID required" }, { status: 400 });

      const confirm = await waitForConfirmation(txId);
      if (!confirm.success) return NextResponse.json({ error: "Delete tx not confirmed" }, { status: 400 });

      const globalState = await getAppGlobalState(campaign.appId).catch(() => null);
      if (globalState && Number(globalState.deleted || 0) !== 1) {
        return NextResponse.json({ error: "Delete not reflected on-chain yet" }, { status: 400 });
      }

      const updated = await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: "deleted",
          deletedAt: new Date(),
          deleteTxId: txId,
        } as any,
      } as any);

      return NextResponse.json(toSafeJson(updated));
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Delete campaign error:", error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
