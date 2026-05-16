import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { lucia } from '@/lib/auth';
import { cookies } from 'next/headers';
import { waitForConfirmation } from '@/lib/algorand';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user, session } = await lucia.validateSession(sessionId);
    if (!session || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const p = await params;
    const campaignId = p.id;
    const { txId } = await request.json();

    if (!txId) {
      return NextResponse.json({ error: 'Missing transaction ID' }, { status: 400 });
    }

    // Verify on-chain
    const confirmResult = await waitForConfirmation(txId);
    if (!confirmResult.success) {
      return NextResponse.json({ error: 'Transaction not confirmed' }, { status: 400 });
    }

    // Update the database in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Get all donations from this user for this campaign
      const userDonations = await tx.donation.findMany({
        where: {
          campaignId,
          donorId: user.id,
        }
      });

      const totalRefundINR = userDonations.reduce((acc, d) => acc + d.amountINR, 0);
      const totalRefundALGO = userDonations.reduce((acc, d) => acc + d.amountALGO, 0);

      if (totalRefundALGO <= 0) {
        throw new Error('No donations found to refund');
      }

      // 2. Decrement Campaign totals
      await tx.campaign.update({
        where: { id: campaignId },
        data: {
          raisedINR: { decrement: totalRefundINR },
          raisedALGO: { decrement: totalRefundALGO },
          // If it was funded, maybe set back to active (optional but safer)
          status: { set: 'active' } // Usually if refunding, it's no longer 'funded' or it's cancelled
        }
      });

      // 3. Create a Refund Transaction record
      await tx.transaction.create({
        data: {
          campaignId,
          userId: user.id,
          amountINR: totalRefundINR,
          amountALGO: totalRefundALGO,
          type: 'Refund',
          status: 'success',
          txId
        }
      });

      // 4. Delete or Zero out Donation records
      // Deleting is cleaner for "raised" calculation consistency
      await tx.donation.deleteMany({
        where: {
          campaignId,
          donorId: user.id,
        }
      });
    });

    return NextResponse.json({ success: true, message: 'Refund recorded successfully' });
  } catch (error: any) {
    console.error('Refund API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
