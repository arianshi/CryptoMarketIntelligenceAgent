import type { Analysis, Evidence, Evaluation } from "../types.js";
export function evaluate(evidence: Evidence[], analyses: Analysis[]): Evaluation {
  const issues: string[] = [];
  if (evidence.length !== analyses.length) issues.push("Evidence/analysis count mismatch");
  for (const e of evidence) {
    if (!Number.isFinite(e.candidate.price) || e.candidate.price <= 0) issues.push(`Invalid price: ${e.candidate.symbol}`);
    if (e.candles.length < 3) issues.push(`Insufficient historical data: ${e.candidate.symbol}`);
    if (e.errors.length) issues.push(`Tool errors for ${e.candidate.symbol}: ${e.errors.join("; ")}`);
    const a = analyses.find((item) => item.symbol === e.candidate.symbol);
    if (!a || !a.summary.trim() || a.confidence < 0 || a.confidence > 1) issues.push(`Invalid analysis: ${e.candidate.symbol}`);
    if (a && a.citations.some((url) => !e.articles.some((article) => article.url === url))) issues.push(`Unverified citation: ${e.candidate.symbol}`);
  }
  return { passed: issues.length === 0, issues };
}
