import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { lucia } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractGstNumberFromText } from "@/lib/gst";
import { uploadInvoiceAsset } from "@/lib/cloudinary";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { user, session } = await lucia.validateSession(sessionId);
    if (!session || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const campaignId = (await params).id;
    const campaign: any = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    if (campaign.creatorId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get("invoice");
    const providedGst = String(formData.get("gstNumber") || "").trim().toUpperCase();
    const invoiceAmountINR = Number(formData.get("invoiceAmountINR"));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Invoice file is required" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only PDF, PNG, JPEG, and WEBP are allowed" }, { status: 400 });
    }

    if (!Number.isFinite(invoiceAmountINR) || invoiceAmountINR <= 0) {
      return NextResponse.json({ error: "Valid invoiceAmountINR is required" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const upload = await uploadInvoiceAsset(Buffer.from(arrayBuffer), file.type);
    const extracted = extractGstNumberFromText(`${file.name} ${providedGst}`);
    const gstNumber = providedGst || extracted || null;

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        invoiceUrl: upload.secure_url,
        invoicePublicId: upload.public_id,
        invoiceMimeType: file.type,
        invoiceAmountINR,
        gstNumber,
        gstVerified: false,
        invoiceVerificationStatus: "PENDING",
        invoiceVerificationReason: null,
        invoiceVerifiedAt: null,
      } as any,
      select: {
        id: true,
        invoiceUrl: true,
        invoiceAmountINR: true,
        gstNumber: true,
        invoiceVerificationStatus: true,
      } as any,
    } as any);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Invoice upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
