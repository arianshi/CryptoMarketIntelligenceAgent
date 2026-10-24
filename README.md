# Crypto Market Intelligence Agent

A TypeScript-based market intelligence agent that scans liquid cryptocurrency markets, investigates unusual movements, evaluates evidence, and optionally sends a Telegram report.

## Architecture

Scheduler -> Market Scanner -> Planner -> Market/Historical/News Tools -> Reasoner -> Evaluator -> Notification

The initial implementation uses transparent, deterministic planning and summarization. An LLM-based planning layer can be added later behind the same interfaces. It does not trade.

## Quick start

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Run `npm run dev` for a one-time report.
5. Configure Telegram credentials to enable delivery.

## Configuration

- `TOP_N`: Maximum number of assets in the report, default 5.
- `MIN_VOLUME_USD`: Minimum 24-hour quoted volume, default 10000000.
- `MIN_ABS_CHANGE_PCT`: Absolute 24-hour percentage change threshold, default 5.
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`: Both required for Telegram delivery.

Market data comes from Binance public market endpoints. This is a research tool, not investment advice.

## Roadmap

- LLM-assisted evidence-aware planning with structured tool calls
- News search adapters and citation-backed event analysis
- Historical price anomaly baselines
- Durable job scheduling, queues, retries, and deduplication
- Evaluation metrics, tracing, persistent storage, and tests
