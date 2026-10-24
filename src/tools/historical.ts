import type { Candle } from '../types.js';
export async function getHistoricalPrices(_symbol: string): Promise<Candle[]> { return []; }
export function historicalMetrics(_candles: Candle[]) { return { volatilityPct: null, volumeRatio: null }; }
