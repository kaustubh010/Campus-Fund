-- AlterTable
ALTER TABLE "CampaignInvoice" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "plan" SET DEFAULT 'free';
