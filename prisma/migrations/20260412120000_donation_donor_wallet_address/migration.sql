-- Align Donation with Prisma schema (donor snapshot for refunds)
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "donorWalletAddress" TEXT;
