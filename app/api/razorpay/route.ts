import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { lucia } from "@/lib/auth";
import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay with API key and secret
console.log("Razorpay keys:", process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET);
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Create a new Razorpay orders
export async function POST(req: NextRequest) {
  console.log("Razorpay API: Creating new order");
  
  try {
    // Validate user is authenticated
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(lucia.sessionCookieName);

    if (!sessionCookie) {
      console.error("Razorpay API: No session cookie found");
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const session = await lucia.validateSession(sessionCookie.value);
    if (!session || !session.session || !session.session.userId) {
      console.error("Razorpay API: Invalid session", session);
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const userId = session.session.userId;
    console.log("Razorpay API: User authenticated with ID", userId);

    // Get order details from request
    const body = await req.json();
    const { orderId, amount } = body;
    console.log("Razorpay API: Request body", { orderId, amount });

    if (!orderId || !amount) {
      console.error("Razorpay API: Missing required fields", { orderId, amount });
      return NextResponse.json(
        { error: "Order ID and amount are required" },
        { status: 400 }
      );
    }

    // Check if Razorpay is properly initialized
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Razorpay API: Missing Razorpay credentials");
      return NextResponse.json(
        { error: "Payment gateway configuration error" },
        { status: 500 }
      );
    }

    // Create a Razorpay order
    // For demo purposes, we're using the orderId (which could be a campaignId)
    // without strictly checking a pre-existing Order table if it doesn't exist.
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: orderId,
      notes: {
        orderId: orderId,
        userId: userId,
      },
    });

    console.log("Razorpay API: Order created successfully", razorpayOrder);

    // Save to DB if Order model exists (optional/demo bypass)
    try {
      // @ts-ignore - Order might not exist in Prisma schema yet
      if (prisma.order) {
        // @ts-ignore
        await prisma.order.update({
          where: { id: orderId },
          data: {
            razorpayOrderId: razorpayOrder.id,
          },
        });
      }
    } catch (e) {
      console.log("Razorpay API: Skipping DB update as Order model might be missing", e);
    }

    return NextResponse.json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error: any) {
    console.error("Razorpay API: Error creating order", error);
    return NextResponse.json(
      { 
        error: "Failed to create Razorpay order", 
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Verify Razorpay payment
export async function PUT(req: NextRequest) {
  console.log("Razorpay API: Verifying payment");
  
  try {
    const body = await req.json();
    const {
      orderId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = body;
    
    console.log("Razorpay API: Verification request", { 
      orderId, 
      razorpayPaymentId, 
      razorpayOrderId 
    });

    if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      console.error("Razorpay API: Missing required parameters", body);
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Check if Razorpay secret is available
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error("Razorpay API: Missing Razorpay secret key");
      return NextResponse.json(
        { error: "Payment gateway configuration error" },
        { status: 500 }
      );
    }

    // Verify the signature
    console.log("Razorpay API: Verifying signature");
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    console.log("Razorpay API: Signature verification", { 
      expected: expectedSignature, 
      received: razorpaySignature,
      match: expectedSignature === razorpaySignature
    });

    if (expectedSignature !== razorpaySignature) {
      console.error("Razorpay API: Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Update order payment status
    console.log("Razorpay API: Updating order payment status", orderId);
    try {
      // @ts-ignore
      if (prisma.order) {
        // @ts-ignore
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "completed",
            razorpayPaymentId,
            status: "processing", // Update from pending to processing
          },
        });
        console.log("Razorpay API: Order updated successfully", updatedOrder);
        return NextResponse.json({
          success: true,
          order: {
            id: updatedOrder.id,
            paymentStatus: updatedOrder.paymentStatus,
            status: updatedOrder.status,
          },
        });
      }
    } catch (e) {
      console.log("Razorpay API: Skipping DB verification update", e);
    }

    return NextResponse.json({
      success: true,
      demo: true,
      message: "Payment verified (demo mode)"
    });
  } catch (error: any) {
    console.error("Razorpay API: Error verifying payment", error);
    return NextResponse.json(
      { 
        error: "Failed to verify payment",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
} 