import type { Candidate } from "../types.js";
export type ToolName = "historicalData" | "newsSearch";
export function plan(candidate: Candidate): ToolName[] {
  return Math.abs(candidate.changePct) >= 10 ? ["historicalData", "newsSearch"] : ["historicalData"];
}
