import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lucia } from "@/lib/auth";
import { cookies } from "next/headers";
import { waitForConfirmation } from "@/lib/algorand";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(lucia.sessionCookieName);
    const p = await params;

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

    const campaignId = p.id;
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

    const { txId } = await req.json();
    if (!txId) {
      return NextResponse.json({ error: "Transaction ID required" }, { status: 400 });
    }

    // Verify transaction on blockchain
    const confirmResult = await waitForConfirmation(txId);
    if (!confirmResult.success) {
      return NextResponse.json({ error: "Transaction verification failed" }, { status: 400 });
    }

    const updatedCampaign = await prisma.$transaction(async (tx) => {
      // 1. Update campaign status
      const updated = await tx.campaign.update({
        where: { id: campaignId },
        data: { status: "claimed" },
        include: {
          creator: {
            select: { name: true, picture: true }
          },
          _count: {
            select: { donations: true }
          }
        }
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

    return NextResponse.json(updatedCampaign);
  } catch (error: any) {
    console.error("Claim Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
