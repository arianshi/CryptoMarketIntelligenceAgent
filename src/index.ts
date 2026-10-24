import "dotenv/config";
import { z } from "zod";

const Ticker = z.object({
  symbol: z.string(),
  lastPrice: z.string(),
  priceChangePercent: z.string(),
  quoteVolume: z.string(),
});
type Ticker = z.infer<typeof Ticker>;

type Candidate = {
  symbol: string;
  price: number;
  changePct: number;
  volumeUsd: number;
};

async function fetchJson(url: string, attempts = 3): Promise<unknown> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
    }
  }
  throw new Error("Unreachable retry state");
}

async function scanMarket(): Promise<Candidate[]> {
  const response = await fetchJson("https://api.binance.com/api/v3/ticker/24hr");
  const tickers = z.array(Ticker).parse(response);
  const minVolume = Number(process.env.MIN_VOLUME_USD ?? 10000000);
  const minChange = Number(process.env.MIN_ABS_CHANGE_PCT ?? 5);
  const limit = Math.max(1, Math.min(30, Number(process.env.TOP_N ?? 5)));

  return tickers
    .filter((t) => t.symbol.endsWith("USDT"))
    .map((t) => ({
      symbol: t.symbol,
      price: Number(t.lastPrice),
      changePct: Number(t.priceChangePercent),
      volumeUsd: Number(t.quoteVolume),
    }))
    .filter((t) =>
      Number.isFinite(t.price) && t.price > 0 &&
      Number.isFinite(t.changePct) &&
      Number.isFinite(t.volumeUsd) &&
      t.volumeUsd >= minVolume && Math.abs(t.changePct) >= minChange
    )
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, limit);
}

function plan(candidate: Candidate): string[] {
  const tools = ["marketData", "historicalData"];
  if (Math.abs(candidate.changePct) >= 10) tools.push("newsSearch");
  return tools;
}

function evaluate(candidates: Candidate[]): void {
  const seen = new Set<string>();
  for (const item of candidates) {
    if (seen.has(item.symbol)) throw new Error("Duplicate market symbol");
    seen.add(item.symbol);
    if (!Number.isFinite(item.price) || item.price <= 0 || !Number.isFinite(item.changePct)) {
      throw new Error(`Invalid price data: ${item.symbol}`);
    }
  }
}

function buildReport(candidates: Candidate[]): string {
  const timestamp = new Date().toISOString();
  if (!candidates.length) return `Crypto Market Intelligence — ${timestamp}\nNo assets matched the configured thresholds.`;
  const lines = candidates.map((item, index) => {
    const direction = item.changePct >= 0 ? "+" : "";
    return `${index + 1}. ${item.symbol}: ${direction}${item.changePct.toFixed(2)}% (24h), price $${item.price}, volume $${Math.round(item.volumeUsd).toLocaleString("en-US")}\n   Planned tools: ${plan(item).join(", ")}`;
  });
  return [`Crypto Market Intelligence — ${timestamp}`, ...lines, "Source: Binance 24h tickers. Market movements are not proof of causation.", "News and historical analysis are planned but not yet connected."].join("\n");
}

async function notify(report: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log(report);
    console.log("\nTelegram delivery skipped: credentials are not configured.");
    return;
  }
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: report }),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Telegram delivery failed (HTTP ${response.status})`);
  const result = z.object({ ok: z.boolean() }).parse(await response.json());
  if (!result.ok) throw new Error("Telegram reported an unsuccessful delivery");
}

async function main(): Promise<void> {
  const candidates = await scanMarket();
  evaluate(candidates);
  await notify(buildReport(candidates));
}

main().catch((error: unknown) => {
  console.error("Agent execution failed:", error);
  process.exitCode = 1;
});
