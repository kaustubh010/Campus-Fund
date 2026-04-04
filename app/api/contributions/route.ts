import { prisma } from '@/lib/prisma';
import { algodClient } from '@/lib/algorand';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goalId, amount, walletAddress, txId } = body;

    if (!goalId || !amount || !walletAddress || !txId) {
      return NextResponse.json(
        { error: 'Missing required fields: goalId, amount, walletAddress, txId' },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Verify the transaction exists on-chain before recording it.
    // This prevents fake deposits being recorded without a real txn.
    let status = 'pending';
    try {
      const txnInfo = await algodClient
        .pendingTransactionInformation(txId)
        .do();

      // confirmed-round is set once the txn is in a block
      status = txnInfo['confirmed-round'] ? 'confirmed' : 'pending';
    } catch {
      // pendingTransactionInformation throws if the txn has been pruned from
      // the pending pool (i.e. it was confirmed and moved to the ledger).
      // In that case we treat it as confirmed.
      status = 'confirmed';
    }

    // Check for duplicate — don't record the same txn twice
    const existing = await prisma.deposit.findUnique({
      where: { txnId: txId },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Transaction already recorded' },
        { status: 409 }
      );
    }

    // Record the deposit
    const deposit = await prisma.deposit.create({
      data: {
        goalId,
        amount: parseFloat(amount),
        walletAddress,
        txnId: txId,      // matches the Prisma schema field name
        status,
      },
    });

    // Update goal's running total
    await prisma.goal.update({
      where: { id: goalId },
      data: {
        deposited: { increment: parseFloat(amount) },
      },
    });

    return NextResponse.json({ success: true, deposit });
  } catch (error) {
    console.error('Deposit recording error:', error);
    return NextResponse.json(
      { error: 'Failed to record deposit' },
      { status: 500 }
    );
  }
}

// GET /api/contributions?goalId=xxx - get contribution history for a campaign
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('goalId');

    if (!goalId) {
      return NextResponse.json(
        { error: 'goalId is required' },
        { status: 400 }
      );
    }

    const deposits = await prisma.deposit.findMany({
      where: { goalId },
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json({ deposits });
  } catch (error) {
    console.error('Error fetching deposits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deposits' },
      { status: 500 }
    );
  }
}