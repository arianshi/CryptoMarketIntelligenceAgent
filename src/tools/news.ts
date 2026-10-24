import { z } from "zod";
import { config } from "../config.js";
import { fetchJson } from "./http.js";
import type { Article } from "../types.js";
const article = z.object({ title: z.string(), url: z.string().url(), seendate: z.string().optional(), domain: z.string().optional() });
export async function searchNews(symbol: string): Promise<Article[]> {
  const asset = symbol.replace(/USDT$/, "");
  const url = new URL(config.GDELT_BASE_URL);
  url.searchParams.set("query", `("${asset}" AND (crypto OR cryptocurrency OR token))`);
  url.searchParams.set("mode", "ArtList");
  url.searchParams.set("format", "json");
  url.searchParams.set("maxrecords", "10");
  url.searchParams.set("timespan", "2d");
  const result = z.object({ articles: z.array(article).optional() }).parse(await fetchJson(url.toString(), config.MAX_TOOL_RETRIES));
  return (result.articles ?? []).map((a) => ({ title: a.title, url: a.url, publishedAt: a.seendate, source: a.domain }));
}
