import { z } from "zod";
import { config } from "../config.js";
import { fetchJson } from "./http.js";
import type { Candidate } from "../types.js";
const ticker = z.object({ symbol: z.string(), lastPrice: z.string(), priceChangePercent: z.string(), quoteVolume: z.string() });
export async function scanMarket(): Promise<Candidate[]> {
  const response = z.array(ticker).parse(await fetchJson(`${config.BINANCE_BASE_URL}/api/v3/ticker/24hr`, config.MAX_TOOL_RETRIES));
  return response.filter((t) => t.symbol.endsWith("USDT") && !/(UP|DOWN|BULL|BEAR)USDT$/.test(t.symbol))
    .map((t) => ({ symbol: t.symbol, price: Number(t.lastPrice), changePct: Number(t.priceChangePercent), volumeUsd: Number(t.quoteVolume) }))
    .filter((t) => Number.isFinite(t.price) && t.price > 0 && Number.isFinite(t.changePct) && Number.isFinite(t.volumeUsd) && t.volumeUsd >= config.MIN_VOLUME_USD && Math.abs(t.changePct) >= config.MIN_ABS_CHANGE_PCT)
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, config.TOP_N);
}
