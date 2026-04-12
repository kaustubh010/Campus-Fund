import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { lucia } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { syncAcceptedInvoiceTotalsToCampaign } from '@/lib/campaign-invoice-totals';
import { getAlgoRate } from '@/lib/coingecko';
import { algoToMicroAlgo } from '@/lib/algorand';
import { deleteImage } from '@/lib/cloudinary';
import { toSafeJson } from '@/lib/json';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; invoiceId: string }> }
) {
  try {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { user, session } = await lucia.validateSession(sessionId);
    if (!session || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: campaignId, invoiceId } = await params;
    const body = await req.json();
    const { status, extractedAmountINR } = body;

    const inv = await prisma.campaignInvoice.findFirst({
      where: { id: invoiceId, campaignId },
      include: { campaign: { select: { creatorId: true } } },
    });
    if (!inv || inv.campaign.creatorId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data: any = {};
    if (status === 'PENDING_REVIEW' || status === 'ACCEPTED' || status === 'REJECTED') {
      data.status = status;
      if (status === 'ACCEPTED') {
        data.creatorConfirmedAt = new Date();
      }
    }
    if (extractedAmountINR !== undefined) {
      const n = Number(extractedAmountINR);
      if (!Number.isFinite(n) || n <= 0) {
        return NextResponse.json({ error: 'extractedAmountINR must be a positive number' }, { status: 400 });
      }
      data.extractedAmountINR = n;
      const algoRate = await getAlgoRate();
      const algo = algoRate > 0 ? n / algoRate : 0;
      data.extractedAmountALGO = algo;
      data.extractedMicroAlgos = BigInt(Math.max(0, algoToMicroAlgo(algo)));
    }

    const updated = await prisma.campaignInvoice.update({
      where: { id: invoiceId },
      data,
    });

    await syncAcceptedInvoiceTotalsToCampaign(campaignId);

    return NextResponse.json(toSafeJson(updated));
  } catch (error: any) {
    console.error('Invoice patch error:', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; invoiceId: string }> }
) {
  try {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { user, session } = await lucia.validateSession(sessionId);
    if (!session || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: campaignId, invoiceId } = await params;
    const inv = await prisma.campaignInvoice.findFirst({
      where: { id: invoiceId, campaignId },
      include: { campaign: { select: { creatorId: true } } },
    });
    if (!inv || inv.campaign.creatorId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (inv.publicId) {
      try {
        await deleteImage(inv.publicId);
      } catch {
        /* ignore */
      }
    }
    await prisma.campaignInvoice.delete({ where: { id: invoiceId } });
    await syncAcceptedInvoiceTotalsToCampaign(campaignId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
