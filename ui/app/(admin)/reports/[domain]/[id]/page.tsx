'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchReport, resendReportEmail } from '@/lib/api';
import {
  FullReport,
  domainLabel,
  domainColorClass,
  sentimentTextColor,
  riskLevelColor,
} from '@/lib/types';
import SentimentBadge from '@/components/SentimentBadge';
import SignalsTable from '@/components/SignalsTable';
import SectorCard from '@/components/SectorCard';
import ExpertCard from '@/components/ExpertCard';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const domain = params.domain as 'market' | 'crypto';
  const id = params.id as string;

  const [report, setReport] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendResult, setResendResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!domain || !id) return;

    async function load() {
      try {
        const data = await fetchReport(domain, id);
        setReport(data);
      } catch {
        setError('Failed to load report. Make sure the API is running.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [domain, id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-text-faint text-sm">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <svg className="mx-auto w-12 h-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-400 text-sm mb-4">{error || 'Report not found'}</p>
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

  const handleResendEmail = async () => {
    setResending(true);
    setResendResult(null);
    try {
      const result = await resendReportEmail(domain, id);
      setResendResult({ success: true, message: result.message });
    } catch (err) {
      setResendResult({ success: false, message: err instanceof Error ? err.message : 'Failed to send email' });
    } finally {
      setResending(false);
    }
  };

  const { Analysis: analysis, TweetData: tweetData } = report;
  const isMarket = domain === 'market';

  const formatVolume = (vol: number) => {
    if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`;
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
    if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
  };

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
        <span className="text-text-muted">Report</span>
      </nav>

      {/* ── Report Header ─────────────────────────────────────────────────── */}
      <div className={`rounded-xl border ${isMarket ? 'border-blue-500/20' : 'border-purple-500/20'} bg-surface/60 backdrop-blur-sm p-6 ${isMarket ? 'glow-blue' : 'glow-purple'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${domainColorClass(report.Domain)}`}>
                {domainLabel(report.Domain)}
              </span>
              <span className="text-text-faint text-sm">
                {formatDate(report.GeneratedAt)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">
              {isMarket ? 'Market' : 'Crypto'} Analysis Report
            </h1>
          </div>

          <div className="flex items-center gap-6">
            {/* Resend Email */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={handleResendEmail}
                disabled={resending}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                  resending
                    ? 'bg-surface-elevated text-text-faint border-border cursor-not-allowed'
                    : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border-blue-500/30 hover:border-blue-500/50'
                }`}
                title="Resend report via email"
              >
                {resending ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                {resending ? 'Sending...' : 'Resend Email'}
              </button>
              {resendResult && (
                <span className={`text-xs ${resendResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {resendResult.message}
                </span>
              )}
            </div>

            {/* Sentiment Score Gauge */}
            <div className="text-center">
              <div className={`text-3xl font-bold font-mono ${sentimentTextColor(analysis.OverallSentiment)}`}>
                {analysis.SentimentScore > 0 ? '+' : ''}{analysis.SentimentScore.toFixed(2)}
              </div>
              <div className="text-xs text-text-faint mt-0.5">Sentiment Score</div>
            </div>
            <SentimentBadge value={analysis.OverallSentiment} size="lg" />
          </div>
        </div>

        {/* Tweet Data Summary */}
        {tweetData && (
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border-subtle/50 text-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {tweetData.TotalTweetsCollected} tweets analyzed
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {tweetData.ExpertsQueried?.length || 0} experts queried
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Source: {tweetData.DataSource}
            </span>
            {report.ModelUsed && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Model: <span className="font-mono text-text-primary">{report.ModelUsed}</span>
              </span>
            )}
            {report.DurationSeconds != null && report.DurationSeconds > 0 && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Generated in{' '}
                <span className="text-text-primary">
                  {report.DurationSeconds >= 60
                    ? `${Math.floor(report.DurationSeconds / 60)}m ${Math.round(report.DurationSeconds % 60)}s`
                    : `${report.DurationSeconds}s`}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Market Data ──────────────────────────────────────────────────── */}
      {report.MarketData && report.MarketData.length > 0 && (
        <section>
          <SectionHeader title="Market Data" icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          } />
          <div className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {report.MarketData.map((snap) => (
                <div
                  key={snap.Symbol}
                  className="rounded-lg bg-surface-elevated/50 border border-border/30 p-3"
                >
                  <div className="text-xs font-bold text-text-muted mb-1">${snap.Symbol}</div>
                  <div className="text-text-primary font-mono text-sm font-semibold">
                    ${snap.Price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-xs font-mono mt-0.5 ${snap.Change24hPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {snap.Change24hPercent >= 0 ? '+' : ''}{snap.Change24hPercent.toFixed(2)}%
                  </div>
                  {snap.Volume > 0 && (
                    <div className="text-[10px] text-text-faint mt-0.5">
                      Vol: {formatVolume(snap.Volume)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Executive Summary ────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Executive Summary" icon={
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        } />
        <div className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm p-6">
          <p className="text-text-secondary leading-relaxed text-[15px]">
            {analysis.ExecutiveSummary}
          </p>
        </div>
      </section>

      {/* ── News Sources ─────────────────────────────────────────────────── */}
      {report.WebSources && report.WebSources.length > 0 && (
        <section>
          <SectionHeader title="News Sources" icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          } />
          <div className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm p-6">
            <div className="space-y-3">
              {report.WebSources.map((source, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 px-4 py-3 rounded-lg bg-surface-elevated/40 border border-border/30 hover:border-border/40 transition-colors"
                >
                  <svg className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <div className="min-w-0">
                    <a
                      href={source.Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                    >
                      {source.Title}
                    </a>
                    {source.Snippet && (
                      <p className="text-xs text-text-faint mt-1 line-clamp-2">{source.Snippet}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Key Themes ───────────────────────────────────────────────────── */}
      {analysis.KeyThemes && analysis.KeyThemes.length > 0 && (
        <section>
          <SectionHeader title="Key Themes" icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          } />
          <div className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analysis.KeyThemes.map((theme, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 px-4 py-3 rounded-lg bg-surface-elevated/40 border border-border/30"
                >
                  <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isMarket ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                    {idx + 1}
                  </span>
                  <span className="text-sm text-text-secondary">{theme}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Trading Signals ──────────────────────────────────────────────── */}
      {analysis.TradingSignals && analysis.TradingSignals.length > 0 && (
        <section>
          <SectionHeader title="Trading Signals" icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          } />
          <SignalsTable signals={analysis.TradingSignals} />
        </section>
      )}

      {/* ── Sector Breakdown ─────────────────────────────────────────────── */}
      {analysis.SectorBreakdown && analysis.SectorBreakdown.length > 0 && (
        <section>
          <SectionHeader title="Sector Breakdown" icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          } />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.SectorBreakdown.map((sector, idx) => (
              <SectorCard key={idx} sector={sector} />
            ))}
          </div>
        </section>
      )}

      {/* ── Expert Analysis ──────────────────────────────────────────────── */}
      {analysis.ExpertSentiments && analysis.ExpertSentiments.length > 0 && (
        <section>
          <SectionHeader title="Expert Analysis" icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          } />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {analysis.ExpertSentiments.map((expert, idx) => (
              <ExpertCard key={idx} expert={expert} />
            ))}
          </div>
        </section>
      )}

      {/* ── Risk Factors ─────────────────────────────────────────────────── */}
      {analysis.RiskFactors && analysis.RiskFactors.length > 0 && (
        <section>
          <SectionHeader title="Risk Factors" icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          } />
          <div className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm p-6">
            <ul className="space-y-3">
              {analysis.RiskFactors.map((risk, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm text-text-secondary leading-relaxed">{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Recommendations ──────────────────────────────────────────────── */}
      {analysis.Recommendations && analysis.Recommendations.length > 0 && (
        <section>
          <SectionHeader title="Recommendations" icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          } />
          <div className="space-y-3">
            {analysis.Recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm p-5 hover:border-border transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${isMarket ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-text-primary font-semibold text-[15px]">{rec.Action}</h4>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${riskLevelColor(rec.RiskLevel)}`}>
                          {rec.RiskLevel} RISK
                        </span>
                        <span className="text-xs text-text-faint font-mono">{rec.Timeframe}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-text-muted leading-relaxed ml-10">
                  {rec.Reasoning}
                </p>
              </div>
            ))}
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
