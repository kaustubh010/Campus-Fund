import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import algosdk from 'algosdk';
import { lucia } from '@/lib/auth';
import { cookies } from 'next/headers';

import { getAlgoRate } from '@/lib/coingecko';
import { algoToMicroAlgo } from '@/lib/algorand';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort');

    const where: any = {};
    if (category && category !== 'All') {
      where.category = { equals: category, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'Most funded') {
      orderBy = { raisedALGO: 'desc' };
    } else if (sort === 'Ending soon') {
      orderBy = { deadline: 'asc' };
      where.deadline = { not: null };
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: { 
        _count: { select: { donations: true } },
        creator: { select: { name: true } }
      },
      orderBy,
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user, session } = await lucia.validateSession(sessionId);
    if (!session || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Only organization accounts can create campaigns. Please upgrade your account.' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, category, coverImage, goalINR, deadline, appId, escrowAddress } = body;

    if (!title || !description || !category || !goalINR || !appId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const ALGO_RATE = await getAlgoRate();
    const goalALGO = Number(goalINR) / ALGO_RATE;

    // Fetch company profile to link it
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { userId: user.id }
    });

    const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        category,
        coverImage,
        goalINR: Number(goalINR),
        goalALGO,
        deadline: deadline ? new Date(deadline) : null,
        escrowAddress,
        escrowMnemonic: 'APP_MANAGED', // No longer using a separate escrow account with mnemonic
        appId: Number(appId),
        creatorId: user.id,
        companyProfileId: companyProfile?.id
      },
    });

    const { escrowMnemonic: _omit, ...safeCampaign } = campaign;

    return NextResponse.json({ campaign: safeCampaign }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
