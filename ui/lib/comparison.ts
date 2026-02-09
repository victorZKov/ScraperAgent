import {
  FullReport,
  TradingSignal,
  ExpertSentiment,
  SectorBreakdown,
} from './types';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ChangeType = 'new' | 'removed' | 'upgraded' | 'downgraded' | 'unchanged';

export interface SentimentDelta {
  before: number;
  after: number;
  change: number;
  scoreBefore: number;
  scoreAfter: number;
  scoreChange: number;
}

export interface SignalDiff {
  ticker: string;
  changeType: ChangeType;
  before?: TradingSignal;
  after?: TradingSignal;
}

export interface ExpertDiff {
  handle: string;
  changeType: ChangeType;
  sentimentBefore?: number;
  sentimentAfter?: number;
  takeawayBefore?: string;
  takeawayAfter?: string;
}

export interface SectorDiff {
  sector: string;
  changeType: ChangeType;
  sentimentBefore?: number;
  sentimentAfter?: number;
  summaryBefore?: string;
  summaryAfter?: string;
}

export interface ThemeChanges {
  added: string[];
  removed: string[];
  kept: string[];
}

export interface ReportComparison {
  olderReport: FullReport;
  newerReport: FullReport;
  sentiment: SentimentDelta;
  signals: SignalDiff[];
  experts: ExpertDiff[];
  sectors: SectorDiff[];
  themes: ThemeChanges;
}

// ─── Core Comparison ─────────────────────────────────────────────────────────

export function compareReports(reportA: FullReport, reportB: FullReport): ReportComparison {
  const [older, newer] = new Date(reportA.GeneratedAt) <= new Date(reportB.GeneratedAt)
    ? [reportA, reportB]
    : [reportB, reportA];

  const beforeAnalysis = older.Analysis;
  const afterAnalysis = newer.Analysis;

  return {
    olderReport: older,
    newerReport: newer,
    sentiment: {
      before: beforeAnalysis.OverallSentiment,
      after: afterAnalysis.OverallSentiment,
      change: afterAnalysis.OverallSentiment - beforeAnalysis.OverallSentiment,
      scoreBefore: beforeAnalysis.SentimentScore,
      scoreAfter: afterAnalysis.SentimentScore,
      scoreChange: afterAnalysis.SentimentScore - beforeAnalysis.SentimentScore,
    },
    signals: computeSignalDiffs(beforeAnalysis.TradingSignals, afterAnalysis.TradingSignals),
    experts: computeExpertDiffs(beforeAnalysis.ExpertSentiments, afterAnalysis.ExpertSentiments),
    sectors: computeSectorDiffs(beforeAnalysis.SectorBreakdown, afterAnalysis.SectorBreakdown),
    themes: computeThemeChanges(beforeAnalysis.KeyThemes, afterAnalysis.KeyThemes),
  };
}

// ─── Signal Diffs ────────────────────────────────────────────────────────────

export function computeSignalDiffs(
  before: TradingSignal[],
  after: TradingSignal[]
): SignalDiff[] {
  const beforeMap = new Map(before.map((s) => [s.Ticker.toUpperCase(), s]));
  const afterMap = new Map(after.map((s) => [s.Ticker.toUpperCase(), s]));
  const allTickers = Array.from(new Set(Array.from(beforeMap.keys()).concat(Array.from(afterMap.keys()))));

  const diffs: SignalDiff[] = [];

  for (const ticker of allTickers) {
    const b = beforeMap.get(ticker);
    const a = afterMap.get(ticker);

    if (!b && a) {
      diffs.push({ ticker: a.Ticker, changeType: 'new', after: a });
    } else if (b && !a) {
      diffs.push({ ticker: b.Ticker, changeType: 'removed', before: b });
    } else if (b && a) {
      let changeType: ChangeType = 'unchanged';
      if (a.Direction > b.Direction) changeType = 'upgraded';
      else if (a.Direction < b.Direction) changeType = 'downgraded';
      diffs.push({ ticker: a.Ticker, changeType, before: b, after: a });
    }
  }

  // Sort: changes first, then unchanged
  const order: Record<ChangeType, number> = {
    new: 0,
    removed: 1,
    upgraded: 2,
    downgraded: 3,
    unchanged: 4,
  };
  diffs.sort((a, b) => order[a.changeType] - order[b.changeType]);

  return diffs;
}

// ─── Expert Diffs ────────────────────────────────────────────────────────────

