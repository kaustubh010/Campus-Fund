import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { lucia } from '@/lib/auth';
import { cookies } from 'next/headers';
import { toSafeJson } from '@/lib/json';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const p = await params;
    const campaignId = p.id;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        creator: {
          select: { id: true, name: true, picture: true }
        },
        donations: {
          include: {
            donor: {
              select: { name: true, picture: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { donations: true }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json(toSafeJson(campaign));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
      data
    });

    return NextResponse.json(toSafeJson(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { campaignId } });
      await tx.donation.deleteMany({ where: { campaignId } });
      await tx.campaign.delete({ where: { id: campaignId } });
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

