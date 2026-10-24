import { config } from "../config.js";
import type { Report } from "../types.js";
export function formatReport(report: Report): string {
  const lines = [`Crypto Market Intelligence | ${report.generatedAt}`];
  for (const analysis of report.analyses) {
    lines.push("", analysis.symbol, analysis.summary, ...analysis.signals.map((s) => `- ${s}`), `Confidence: ${analysis.confidence.toFixed(2)}`);
    if (analysis.citations.length) lines.push(...analysis.citations.slice(0, 3));
  }
  if (!report.analyses.length) lines.push("No assets met the screening criteria.");
  if (!report.evaluation.passed) lines.push("", "QUALITY WARNING:", ...report.evaluation.issues);
  lines.push("", "Sources: Binance market data; GDELT news discovery. Not investment advice.");
  return lines.join("\n").slice(0, 3900);
}
export async function notify(report: Report): Promise<void> {
  const text = formatReport(report);
  if (!config.TELEGRAM_BOT_TOKEN || !config.TELEGRAM_CHAT_ID) { console.log(text); return; }
  const response = await fetch(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: config.TELEGRAM_CHAT_ID, text }),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Telegram HTTP ${response.status}`);
  const payload = await response.json() as { ok?: boolean };
  if (!payload.ok) throw new Error("Telegram rejected message");
}
