export async function getAlgoRate(): Promise<number> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=inr', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    const data = await res.json();
    return data?.algorand?.inr || 12.75;
  } catch (error) {
    console.warn("Failed to fetch ALGO rate on server", error);
    return 12.75;
  }
}
