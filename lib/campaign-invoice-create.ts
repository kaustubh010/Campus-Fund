import { prisma } from '@/lib/prisma';
import { uploadInvoiceAsset } from '@/lib/cloudinary';
import { extractInvoiceAmountINRFromDocument } from '@/lib/invoice-ocr';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

export async function createCampaignInvoiceFromFile(campaignId: string, creatorId: string, file: File) {
  if (!(file instanceof File)) {
    throw new Error('Invoice file is required');
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error('Only PDF, PNG, JPEG, and WEBP are allowed');
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.creatorId !== creatorId) {
    throw new Error('Campaign not found or forbidden');
  }

  const arrayBuffer = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);
  const upload = await uploadInvoiceAsset(buf, file.type);
  
  let ocrBase64 = buf.toString('base64');
  let ocrMimeType = file.type;
  let finalFileUrl = upload.secure_url;

  // If PDF, extract first page as image for OCR and store as image only
  if (file.type === 'application/pdf') {
    const { getFirstPageImageUrl } = await import('@/lib/cloudinary');
    const jpgUrl = getFirstPageImageUrl(upload.secure_url);
    finalFileUrl = jpgUrl;

    try {
      const jpgRes = await fetch(jpgUrl);
      if (jpgRes.ok) {
        const jpgArrayBuffer = await jpgRes.arrayBuffer();
        ocrBase64 = Buffer.from(jpgArrayBuffer).toString('base64');
        ocrMimeType = 'image/jpeg';
      }
    } catch (e) {
      console.error('Failed to fetch JPG transformation for OCR:', e);
    }
  }

  const ocr = await extractInvoiceAmountINRFromDocument(ocrBase64, ocrMimeType);

  const row = await prisma.campaignInvoice.create({
    data: {
      campaignId,
      fileUrl: finalFileUrl,
      publicId: upload.public_id,
      mimeType: ocrMimeType,
      extractedAmountINR: ocr.amountINR ?? undefined,
      ocrRawText: ocr.rawText || null,
      status: 'PENDING_REVIEW',
    },
  });

  return row;
}
