import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { lucia } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppGlobalState } from "@/lib/algorand";
import { hardDeleteCampaignRecords } from "@/lib/campaign-delete-db";

/**
 * Hard purge: removes campaign + related rows. Blocked if on-chain app still holds ALGO.
 * POST so JSON body (confirmTitle) is reliable in all clients.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { user, session } = await lucia.validateSession(sessionId);
    if (!session || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const campaignId = (await params).id;
    const body = await req.json().catch(() => ({}));
    const confirmTitle = typeof body.confirmTitle === "string" ? body.confirmTitle.trim() : "";

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    if (campaign.creatorId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (confirmTitle !== campaign.title) {
      return NextResponse.json({ error: "Type the exact campaign title in confirmTitle to purge." }, { status: 400 });
    }

    if (campaign.appId) {
      const state = await getAppGlobalState(campaign.appId).catch(() => null);
      const totalRaised = state ? Number(state.total_raised ?? 0) : 0;
      const deleted = state ? Number(state.deleted ?? 0) : 0;
      if (state && deleted !== 1 && totalRaised > 0) {
        return NextResponse.json(
          {
            error:
              "This campaign still holds ALGO on-chain. Cancel it first (refund donors), then purge from the dashboard.",
          },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await hardDeleteCampaignRecords(tx, campaignId);
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Purge error:", error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
