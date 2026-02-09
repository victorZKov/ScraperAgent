// ─── Enums ───────────────────────────────────────────────────────────────────

export enum Sentiment {
  VeryBearish = 0,
  Bearish = 1,
  Neutral = 2,
  Bullish = 3,
  VeryBullish = 4,
}

export enum Direction {
  StrongSell = 0,
  Sell = 1,
  Hold = 2,
  Buy = 3,
  StrongBuy = 4,
}

export enum Domain {
  Market = 0,
  Crypto = 1,
}

// ─── Enum Helpers ────────────────────────────────────────────────────────────

export function sentimentLabel(value: number | string): string {
  if (typeof value === 'string') return value;
  const labels: Record<number, string> = {
    0: 'Very Bearish',
    1: 'Bearish',
    2: 'Neutral',
    3: 'Bullish',
    4: 'Very Bullish',
  };
  return labels[value] ?? 'Unknown';
}

export function sentimentColor(value: number | string): string {
  const num = typeof value === 'string'
    ? ['Very Bearish', 'Bearish', 'Neutral', 'Bullish', 'Very Bullish'].indexOf(value)
    : value;
  const colors: Record<number, string> = {
    0: 'bg-red-600 text-white',
    1: 'bg-orange-500 text-white',
    2: 'bg-yellow-500 text-gray-900',
    3: 'bg-green-500 text-white',
    4: 'bg-emerald-600 text-white',
  };
  return colors[num] ?? 'bg-gray-500 text-white';
}

export function sentimentTextColor(value: number | string): string {
  const num = typeof value === 'string'
    ? ['Very Bearish', 'Bearish', 'Neutral', 'Bullish', 'Very Bullish'].indexOf(value)
    : value;
  const colors: Record<number, string> = {
    0: 'text-red-500',
    1: 'text-orange-500',
    2: 'text-yellow-500',
    3: 'text-green-500',
    4: 'text-emerald-500',
  };
  return colors[num] ?? 'text-text-faint';
}

export function directionLabel(value: number): string {
  const labels: Record<number, string> = {
    0: 'Strong Sell',
    1: 'Sell',
    2: 'Hold',
    3: 'Buy',
    4: 'Strong Buy',
  };
  return labels[value] ?? 'Unknown';
}

export function directionColor(value: number): string {
  const colors: Record<number, string> = {
    0: 'text-red-600 font-bold',
    1: 'text-red-500',
    2: 'text-yellow-500',
    3: 'text-green-500',
    4: 'text-green-600 font-bold',
  };
  return colors[value] ?? 'text-text-faint';
}

