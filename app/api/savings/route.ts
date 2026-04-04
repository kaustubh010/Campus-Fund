import { NextResponse } from 'next/server';
import { algorand, SAVINGS_APP_ID } from '@/lib/algorand-client';
import { SavingsClient } from '@/lib/contracts/savings-client';

/**
 * GET /api/savings
 * Reads contract state directly from algod's global state endpoint.
 * No transaction, no sender, no fee.
 */
export async function GET() {
  try {
    if (SAVINGS_APP_ID === 0n) {
      return NextResponse.json({
        owner: '',
        targetAlgo: 0,
        depositedAlgo: 0,
        progressPercent: 0,
        notConfigured: true,
      });
    }

    const client = new SavingsClient({
      appId: SAVINGS_APP_ID,
      algorand,
    });

    // state.global.getAll() reads key-value pairs directly from algod —
    // no transaction built, no sender required, no fee deducted.
    const { owner, target, deposited } = await client.state.global.getAll();

    const targetNum = Number(target ?? 0n);
    const depositedNum = Number(deposited ?? 0n);

    return NextResponse.json({
      owner: owner ?? '',
      targetAlgo: targetNum / 1_000_000,
      depositedAlgo: depositedNum / 1_000_000,
      progressPercent:
        targetNum > 0
          ? Math.min(100, Math.round((depositedNum / targetNum) * 100))
          : 0,
      notConfigured: false,
    });
  } catch (error) {
    console.error('Error reading savings state:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to read savings state' },
      { status: 500 },
    );
  }
}