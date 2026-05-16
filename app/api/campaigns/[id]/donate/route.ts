import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { lucia } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getAppGlobalState, waitForConfirmation } from '@/lib/algorand';

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
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || !campaign.appId) {
      return NextResponse.json({ error: 'Campaign/app not found' }, { status: 404 });
    }

    const body = await request.json();
    const { txId, txIds } = body;

    // Use whatever the frontend provided (fallback to just txId if txIds is missing)
    const transactionIds = Array.isArray(txIds) && txIds.length > 0 ? txIds : (txId ? [txId] : []);

    if (transactionIds.length === 0) {
      return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 });
    }

    const { parseDonateGroupFromIndexer } = await import('@/lib/parse-donation-txn');

    // Idempotency check 
    const existing = await prisma.donation.findFirst({ where: { txId: transactionIds[0] } });
    if (existing) {
      return NextResponse.json({ success: true, alreadyRecorded: true }); // Make idempotent
    }

    // Verify the txId on the Algorand blockchain here before recording it.
    const confirmResult = await waitForConfirmation(transactionIds[0]);
    if (!confirmResult.success) {
      return NextResponse.json({ error: 'Transaction verification failed' }, { status: 400 });
    }

    const parsed = await parseDonateGroupFromIndexer(transactionIds, campaign.appId);
    if (!parsed.ok) {
        return NextResponse.json({error: parsed.error}, {status: 400});
    }

    const { microAlgos, payerAddress } = parsed.data;
    const amountALGO = microAlgos / 1_000_000;
    
    // Calculate INR from ratio
    const ratio = campaign.goalALGO > 0 ? campaign.goalINR / campaign.goalALGO : 0;
    const amountINR = ratio > 0 ? amountALGO * ratio : 0;

    const globalState = await getAppGlobalState(campaign.appId);
    if (Number(globalState.claimed || 0) === 1 || Number(globalState.deleted || 0) === 1) {
      return NextResponse.json({ error: 'Campaign no longer accepts donations' }, { status: 400 });
    }
    if (Number(globalState.deadline || 0) < Math.floor(Date.now() / 1000)) {
      return NextResponse.json({ error: 'Campaign deadline has passed' }, { status: 400 });
    }

    const mutation = await prisma.$transaction(async (tx) => {
      // Record Donation
      const donation = await tx.donation.create({
        data: {
          campaignId,
          donorId: user.id,
          amountINR: Number(amountINR),
          amountALGO: Number(amountALGO),
          txId,
          donorWalletAddress: payerAddress
        }
      });

      // Record Transaction
      await tx.transaction.create({
        data: {
          campaignId,
          userId: user.id,
          amountINR: Number(amountINR),
          amountALGO: Number(amountALGO),
          type: 'Donation',
          status: 'success',
          txId
        }
      });

      // Update Campaign totals
      const updatedCampaign = await tx.campaign.update({
        where: { id: campaignId },
        data: {
          raisedINR: { increment: Number(amountINR) },
          raisedALGO: { increment: Number(amountALGO) }
        }
      });

      // If the goal is newly reached, we could update status to 'funded'
      if (updatedCampaign.status === 'active' && updatedCampaign.raisedALGO >= updatedCampaign.goalALGO) {
        await tx.campaign.update({
          where: { id: campaignId },
          data: { status: 'funded' }
        });
      }

      return updatedCampaign;
    }, {
      maxWait: 10000, // 10 seconds (default is 2)
      timeout: 20000, // 20 seconds (default is 5)
    });

    return NextResponse.json({ success: true, donation: true });
  } catch (error) {
    console.error('Error logging donation:', error);
    return NextResponse.json(
      { error: `Failed to record donation: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
