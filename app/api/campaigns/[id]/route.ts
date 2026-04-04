import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const p = await params;
    const campaignId = p.id;

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID missing' }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        creator: { select: { name: true, id: true } },
        donations: {
          orderBy: { createdAt: 'desc' },
          include: { donor: { select: { name: true } } }
        },
        _count: { select: { donations: true } }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const { escrowMnemonic: _omit, ...safeCampaign } = campaign;

    return NextResponse.json({ campaign: safeCampaign });
  } catch (error) {
    console.error('Error fetching campaign details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign details' },
      { status: 500 }
    );
  }
}
