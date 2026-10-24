export interface Candidate { symbol: string; price: number; changePct: number; volumeUsd: number; }
export interface Candle { timestamp: number; close: number; volume: number; }
export interface Article { title: string; url: string; publishedAt?: string; source?: string; }
export interface Evidence { candidate: Candidate; candles: Candle[]; articles: Article[]; volatilityPct: number | null; volumeRatio: number | null; errors: string[]; }
export interface Analysis { symbol: string; summary: string; signals: string[]; confidence: number; citations: string[]; }
export interface Evaluation { passed: boolean; issues: string[]; }
export interface Report { generatedAt: string; candidates: Candidate[]; evidence: Evidence[]; analyses: Analysis[]; evaluation: Evaluation; }
