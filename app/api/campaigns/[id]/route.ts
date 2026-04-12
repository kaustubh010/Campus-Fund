import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { lucia } from '@/lib/auth';
import { cookies } from 'next/headers';
import { toSafeJson } from '@/lib/json';
import { getAppGlobalState } from '@/lib/algorand';
import { hardDeleteCampaignRecords } from '@/lib/campaign-delete-db';

const ON_CHAIN_DELETE_REQUIRED = 'ON_CHAIN_DELETE_REQUIRED' as const;

async function chainAllowsDbOnlyDelete(appId: number | null): Promise<boolean> {
  if (appId == null) return true;
  const state = await getAppGlobalState(appId).catch(() => null);
  if (!state) return true;
  const totalRaised = Number(state.total_raised ?? 0);
  const deleted = Number(state.deleted ?? 0);
  if (deleted === 1) return true;
  return totalRaised === 0;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params;
    const campaignId = p.id;

    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    const viewer = sessionId ? (await lucia.validateSession(sessionId)).user : null;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        creator: {
          select: { id: true, name: true, picture: true },
        },
        company: true,
        donations: {
          include: {
            donor: {
              select: { name: true, picture: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { donations: true },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const isCreator = viewer?.id === campaign.creatorId;
    const invoices = await prisma.campaignInvoice.findMany({
      where: isCreator ? { campaignId } : { campaignId, status: 'ACCEPTED' },
      orderBy: { createdAt: 'desc' },
    });

    let appGlobalState: Record<string, unknown> | null = null;
    if (campaign.appId) {
      appGlobalState = (await getAppGlobalState(campaign.appId).catch(() => null)) as Record<string, unknown> | null;
    }

    const payload = { ...campaign, invoices, appGlobalState };
    return NextResponse.json(toSafeJson(payload));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { user, session } = await lucia.validateSession(sessionId);
    if (!session || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const p = await params;
    const campaignId = p.id;
    const { status, title, description, category, coverImage, goalINR, deadline } = await request.json();

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    if (campaign.creatorId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data: any = {};
    if (typeof status === 'string') data.status = status;
    if (typeof title === 'string') data.title = title;
    if (typeof description === 'string') data.description = description;
    if (typeof category === 'string') data.category = category;
    if (typeof coverImage === 'string') data.coverImage = coverImage;
    if (goalINR !== undefined && Number.isFinite(Number(goalINR))) {
      data.goalINR = Number(goalINR);
      if (campaign.goalINR > 0 && campaign.goalALGO > 0) {
        const ratio = campaign.goalALGO / campaign.goalINR;
        data.goalALGO = Number(goalINR) * ratio;
      }
    }
    if (deadline !== undefined) data.deadline = deadline ? new Date(deadline) : null;

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data,
    });

    return NextResponse.json(toSafeJson(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { user, session } = await lucia.validateSession(sessionId);
    if (!session || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const p = await params;
    const campaignId = p.id;

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    if (campaign.creatorId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const dbOnlyOk = await chainAllowsDbOnlyDelete(campaign.appId ?? null);
    if (!dbOnlyOk) {
      return NextResponse.json(
        {
          error:
            'This campaign still holds donated ALGO on-chain. Sign the delete transaction first so donors are refunded, then removal completes automatically.',
          code: ON_CHAIN_DELETE_REQUIRED,
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await hardDeleteCampaignRecords(tx, campaignId);
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
