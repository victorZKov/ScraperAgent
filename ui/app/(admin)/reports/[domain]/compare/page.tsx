'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchReport } from '@/lib/api';
import {
  FullReport,
  domainLabel,
  domainColorClass,
  sentimentLabel,
  sentimentTextColor,
  directionLabel,
  directionColor,
} from '@/lib/types';
import SentimentBadge from '@/components/SentimentBadge';
import {
  compareReports,
  ReportComparison,
  changeTypeColor,
  changeTypeLabel,
  deltaArrow,
  deltaColor,
} from '@/lib/comparison';

export default function CompareReportsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const domain = params.domain as 'market' | 'crypto';
  const idA = searchParams.get('a');
  const idB = searchParams.get('b');

  const [comparison, setComparison] = useState<ReportComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!domain || !idA || !idB) {
      setError('Missing report IDs. Please select two reports to compare.');
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [reportA, reportB] = await Promise.all([
          fetchReport(domain, idA!),
          fetchReport(domain, idB!),
        ]);
        setComparison(compareReports(reportA, reportB));
      } catch {
        setError('Failed to load reports for comparison.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [domain, idA, idB]);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-text-faint text-sm">Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <svg className="mx-auto w-12 h-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-400 text-sm mb-4">{error || 'Comparison not available'}</p>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { olderReport, newerReport, sentiment, signals, experts, sectors, themes } = comparison;
  const isMarket = domain === 'market';
  const changedExperts = experts.filter((e) => e.changeType !== 'unchanged');
  const changedSectors = sectors.filter((s) => s.changeType !== 'unchanged');

  return (
    <div className="space-y-8 pb-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-faint">
        <Link href="/dashboard" className="hover:text-text-secondary transition-colors">
          Dashboard
        </Link>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-text-muted">Compare Reports</span>
      </nav>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className={`rounded-xl border ${isMarket ? 'border-blue-500/20' : 'border-purple-500/20'} bg-surface/60 backdrop-blur-sm p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${domainColorClass(domain === 'market' ? 0 : 1)}`}>
            {domainLabel(domain)}
          </span>
          <h1 className="text-2xl font-bold text-text-primary">Report Comparison</h1>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex-1 rounded-lg bg-surface-elevated/50 border border-border/30 p-3">
            <div className="text-xs text-text-faint mb-1">Older Report</div>
            <div className="text-text-secondary font-medium">{formatDate(olderReport.GeneratedAt)}</div>
          </div>
          <svg className="w-6 h-6 text-text-faint shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <div className="flex-1 rounded-lg bg-surface-elevated/50 border border-border/30 p-3">
            <div className="text-xs text-text-faint mb-1">Newer Report</div>
            <div className="text-text-secondary font-medium">{formatDate(newerReport.GeneratedAt)}</div>
          </div>
        </div>
      </div>

      {/* ── Sentiment Overview ──────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Sentiment Overview" icon={
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        } />
        <div className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm p-6">
          <div className="flex items-center justify-center gap-6">
            {/* Before */}
            <div className="text-center">
              <div className="text-xs text-text-faint mb-2">Before</div>
              <SentimentBadge value={sentiment.before} score={sentiment.scoreBefore} size="lg" />
            </div>

            {/* Arrow + Delta */}
            <div className="text-center px-4">
              <div className={`text-3xl font-bold ${deltaColor(sentiment.scoreChange)}`}>
                {deltaArrow(sentiment.scoreChange)}
              </div>
              <div className={`text-sm font-mono mt-1 ${deltaColor(sentiment.scoreChange)}`}>
                {sentiment.scoreChange > 0 ? '+' : ''}{sentiment.scoreChange.toFixed(2)}
              </div>
            </div>

            {/* After */}
            <div className="text-center">
              <div className="text-xs text-text-faint mb-2">After</div>
              <SentimentBadge value={sentiment.after} score={sentiment.scoreAfter} size="lg" />
            </div>
          </div>

          {sentiment.change !== 0 && (
            <div className="mt-4 pt-4 border-t border-border-subtle/50 text-center">
              <span className={`text-sm ${deltaColor(sentiment.change)}`}>
                Sentiment shifted from <span className={`font-medium ${sentimentTextColor(sentiment.before)}`}>{sentimentLabel(sentiment.before)}</span>
                {' '}to{' '}
                <span className={`font-medium ${sentimentTextColor(sentiment.after)}`}>{sentimentLabel(sentiment.after)}</span>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── Trading Signals Diff ────────────────────────────────────────────── */}
      {signals.length > 0 && (
        <section>
          <SectionHeader title="Trading Signals" icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          } />
          <div className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider px-5 py-3">Ticker</th>
                  <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider px-5 py-3">Direction</th>
                  <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider px-5 py-3">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50">
                {signals.map((signal) => (
                  <tr key={signal.ticker} className="hover:bg-surface-elevated/30 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-text-primary font-mono font-semibold text-sm">{signal.ticker}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${changeTypeColor(signal.changeType)}`}>
                        {changeTypeLabel(signal.changeType)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        {signal.before ? (
                          <span className={directionColor(signal.before.Direction)}>
                            {directionLabel(signal.before.Direction)}
                          </span>
                        ) : (
                          <span className="text-text-faint">-</span>
                        )}
                        {signal.before && signal.after && (
                          <svg className="w-4 h-4 text-text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        )}
                        {signal.after ? (
                          <span className={directionColor(signal.after.Direction)}>
                            {directionLabel(signal.after.Direction)}
                          </span>
                        ) : (
                          <span className="text-text-faint">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-text-muted font-mono">
                        {signal.after?.Confidence || signal.before?.Confidence || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Expert Sentiment Shifts ─────────────────────────────────────────── */}
      {changedExperts.length > 0 && (
        <section>
          <SectionHeader title="Expert Sentiment Shifts" icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          } />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {changedExperts.map((expert) => (
              <div
                key={expert.handle}
                className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm p-5 hover:border-border transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-text-primary font-semibold text-sm">@{expert.handle}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${changeTypeColor(expert.changeType)}`}>
                      {changeTypeLabel(expert.changeType)}
                    </span>
                  </div>
                </div>

                {/* Sentiment before/after */}
                <div className="flex items-center gap-3 mb-3">
                  {expert.sentimentBefore !== undefined ? (
                    <SentimentBadge value={expert.sentimentBefore} size="sm" />
                  ) : (
                    <span className="text-xs text-text-faint">-</span>
                  )}
                  {expert.sentimentBefore !== undefined && expert.sentimentAfter !== undefined && (
                    <svg className="w-4 h-4 text-text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                  {expert.sentimentAfter !== undefined ? (
                    <SentimentBadge value={expert.sentimentAfter} size="sm" />
                  ) : (
                    <span className="text-xs text-text-faint">-</span>
                  )}
                </div>

                {/* Takeaways */}
                {(expert.takeawayBefore || expert.takeawayAfter) && (
                  <div className="space-y-2 text-xs">
                    {expert.takeawayBefore && (
                      <div className="rounded-lg bg-surface-elevated/40 p-2.5">
                        <span className="text-text-faint font-medium">Before: </span>
                        <span className="text-text-muted">{expert.takeawayBefore}</span>
                      </div>
                    )}
                    {expert.takeawayAfter && (
                      <div className="rounded-lg bg-surface-elevated/40 p-2.5">
                        <span className="text-text-faint font-medium">After: </span>
                        <span className="text-text-secondary">{expert.takeawayAfter}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Sector Comparison ───────────────────────────────────────────────── */}
      {changedSectors.length > 0 && (
        <section>
          <SectionHeader title="Sector Changes" icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          } />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {changedSectors.map((sector) => (
              <div
                key={sector.sector}
                className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm p-5 hover:border-border transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-text-primary font-semibold text-sm">{sector.sector}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${changeTypeColor(sector.changeType)}`}>
                    {changeTypeLabel(sector.changeType)}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  {sector.sentimentBefore !== undefined ? (
                    <SentimentBadge value={sector.sentimentBefore} size="sm" />
                  ) : (
                    <span className="text-xs text-text-faint">-</span>
                  )}
                  {sector.sentimentBefore !== undefined && sector.sentimentAfter !== undefined && (
                    <svg className="w-4 h-4 text-text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                  {sector.sentimentAfter !== undefined ? (
                    <SentimentBadge value={sector.sentimentAfter} size="sm" />
                  ) : (
                    <span className="text-xs text-text-faint">-</span>
                  )}
                </div>

                {(sector.summaryBefore || sector.summaryAfter) && (
                  <div className="space-y-2 text-xs">
                    {sector.summaryBefore && (
                      <div className="rounded-lg bg-surface-elevated/40 p-2.5">
                        <span className="text-text-faint font-medium">Before: </span>
                        <span className="text-text-muted">{sector.summaryBefore}</span>
                      </div>
                    )}
                    {sector.summaryAfter && (
                      <div className="rounded-lg bg-surface-elevated/40 p-2.5">
                        <span className="text-text-faint font-medium">After: </span>
                        <span className="text-text-secondary">{sector.summaryAfter}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Theme Changes ───────────────────────────────────────────────────── */}
      {(themes.added.length > 0 || themes.removed.length > 0) && (
        <section>
          <SectionHeader title="Theme Changes" icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          } />
          <div className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Added */}
              <div>
                <h4 className="text-xs font-medium text-green-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  Added ({themes.added.length})
                </h4>
                <div className="space-y-2">
                  {themes.added.map((theme, i) => (
                    <div key={i} className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-300">
                      {theme}
                    </div>
                  ))}
                  {themes.added.length === 0 && (
                    <p className="text-xs text-text-faint">None</p>
                  )}
                </div>
              </div>

              {/* Removed */}
              <div>
                <h4 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  Removed ({themes.removed.length})
                </h4>
                <div className="space-y-2">
                  {themes.removed.map((theme, i) => (
                    <div key={i} className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-300">
                      {theme}
                    </div>
                  ))}
                  {themes.removed.length === 0 && (
                    <p className="text-xs text-text-faint">None</p>
                  )}
                </div>
              </div>

              {/* Kept */}
              <div>
                <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-text-muted" />
                  Kept ({themes.kept.length})
                </h4>
                <div className="space-y-2">
                  {themes.kept.map((theme, i) => (
                    <div key={i} className="px-3 py-2 rounded-lg bg-surface-elevated/50 border border-border/30 text-sm text-text-muted">
                      {theme}
                    </div>
                  ))}
                  {themes.kept.length === 0 && (
                    <p className="text-xs text-text-faint">None</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ── Section Header Component ───────────────────────────────────────────────

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <svg className="w-5 h-5 text-text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {icon}
      </svg>
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
    </div>
  );
}
