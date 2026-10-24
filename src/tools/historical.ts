import { config } from "../config.js";
import { fetchJson } from "./http.js";
import type { Candle } from "../types.js";

export async function getHistoricalPrices(symbol: string): Promise<Candle[]> {
  const endpoint = new URL(config.BINANCE_BASE_URL + "/api/v3/klines");
  endpoint.searchParams.set("symbol", symbol);
  endpoint.searchParams.set("interval", "1d");
  endpoint.searchParams.set("limit", String(config.HISTORICAL_DAYS + 1));
  const rows = await fetchJson(endpoint.toString(), config.MAX_TOOL_RETRIES);
  if (!Array.isArray(rows)) throw new Error("Unexpected candle response");
  return rows.map((entry: unknown) => {
    if (!Array.isArray(entry) || entry.length < 6) throw new Error("Invalid candle");
    return { timestamp: Number(entry[0]), close: Number(entry[4]), volume: Number(entry[5]) };
  }).filter((c: Candle) => Number.isFinite(c.close) && c.close > 0 && Number.isFinite(c.volume));
}
export function historicalMetrics(candles: Candle[]): { volatilityPct: number | null; volumeRatio: number | null } {
  if (candles.length < 3) return { volatilityPct: null, volumeRatio: null };
  const previous = candles.slice(0, -1);
  const changes = previous.slice(1).map((c, i) => (c.close / previous[i]!.close - 1) * 100);
  const avg = changes.reduce((a, b) => a + b, 0) / changes.length;
  const volatilityPct = Math.sqrt(changes.reduce((a, b) => a + (b - avg) ** 2, 0) / changes.length);
  const baseline = previous.reduce((a, b) => a + b.volume, 0) / previous.length;
  return { volatilityPct, volumeRatio: baseline > 0 ? candles[candles.length - 1]!.volume / baseline : null };
}
