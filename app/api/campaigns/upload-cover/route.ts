import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { lucia } from "@/lib/auth";
import { uploadBannerImage } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { user, session } = await lucia.validateSession(sessionId);
    if (!session || !user || user.role !== "COMPANY") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("cover");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const upload = await uploadBannerImage(Buffer.from(arrayBuffer));
    return NextResponse.json({ url: upload.secure_url, publicId: upload.public_id });
  } catch (error: any) {
    console.error("Cover upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
