-- CreateEnum
CREATE TYPE "InvoiceVerificationStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Campaign"
ADD COLUMN "invoice_public_id" TEXT,
ADD COLUMN "invoice_mime_type" TEXT,
ADD COLUMN "invoice_amount_inr" DOUBLE PRECISION,
ADD COLUMN "invoice_amount_algo" DOUBLE PRECISION,
ADD COLUMN "invoice_amount_microalgo" BIGINT,
ADD COLUMN "gst_number" TEXT,
ADD COLUMN "gst_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "invoice_verification_status" "InvoiceVerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
ADD COLUMN "invoice_verification_reason" TEXT,
ADD COLUMN "invoice_verified_at" TIMESTAMP(3),
ADD COLUMN "claimed_at" TIMESTAMP(3),
ADD COLUMN "deleted_at" TIMESTAMP(3),
ADD COLUMN "claim_tx_id" TEXT,
ADD COLUMN "delete_tx_id" TEXT,
ADD COLUMN "invoiceUrl" TEXT;

-- AlterTable
ALTER TABLE "Donation"
ADD COLUMN "refunded_algo" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "refunded_inr" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "is_refunded" BOOLEAN NOT NULL DEFAULT false;
