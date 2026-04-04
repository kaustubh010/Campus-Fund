import { prisma } from '@/lib/prisma';
import { goalSchema } from '@/lib/validators';
import { NextRequest, NextResponse } from 'next/server';
import algosdk from 'algosdk';

// GET /api/goals - Get goals (optionally filtered by wallet)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: any = {};
    if (walletAddress) {
      where.walletAddress = walletAddress;
    }
    if (category && category !== 'All') {
      where.category = { equals: category, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const goals = await prisma.goal.findMany({
      where,
      include: { deposits: { orderBy: { timestamp: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// POST /api/goals - Create a new goal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = goalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { walletAddress } = body;
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Generate a unique Algorand keypair for this goal.
    // All deposits go to this address — funds are traceable on-chain per goal.
    // The mnemonic is stored so funds can be swept back to the user on claim.
    // ⚠️ In production, encrypt depositMnemonic before storing.
    const account = algosdk.generateAccount();
    const depositAddress = account.addr.toString();
    const depositMnemonic = algosdk.secretKeyToMnemonic(account.sk);

    const goal = await prisma.goal.create({
      data: {
        name: validation.data.name,
        description: validation.data.description,
        target: validation.data.target,
        deadline: validation.data.deadline,
        category: validation.data.category || 'campus',
        imageUrl: validation.data.imageUrl,
        walletAddress,
        depositAddress,
        depositMnemonic,
      },
    });

    // Never return the mnemonic to the client
    const { depositMnemonic: _omit, ...safeGoal } = goal;

    return NextResponse.json({ goal: safeGoal }, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}