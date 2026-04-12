-- CreateEnum
CREATE TYPE "CampaignInvoiceStatus" AS ENUM ('PENDING_REVIEW', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "CampaignInvoice" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "publicId" TEXT,
    "mimeType" TEXT,
    "extractedAmountINR" DOUBLE PRECISION,
    "extractedAmountALGO" DOUBLE PRECISION,
    "extractedMicroAlgos" BIGINT,
    "ocrRawText" TEXT,
    "status" "CampaignInvoiceStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "creatorConfirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignInvoice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CampaignInvoice_campaignId_idx" ON "CampaignInvoice"("campaignId");

ALTER TABLE "CampaignInvoice" ADD CONSTRAINT "CampaignInvoice_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
