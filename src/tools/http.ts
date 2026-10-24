export async function fetchJson(url: string, retries = 2): Promise<unknown> {
  let last: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "CryptoMarketIntelligenceAgent/0.2" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${new URL(url).host}`);
      return await response.json();
    } catch (error) {
      last = error;
      if (i < retries) await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** i));
    }
  }
  throw last;
}
