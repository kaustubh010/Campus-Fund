import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lucia } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { generateId } from "lucia";

// Validation schema
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
  role: z.enum(["USER", "COMPANY"]).optional().default("USER"),
  orgType: z.string().optional(),
  contactPerson: z.string().optional(),
  university: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password, name, role, orgType, contactPerson, university } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId(10);

    // Create user
    let user;
    if (role === "COMPANY") {
      user = await prisma.user.create({
        data: {
          id: userId,
          email,
          hashedPassword,
          name,
          role,
          plan: "starter",
          companyProfile: {
            create: {
              orgName: name || "Unknown Org",
              orgType: orgType || "Other",
              contactPerson: contactPerson || "Unknown",
              university,
            }
          }
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          id: userId,
          email,
          hashedPassword,
          name,
          role,
        },
      });
    }

    // Create session
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    // Set cookies
    const cookieStore = await cookies();
    cookieStore.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return NextResponse.json(
      {
        success: true,
        user: {
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup Error:", error.message, error.stack);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
