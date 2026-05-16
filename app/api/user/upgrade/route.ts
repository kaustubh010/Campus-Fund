import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lucia } from "@/lib/auth";
import { cookies } from "next/headers";
import { z } from "zod";

const upgradeSchema = z.object({
  plan: z.enum(["starter", "pro", "enterprise"]),
  orgName: z.string().min(2),
  orgType: z.string().min(2),
  contactPerson: z.string().min(2),
  university: z.string().optional(),
  description: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(lucia.sessionCookieName);

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { session } = await lucia.validateSession(sessionCookie.value);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = upgradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { plan, orgName, orgType, contactPerson, university, description } = parsed.data;

    // Update user role and plan, and create/update company profile in a transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Update user role and plan
      const user = await tx.user.update({
        where: { id: session.userId },
        data: {
          role: "COMPANY",
          plan: plan,
        },
      });

      // 2. Create or update company profile
      await tx.companyProfile.upsert({
        where: { userId: session.userId },
        update: {
          orgName,
          orgType,
          contactPerson,
          university,
          description,
        },
        create: {
          userId: session.userId,
          orgName,
          orgType,
          contactPerson,
          university,
          description,
        },
      });

      return user;
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        plan: updatedUser.plan,
      },
    });
  } catch (error: any) {
    console.error("Upgrade Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
