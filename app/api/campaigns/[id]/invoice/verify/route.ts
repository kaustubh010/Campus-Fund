import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { lucia } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyGstNumber } from "@/lib/gst";
import { getAlgoRate } from "@/lib/coingecko";
import algosdk from "algosdk";
import { algoToMicroAlgo, algodClient, appArgMethod, encodeUintArg, getAppGlobalState } from "@/lib/algorand";
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
    if (!campaign.creator?.walletAddress) {
      return NextResponse.json({ error: "Creator wallet address missing" }, { status: 400 });
    }

    const { gstNumber, invoiceAmountINR } = await req.json();
    const gst = String(gstNumber || campaign.gstNumber || "").trim().toUpperCase();
    const amountInr = Number(invoiceAmountINR || campaign.invoiceAmountINR);

    if (!gst) return NextResponse.json({ error: "GST number is required" }, { status: 400 });
    if (!Number.isFinite(amountInr) || amountInr <= 0) {
      return NextResponse.json({ error: "Valid invoice amount is required" }, { status: 400 });
    }

    const verification = await verifyGstNumber(gst);
    if (!verification.valid) {
      const rejected: any = await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          gstNumber: gst,
          gstVerified: false,
          invoiceVerificationStatus: "REJECTED",
          invoiceVerificationReason: verification.reason || "GST verification failed",
        } as any,
      } as any);
      return NextResponse.json(
        { status: rejected.invoiceVerificationStatus, reason: rejected.invoiceVerificationReason },
        { status: 400 }
      );
    }

    const algoRate = await getAlgoRate();
    const invoiceAmountALGO = amountInr / algoRate;
    const invoiceAmountMicroALGO = BigInt(algoToMicroAlgo(invoiceAmountALGO));

    const approved = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        gstNumber: gst,
        gstVerified: true,
        invoiceAmountINR: amountInr,
        invoiceAmountALGO,
        invoiceAmountMicroALGO,
        invoiceVerificationStatus: "APPROVED",
        invoiceVerificationReason: null,
        invoiceVerifiedAt: new Date(),
      } as any,
      select: {
        id: true,
        invoiceVerificationStatus: true,
        gstVerified: true,
        invoiceAmountINR: true,
        invoiceAmountALGO: true,
        invoiceAmountMicroALGO: true,
      } as any,
    } as any);

    const onChain: any = await getAppGlobalState(campaign.appId).catch(() => ({}));
    let setInvoiceTxnB64: string | null = null;
    if (Number(onChain.invoice_verified || 0) !== 1) {
      const suggestedParams = await algodClient.getTransactionParams().do();
      const setInvoiceTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from: campaign.creator.walletAddress,
        appIndex: campaign.appId,
        appArgs: [appArgMethod("set_invoice_verified"), encodeUintArg(Number(invoiceAmountMicroALGO))],
        suggestedParams,
      });
      setInvoiceTxnB64 = Buffer.from(setInvoiceTxn.toByte()).toString("base64");
    }

    return NextResponse.json(toSafeJson({ ...approved, setInvoiceTxnB64 }));
  } catch (error: any) {
    console.error("Invoice verify error:", error);
    return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 });
  }
}
