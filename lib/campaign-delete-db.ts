import type { Prisma } from '@prisma/client';

/** Permanently removes a campaign and all dependent rows (not a status flag). */
export async function hardDeleteCampaignRecords(
  tx: Prisma.TransactionClient,
  campaignId: string
): Promise<void> {
  await tx.invoiceRefund.deleteMany({ where: { campaignId } });
  await tx.notification.deleteMany({ where: { campaignId } });
  await tx.transaction.deleteMany({ where: { campaignId } });
  await tx.donation.deleteMany({ where: { campaignId } });
  await tx.campaign.delete({ where: { id: campaignId } });
}
