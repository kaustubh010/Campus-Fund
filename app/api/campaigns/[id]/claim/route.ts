import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lucia } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(lucia.sessionCookieName);

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, session } = await lucia.validateSession(sessionCookie.value);
    if (!session || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "COMPANY") {
      return NextResponse.json({ error: "Only organization accounts can claim funds." }, { status: 403 });
    }

    const campaignId = params.id;
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { creator: true }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.creatorId !== user.id) {
      return NextResponse.json({ error: "You are not the creator of this campaign" }, { status: 403 });
    }

    if (campaign.status === "claimed") {
      return NextResponse.json({ error: "Funds have already been claimed" }, { status: 400 });
    }

    // Determine if goal is reached (allowing a small margin for conversion)
    const isGoalReached = campaign.raisedINR >= campaign.goalINR * 0.99 || campaign.raisedALGO >= campaign.goalALGO * 0.99;

    if (!isGoalReached) {
      return NextResponse.json({ error: "Campaign goal has not been reached yet" }, { status: 400 });
    }

    // In a production app, here we would trigger the Algorand multisig/escrow transfer.
    // For this prototype, we simulate the success by updating the status and creating a transaction record.

    const txId = "SIMULATED_CLAIM_" + Date.now().toString(16);

    const updatedCampaign = await prisma.$transaction(async (tx) => {
      // 1. Update campaign status
      const updated = await tx.campaign.update({
        where: { id: campaignId },
        data: { status: "claimed" }
      });

      // 2. Create the claim transaction record
      await tx.transaction.create({
        data: {
          campaignId: campaignId,
          userId: user.id,
          amountINR: campaign.raisedINR,
          amountALGO: campaign.raisedALGO,
          type: "Claim",
          status: "success",
          txId: txId
        }
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: "Funds successfully claimed!",
      txId: txId,
      campaign: updatedCampaign
    });
  } catch (error: any) {
    console.error("Claim Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
