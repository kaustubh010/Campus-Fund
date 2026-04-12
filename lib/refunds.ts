type DonationLike = {
  id: string;
  amountALGO: number;
  donor: { walletAddress: string | null };
};

export type RefundPlanItem = {
  address: string;
  microAlgos: number;
  donationIds: string[];
};

export function buildRefundPlan(donations: DonationLike[], totalRefundMicroAlgos: number): RefundPlanItem[] {
  if (totalRefundMicroAlgos <= 0 || donations.length === 0) return [];

  const byAddress = new Map<string, { totalMicro: number; donationIds: string[] }>();
  let totalContributionMicro = 0;

  for (const donation of donations) {
    const address = donation.donor.walletAddress;
    if (!address) continue;
    const donationMicro = Math.max(0, Math.round(donation.amountALGO * 1_000_000));
    totalContributionMicro += donationMicro;

    const existing = byAddress.get(address) ?? { totalMicro: 0, donationIds: [] };
    existing.totalMicro += donationMicro;
    existing.donationIds.push(donation.id);
    byAddress.set(address, existing);
  }

  if (totalContributionMicro <= 0 || byAddress.size === 0) return [];

  const addresses = Array.from(byAddress.entries()).map(([address, data]) => ({
    address,
    contributionMicro: data.totalMicro,
    donationIds: data.donationIds,
    refundMicro: Math.floor((data.totalMicro * totalRefundMicroAlgos) / totalContributionMicro),
  }));

  let assigned = addresses.reduce((acc, item) => acc + item.refundMicro, 0);
  let remainder = totalRefundMicroAlgos - assigned;

  let idx = 0;
  while (remainder > 0 && addresses.length > 0) {
    addresses[idx % addresses.length].refundMicro += 1;
    remainder -= 1;
    idx += 1;
  }

  return addresses
    .filter((a) => a.refundMicro > 0)
    .map((a) => ({
      address: a.address,
      microAlgos: a.refundMicro,
      donationIds: a.donationIds,
    }));
}
