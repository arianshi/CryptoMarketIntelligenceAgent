import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { scanMarket } from "../tools/market.js";
import { getHistoricalPrices, historicalMetrics } from "../tools/historical.js";
import { searchNews } from "../tools/news.js";
import { plan } from "./planner.js";
import { reason } from "./reasoner.js";
import { evaluate } from "./evaluator.js";
import { notify } from "../tools/notify.js";
import { config } from "../config.js";
import type { Analysis, Candidate, Evidence, Evaluation, Report } from "../types.js";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
const State = Annotation.Root({
  candidates: Annotation<Candidate[]>({ reducer: (_, next) => next, default: () => [] }),
  evidence: Annotation<Evidence[]>({ reducer: (_, next) => next, default: () => [] }),
  analyses: Annotation<Analysis[]>({ reducer: (_, next) => next, default: () => [] }),
  evaluation: Annotation<Evaluation>({ reducer: (_, next) => next, default: () => ({ passed: false, issues: [] }) }),
  attempt: Annotation<number>({ reducer: (_, next) => next, default: () => 0 }),
});
async function investigate(candidate: Candidate): Promise<Evidence> {
  const tools = plan(candidate);
  const errors: string[] = [];
  const [historical, news] = await Promise.allSettled([
    getHistoricalPrices(candidate.symbol),
    tools.includes("newsSearch") ? searchNews(candidate.symbol) : Promise.resolve([]),
  ]);
  const candles = historical.status === "fulfilled" ? historical.value : [];
  const articles = news.status === "fulfilled" ? news.value : [];
  if (historical.status === "rejected") errors.push(`historicalData: ${String(historical.reason)}`);
  if (news.status === "rejected") errors.push(`newsSearch: ${String(news.reason)}`);
  return { candidate, candles, articles, ...historicalMetrics(candles), errors };
}
export const agent = new StateGraph(State)
  .addNode("scan", async () => ({ candidates: await scanMarket() }))
  .addNode("investigate", async (s) => ({ evidence: await Promise.all(s.candidates.map(investigate)) }))
  .addNode("reason", async (s) => ({ analyses: await Promise.all(s.evidence.map(reason)) }))
  .addNode("evaluate", async (s) => ({ evaluation: evaluate(s.evidence, s.analyses), attempt: s.attempt + 1 }))
  .addNode("deliver", async (s) => {
    const report: Report = { generatedAt: new Date().toISOString(), candidates: s.candidates, evidence: s.evidence, analyses: s.analyses, evaluation: s.evaluation };
    await mkdir(dirname(config.REPORT_FILE), { recursive: true });
    await writeFile(config.REPORT_FILE, JSON.stringify(report, null, 2));
    await notify(report);
    return {};
  })
  .addEdge(START, "scan")
  .addEdge("scan", "investigate")
  .addEdge("investigate", "reason")
  .addEdge("reason", "evaluate")
  .addConditionalEdges("evaluate", (s) => !s.evaluation.passed && s.attempt <= config.MAX_TOOL_RETRIES ? "investigate" : "deliver", ["investigate", "deliver"])
  .addEdge("deliver", END)
  .compile();
