import { z } from "zod";
const schema = z.object({
  TOP_N: z.coerce.number().int().min(1).max(20).default(5),
  MIN_VOLUME_USD: z.coerce.number().nonnegative().default(10000000),
  MIN_ABS_CHANGE_PCT: z.coerce.number().nonnegative().default(5),
  HISTORICAL_DAYS: z.coerce.number().int().min(7).max(180).default(30),
  BINANCE_BASE_URL: z.string().url().default("https://api.binance.com"),
  GDELT_BASE_URL: z.string().url().default("https://api.gdeltproject.org/api/v2/doc/doc"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  RUN_INTERVAL_MINUTES: z.coerce.number().int().min(0).default(0),
  MAX_TOOL_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  REPORT_FILE: z.string().default("reports/latest.json"),
});
export const config = schema.parse(process.env);
