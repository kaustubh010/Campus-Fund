import { prisma } from '@/lib/prisma';
import { getAlgoRate } from '@/lib/coingecko';
import { algoToMicroAlgo } from '@/lib/algorand';

/** Recompute campaign.invoice* from ACCEPTED CampaignInvoice rows. */
export async function syncAcceptedInvoiceTotalsToCampaign(campaignId: string): Promise<void> {
  const accepted = await prisma.campaignInvoice.findMany({
    where: { campaignId, status: 'ACCEPTED' },
  });

  if (accepted.length === 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        invoiceAmountINR: null,
        invoiceAmountALGO: null,
        invoiceAmountMicroALGO: null,
        invoiceVerificationStatus: 'NOT_SUBMITTED',
        invoiceVerificationReason: null,
        invoiceVerifiedAt: null,
      } as any,
    });
    return;
  }

  let totalInr = 0;
  for (const row of accepted) {
    const v = row.extractedAmountINR;
    if (v != null && Number.isFinite(v) && v > 0) totalInr += v;
  }

  const algoRate = await getAlgoRate();
  const invoiceAmountALGO = totalInr > 0 && algoRate > 0 ? totalInr / algoRate : 0;
  const invoiceAmountMicroALGO = BigInt(Math.max(0, algoToMicroAlgo(invoiceAmountALGO)));

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      invoiceAmountINR: totalInr,
      invoiceAmountALGO,
      invoiceAmountMicroALGO,
      invoiceVerificationStatus: 'APPROVED',
      invoiceVerificationReason: null,
      gstVerified: false,
    } as any,
  });
}
