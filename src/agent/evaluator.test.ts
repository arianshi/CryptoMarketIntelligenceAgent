import { test } from "node:test";
import { strict as assert } from "node:assert";
import { plan } from "./planner.js";
import { evaluate } from "./evaluator.js";
const candidate = { symbol: "BTCUSDT", price: 100, changePct: 12, volumeUsd: 10000000 };
test("planner requests news for large movements", () => { assert.deepEqual(plan(candidate), ["historicalData", "newsSearch"]); });
test("evaluation detects incomplete history", () => {
  const result = evaluate([{ candidate, candles: [], articles: [], volatilityPct: null, volumeRatio: null, errors: [] }], [{ symbol: "BTCUSDT", summary: "No verified cause.", signals: [], confidence: 0.3, citations: [] }]);
  assert.equal(result.passed, false);
});