export function domainLabel(value: number | string): string {
  if (typeof value === 'string') {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  return value === 0 ? 'Market' : 'Crypto';
}

export function domainSlug(value: number): 'market' | 'crypto' {
  return value === 0 ? 'market' : 'crypto';
}

export function domainColorClass(value: number | string): string {
  const isMarket = value === 0 || value === 'market' || value === 'Market';
  return isMarket
    ? 'bg-blue-600 text-white'
    : 'bg-purple-600 text-white';
}

export function domainBorderClass(value: number | string): string {
  const isMarket = value === 0 || value === 'market' || value === 'Market';
  return isMarket
    ? 'border-blue-600/30'
    : 'border-purple-600/30';
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TradingSignal {
  Ticker: string;
  Direction: number;
  Confidence: string;
  Timeframe: string;
  Rationale: string;
  SourceExperts: string[];
  SourceTweetUrls: string[];
}

export interface SectorBreakdown {
  Sector: string;
  Sentiment: number;
  Summary: string;
  KeyTickers: string[];
}

export interface ExpertSentiment {
  ExpertHandle: string;
  Sentiment: number;
  KeyTakeaway: string;
  DetailedAnalysis: string;
  NotableCalls: string[];
}

export interface Recommendation {
  Action: string;
  RiskLevel: string;
  Timeframe: string;
  Reasoning: string;
}

export interface Analysis {
  ExecutiveSummary: string;
  OverallSentiment: number;
  SentimentScore: number;
  KeyThemes: string[];
  TradingSignals: TradingSignal[];
  SectorBreakdown: SectorBreakdown[];
  ExpertSentiments: ExpertSentiment[];
  RiskFactors: string[];
  Recommendations: Recommendation[];
}

export interface ExpertAccount {
  Handle: string;
  DisplayName: string;
  Category: string;
}

export interface TweetData {
  TotalTweetsCollected: number;
  ExpertsQueried: ExpertAccount[];
  DataSource: string;
}

export interface MarketDataSnapshot {
  Symbol: string;
  Price: number;
  Change24hPercent: number;
  Volume: number;
}

export interface WebSource {
  Title: string;
  Url: string;
  Snippet: string;
}

export interface FullReport {
  Id: string;
  Domain: number;
  GeneratedAt: string;
  EmailSent: boolean;
  ModelUsed?: string;
  DurationSeconds?: number;
  Analysis: Analysis;
  TweetData: TweetData;
  MarketData?: MarketDataSnapshot[];
  WebSources?: WebSource[];
}

export interface ReportMetadata {
  Id: string;
  GeneratedAt: string;
  Domain: number;
  TweetsAnalyzed: number;
  ExpertsIncluded: number;
  OverallSentiment: string;
  SentimentScore: number;
  ModelUsed: string;
  DurationSeconds: number;
}

export interface JobStatus {
  jobId: string;
  status: 'Queued' | 'Running' | 'Completed' | 'Failed';
  reportId?: string;
  reportUrl?: string;
  error?: string;
}

export interface TriggerResponse {
  success: boolean;
  jobId: string;
  statusUrl: string;
}

export interface ReportsListResponse {
  reports: ReportMetadata[];
  total: number;
}

// ─── Confidence Level Helpers ────────────────────────────────────────────────

export function confidenceColor(confidence: string): string {
  switch (confidence.toUpperCase()) {
    case 'HIGH':
      return 'text-green-400';
    case 'MEDIUM':
      return 'text-yellow-400';
    case 'LOW':
      return 'text-red-400';
    default:
      return 'text-text-muted';
  }
}

export function riskLevelColor(risk: string): string {
  switch (risk.toUpperCase()) {
    case 'HIGH':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'MEDIUM':
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    case 'LOW':
      return 'bg-green-500/20 text-green-400 border border-green-500/30';
    default:
      return 'bg-gray-500/20 text-text-muted border border-gray-500/30';
  }
}

// ─── Configuration Types ────────────────────────────────────────────────────

export interface ExpertConfig {
  Id: number;
  Handle: string;
  DisplayName: string;
  Category: string;
  IsVerified: boolean;
  Weight: number;
  Bias: string;
  IsContrarian: boolean;
  Domain: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface EmailRecipientConfig {
  Id: number;
  Email: string;
  Domain: string;
  IsActive: boolean;
  CreatedAt: string;
}

export interface ExpertsListResponse {
  experts: ExpertConfig[];
  total: number;
}

export interface RecipientsListResponse {
  recipients: EmailRecipientConfig[];
  total: number;
}

export interface AIModelConfig {
  Id: number;
  Name: string;
  Provider: string;
  Endpoint: string;
  ApiKey: string;
  DeploymentName: string;
  IsDefault: boolean;
  Domain: string;
  IsActive: boolean;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface AIModelsListResponse {
  models: AIModelConfig[];
  total: number;
}

// ─── Schedule Types ─────────────────────────────────────────────────────────

export interface ScheduleConfig {
  Id: number;
  Name: string;
  CronExpression: string;
  Domain: string;
  Timezone: string;
  IsEnabled: boolean;
  LastRunAt: string | null;
  NextRunAt: string | null;
  LastRunJobId: string | null;
  LastRunStatus: string | null;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface SchedulesListResponse {
  schedules: ScheduleConfig[];
  total: number;
}

export interface SchedulePreset {
  label: string;
  cron: string;
}

// ─── Subscriber Types ──────────────────────────────────────────────────────

export interface Subscriber {
  Id: number;
  Email: string;
  Name: string | null;
  DomainPreference: 'market' | 'crypto' | 'both';
  Status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  TrialReportsUsed: number;
  TrialReportsLimit: number;
  TrialExpiresAt: string | null;
  EmailVerified: boolean;
  CreatedAt: string;
  ManagementToken: string;
}

export interface SubscribeResponse {
  success: boolean;
  subscriber: Subscriber;
}

export interface SubscriberStats {
  TotalSubscribers: number;
  TrialSubscribers: number;
  ActiveSubscribers: number;
  CancelledSubscribers: number;
  ExpiredSubscribers: number;
  MarketOnly: number;
  CryptoOnly: number;
  Both: number;
}

export const SCHEDULE_PRESETS: SchedulePreset[] = [
  { label: 'Every day at 8:00 AM', cron: '0 8 * * *' },
  { label: 'Every day at 6:00 PM', cron: '0 18 * * *' },
  { label: 'Twice daily (8AM & 6PM)', cron: '0 8,18 * * *' },
  { label: 'Weekdays at 7:30 AM', cron: '30 7 * * 1-5' },
  { label: 'Weekly Monday 9:00 AM', cron: '0 9 * * 1' },
  { label: 'Every 6 hours', cron: '0 */6 * * *' },
  { label: 'Every 2 hours', cron: '0 */2 * * *' },
  { label: 'Custom', cron: '' },
];
