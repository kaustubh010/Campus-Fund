import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { lucia } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import algosdk from 'algosdk';
import { algodClient, appArgMethod, encodeUintArg, getAppGlobalState } from '@/lib/algorand';
import { syncAcceptedInvoiceTotalsToCampaign } from '@/lib/campaign-invoice-totals';
import { toSafeJson } from '@/lib/json';

/** Build `set_invoice_verified` txn from accepted invoice totals (no GST). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { user, session } = await lucia.validateSession(sessionId);
    if (!session || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const campaignId = (await params).id;
    const campaign: any = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { creator: { select: { walletAddress: true } } },
    });
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    if (campaign.creatorId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!campaign.appId) return NextResponse.json({ error: 'Campaign appId missing' }, { status: 400 });
    if (!campaign.creator?.walletAddress) {
      return NextResponse.json({ error: 'Creator wallet address missing' }, { status: 400 });
    }

    await syncAcceptedInvoiceTotalsToCampaign(campaignId);
    const fresh = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!fresh?.invoiceAmountMicroALGO || BigInt(fresh.invoiceAmountMicroALGO.toString()) <= 0n) {
      return NextResponse.json(
        { error: 'Accept at least one invoice with a valid INR amount before locking on-chain.' },
        { status: 400 }
      );
    }

    const micro = Number(fresh.invoiceAmountMicroALGO);
    const onChain: any = await getAppGlobalState(campaign.appId).catch(() => ({}));
    const totalRaised = Number(onChain.total_raised ?? 0);
    if (micro > totalRaised) {
      return NextResponse.json(
        { error: 'Invoice total exceeds amount raised on-chain. Lower accepted invoice amounts.' },
        { status: 400 }
      );
    }

    let setInvoiceTxnB64: string | null = null;
    if (Number(onChain.invoice_verified || 0) !== 1) {
      const suggestedParams = await algodClient.getTransactionParams().do();
      const setInvoiceTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from: campaign.creator.walletAddress,
        appIndex: campaign.appId,
        appArgs: [appArgMethod('set_invoice_verified'), encodeUintArg(micro)],
        suggestedParams,
      });
      setInvoiceTxnB64 = Buffer.from(setInvoiceTxn.toByte()).toString('base64');
    }

    return NextResponse.json(
      toSafeJson({
        id: fresh.id,
        invoiceVerificationStatus: fresh.invoiceVerificationStatus,
        invoiceAmountINR: fresh.invoiceAmountINR,
        invoiceAmountALGO: fresh.invoiceAmountALGO,
        invoiceAmountMicroALGO: fresh.invoiceAmountMicroALGO,
        setInvoiceTxnB64,
      })
    );
  } catch (error: any) {
    console.error('Invoice verify error:', error);
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
