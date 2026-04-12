import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { lucia } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCampaignInvoiceFromFile } from '@/lib/campaign-invoice-create';
import { toSafeJson } from '@/lib/json';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { user, session } = await lucia.validateSession(sessionId);
    if (!session || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const campaignId = (await params).id;
    const formData = await req.formData();
    const file = formData.get('invoice');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Invoice file is required' }, { status: 400 });
    }

    const row = await createCampaignInvoiceFromFile(campaignId, user.id, file);
    return NextResponse.json(toSafeJson(row));
  } catch (error: any) {
    console.error('Invoice create error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const campaignId = (await params).id;
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    const viewer = sessionId ? (await lucia.validateSession(sessionId)).user : null;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, creatorId: true },
    });
    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isCreator = viewer?.id === campaign.creatorId;
    const rows = await prisma.campaignInvoice.findMany({
      where: {
        campaignId,
        ...(isCreator ? {} : { status: 'ACCEPTED' }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(toSafeJson(rows));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
