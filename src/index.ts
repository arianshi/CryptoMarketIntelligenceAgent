import "dotenv/config";
import { config } from "./config.js";
import { agent } from "./agent/workflow.js";
let running = false;
async function run(): Promise<void> {
  if (running) { console.warn("Previous scan still running; skipping overlapping execution."); return; }
  running = true;
  try {
    const state = await agent.invoke({}, { recursionLimit: 50 });
    console.log(`Scan complete: ${state.candidates.length} assets; quality passed: ${state.evaluation.passed}`);
  } catch (error) {
    console.error("Agent execution failed:", error);
    process.exitCode = 1;
  } finally { running = false; }
}
await run();
if (config.RUN_INTERVAL_MINUTES > 0) {
  setInterval(() => { void run(); }, config.RUN_INTERVAL_MINUTES * 60_000);
}
