# Crypto Market Intelligence Agent

An English-language, TypeScript cryptocurrency intelligence agent. It scans the Binance spot market for large 24-hour movements, investigates historical price/volume data, searches news for major movers, generates cautious summaries, evaluates quality, and optionally sends a Telegram notification. **It never executes trades.**

## Architecture

```text
Scheduler -> Scan -> Plan / Investigate (historical + news tools)
                  -> Reason (OpenAI optional; deterministic fallback)
                  -> Evaluate -> retry investigation if necessary
                  -> Save JSON report -> Telegram / console
```

The workflow uses LangGraph. The planner currently selects tools using transparent thresholds; LLM reasoning is available when configured. This is not an unconstrained autonomous planner.

## Quick start

Requires Node.js 20+.

```bash
npm install
cp .env.example .env
npm run check
npm test
npm run dev
```

A report is saved to `reports/latest.json`. With no Telegram credentials, the report prints to the console.

## Configuration

See `.env.example`. Set `OPENAI_API_KEY` for LLM summaries, and `TELEGRAM_BOT_TOKEN` plus `TELEGRAM_CHAT_ID` for Telegram delivery. Set `RUN_INTERVAL_MINUTES=1440` for a daily interval while the process stays alive; production scheduling should use an external scheduler with persistent execution state.

## Data sources and caveats

- Binance public spot 24-hour ticker and daily candle APIs.
- GDELT news article discovery for major movers. Headlines are not independently verified.
- Historical daily volatility uses completed candle returns; latest candle volume may be partial.
- LLM-generated explanations must be treated as hypotheses, not proven causes.
- Failed tool requests are retried with exponential backoff. Evaluation failures trigger bounded re-investigation and are explicitly marked in reports.
- Telegram delivery errors propagate to the process. No persistent notification retry queue or exactly-once delivery guarantee exists yet.
- No exchange keys or trading functionality are required.

## Planned production hardening

Durable BullMQ jobs, PostgreSQL/TimescaleDB history, idempotent notifications, metrics/tracing, integration tests with mocked providers, rate limiting, source-specific circuit breakers, stronger claim-level fact checking, and deployment automation.