export function computeExpertDiffs(
  before: ExpertSentiment[],
  after: ExpertSentiment[]
): ExpertDiff[] {
  const beforeMap = new Map(before.map((e) => [e.ExpertHandle.toLowerCase(), e]));
  const afterMap = new Map(after.map((e) => [e.ExpertHandle.toLowerCase(), e]));
  const allHandles = Array.from(new Set(Array.from(beforeMap.keys()).concat(Array.from(afterMap.keys()))));

  const diffs: ExpertDiff[] = [];

  for (const handle of allHandles) {
    const b = beforeMap.get(handle);
    const a = afterMap.get(handle);

    if (!b && a) {
      diffs.push({
        handle: a.ExpertHandle,
        changeType: 'new',
        sentimentAfter: a.Sentiment,
        takeawayAfter: a.KeyTakeaway,
      });
    } else if (b && !a) {
      diffs.push({
        handle: b.ExpertHandle,
        changeType: 'removed',
        sentimentBefore: b.Sentiment,
        takeawayBefore: b.KeyTakeaway,
      });
    } else if (b && a) {
      let changeType: ChangeType = 'unchanged';
      if (a.Sentiment > b.Sentiment) changeType = 'upgraded';
      else if (a.Sentiment < b.Sentiment) changeType = 'downgraded';
      diffs.push({
        handle: a.ExpertHandle,
        changeType,
        sentimentBefore: b.Sentiment,
        sentimentAfter: a.Sentiment,
        takeawayBefore: b.KeyTakeaway,
        takeawayAfter: a.KeyTakeaway,
      });
    }
  }

  // Show changed experts first
  const order: Record<ChangeType, number> = {
    new: 0,
    removed: 1,
    upgraded: 2,
    downgraded: 3,
    unchanged: 4,
  };
  diffs.sort((a, b) => order[a.changeType] - order[b.changeType]);

  return diffs;
}

// ─── Sector Diffs ────────────────────────────────────────────────────────────

export function computeSectorDiffs(
  before: SectorBreakdown[],
  after: SectorBreakdown[]
): SectorDiff[] {
  const beforeMap = new Map(before.map((s) => [s.Sector.toLowerCase(), s]));
  const afterMap = new Map(after.map((s) => [s.Sector.toLowerCase(), s]));
  const allSectors = Array.from(new Set(Array.from(beforeMap.keys()).concat(Array.from(afterMap.keys()))));

  const diffs: SectorDiff[] = [];

  for (const sector of allSectors) {
    const b = beforeMap.get(sector);
    const a = afterMap.get(sector);

    if (!b && a) {
      diffs.push({
        sector: a.Sector,
        changeType: 'new',
        sentimentAfter: a.Sentiment,
        summaryAfter: a.Summary,
      });
    } else if (b && !a) {
      diffs.push({
        sector: b.Sector,
        changeType: 'removed',
        sentimentBefore: b.Sentiment,
        summaryBefore: b.Summary,
      });
    } else if (b && a) {
      let changeType: ChangeType = 'unchanged';
      if (a.Sentiment > b.Sentiment) changeType = 'upgraded';
      else if (a.Sentiment < b.Sentiment) changeType = 'downgraded';
      diffs.push({
        sector: a.Sector,
        changeType,
        sentimentBefore: b.Sentiment,
        sentimentAfter: a.Sentiment,
        summaryBefore: b.Summary,
        summaryAfter: a.Summary,
      });
    }
  }

  const order: Record<ChangeType, number> = {
    new: 0,
    removed: 1,
    upgraded: 2,
    downgraded: 3,
    unchanged: 4,
  };
  diffs.sort((a, b) => order[a.changeType] - order[b.changeType]);

  return diffs;
}

// ─── Theme Changes ───────────────────────────────────────────────────────────

export function computeThemeChanges(before: string[], after: string[]): ThemeChanges {
  const beforeSet = new Set(before.map((t) => t.toLowerCase()));
  const afterSet = new Set(after.map((t) => t.toLowerCase()));

  const added: string[] = [];
  const removed: string[] = [];
  const kept: string[] = [];

  for (const theme of after) {
    if (beforeSet.has(theme.toLowerCase())) {
      kept.push(theme);
    } else {
      added.push(theme);
    }
  }

  for (const theme of before) {
    if (!afterSet.has(theme.toLowerCase())) {
      removed.push(theme);
    }
  }

  return { added, removed, kept };
}

// ─── Display Helpers ─────────────────────────────────────────────────────────

export function changeTypeColor(type: ChangeType): string {
  switch (type) {
    case 'new':
      return 'bg-green-500/20 text-green-400 border border-green-500/30';
    case 'removed':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'upgraded':
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    case 'downgraded':
      return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    case 'unchanged':
      return 'bg-gray-500/20 text-text-muted border border-gray-500/30';
  }
}

export function changeTypeLabel(type: ChangeType): string {
  switch (type) {
    case 'new': return 'New';
    case 'removed': return 'Removed';
    case 'upgraded': return 'Upgraded';
    case 'downgraded': return 'Downgraded';
    case 'unchanged': return 'Unchanged';
  }
}

export function deltaArrow(change: number): string {
  if (change > 0) return '\u2191'; // ↑
  if (change < 0) return '\u2193'; // ↓
  return '\u2194'; // ↔
}

export function deltaColor(change: number): string {
  if (change > 0) return 'text-green-400';
  if (change < 0) return 'text-red-400';
  return 'text-text-muted';
}
