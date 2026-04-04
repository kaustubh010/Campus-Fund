import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lucia } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(lucia.sessionCookieName);

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, session } = await lucia.validateSession(sessionCookie.value);
    if (!session || !user || user.role !== "COMPANY") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. Fetch Company Profile
    const profile = await prisma.companyProfile.findUnique({
      where: { userId: user.id },
      include: {
        campaigns: {
          include: {
            _count: { select: { donations: true } },
            donations: {
              include: { user: { select: { name: true, email: true } } },
              orderBy: { createdAt: "desc" }
            }
          }
        }
      }
    });

    if (!profile) {
       return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // 2. Calculate Stats
    const totalRaisedINR = profile.campaigns.reduce((acc: number, c: any) => acc + c.raisedINR, 0);
    const activeCampaigns = profile.campaigns.filter((c: any) => c.status === "Active").length;
    const totalDonors = new Set(profile.campaigns.flatMap((c: any) => c.donations.map((d: any) => d.userId))).size;
    const claimedFundsINR = profile.campaigns.filter((c: any) => c.status === "claimed").reduce((acc: number, c: any) => acc + c.raisedINR, 0);

    // 3. Donor Analytics
    const allDonations = profile.campaigns.flatMap((c: any) => 
      c.donations.map((d: any) => ({
        id: d.id,
        donorName: d.user?.name || "Anonymous",
        donorEmail: d.user?.email || "N/A",
        amountINR: d.amountINR,
        campaign: c.title,
        date: d.createdAt
      }))
    ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 4. Audit Trail (Transactions related to these campaigns)
    const transactions = await prisma.transaction.findMany({
      where: {
        campaignId: { in: profile.campaigns.map((c: any) => c.id) }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return NextResponse.json({
      stats: {
        totalRaised: totalRaisedINR,
        activeCampaigns,
        totalDonors,
        claimedFunds: claimedFundsINR
      },
      campaigns: profile.campaigns.map((c: any) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        raised: c.raisedINR,
        goal: c.goalINR,
        donors: c._count.donations,
        category: c.category
      })),
      donations: allDonations,
      transactions: transactions.map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        status: tx.status,
        amountINR: tx.amountINR,
        amountALGO: tx.amountALGO,
        txId: tx.txId,
        date: tx.createdAt,
        campaign: profile.campaigns.find((c: any) => c.id === tx.campaignId)?.title || "Unknown"
      }))
    });

  } catch (error: any) {
    console.error("Dashboard API Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
