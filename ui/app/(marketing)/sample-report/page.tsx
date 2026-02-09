'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SAMPLE_MARKET_REPORT, SAMPLE_CRYPTO_REPORT } from '@/lib/sample-data';
import DomainTabs from '@/components/marketing/DomainTabs';
import FloatingCTA from '@/components/marketing/FloatingCTA';
import SignalsTable from '@/components/SignalsTable';
import ExpertCard from '@/components/ExpertCard';
import SectorCard from '@/components/SectorCard';
import SentimentBadge from '@/components/SentimentBadge';

function FadedSection({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="relative">
      {children}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/90 to-transparent flex flex-col items-center justify-end pb-4 gap-2">
        <p className="text-xs text-text-muted">{label}</p>
        <Link
          href="/subscribe"
          className="px-5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20"
        >
          Subscribe to unlock full reports
        </Link>
      </div>
    </div>
  );
}

export default function SampleReportPage() {
  const [domain, setDomain] = useState<'market' | 'crypto'>('market');
  const report = domain === 'market' ? SAMPLE_MARKET_REPORT : SAMPLE_CRYPTO_REPORT;
  const { Analysis: analysis } = report;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-text-primary mb-3">
          Sample <span className="text-gradient">Report</span>
        </h1>
        <p className="text-text-secondary mb-6">
          A preview of what subscribers receive every morning. Subscribe to get the full report.
        </p>
        <DomainTabs activeTab={domain} onTabChange={setDomain} />
      </div>

      <div className="space-y-10">
        {/* Meta bar */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
          <span className={`px-2.5 py-1 rounded-md font-semibold text-white ${domain === 'market' ? 'bg-blue-600' : 'bg-purple-600'}`}>
            {domain === 'market' ? 'Market' : 'Crypto'}
          </span>
          <span>{report.TweetData.TotalTweetsCollected} tweets analyzed</span>
          <span>{report.TweetData.ExpertsQueried.length} experts queried</span>
        </div>

        {/* Executive Summary — shown in full (teaser) */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-xl font-bold text-text-primary">Executive Summary</h2>
            <SentimentBadge value={analysis.OverallSentiment} score={analysis.SentimentScore} />
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{analysis.ExecutiveSummary}</p>
        </section>

        {/* Market Data — shown in full (small section) */}
        {report.MarketData && report.MarketData.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">Market Data</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {report.MarketData.slice(0, 3).map((md) => (
                <div key={md.Symbol} className="p-3 rounded-lg border border-border-subtle bg-surface/50 text-center">
                  <p className="font-mono font-bold text-text-primary text-sm">{md.Symbol}</p>
                  <p className="text-lg font-semibold text-text-primary">
                    {md.Price >= 1000 ? `$${(md.Price / 1000).toFixed(1)}K` : `$${md.Price.toFixed(2)}`}
                  </p>
                  <p className={`text-xs font-semibold ${md.Change24hPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {md.Change24hPercent >= 0 ? '+' : ''}{md.Change24hPercent.toFixed(2)}%
                  </p>
                </div>
              ))}
              {/* Blurred placeholders for remaining tickers */}
              {report.MarketData.slice(3).map((md) => (
                <div key={md.Symbol} className="p-3 rounded-lg border border-border-subtle bg-surface/50 text-center blur-sm select-none">
                  <p className="font-mono font-bold text-text-primary text-sm">{md.Symbol}</p>
                  <p className="text-lg font-semibold text-text-primary">$---</p>
                  <p className="text-xs font-semibold text-text-muted">+0.00%</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Key Themes — show 2, fade rest */}
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-4">Key Themes ({analysis.KeyThemes.length})</h2>
          <FadedSection label={`${analysis.KeyThemes.length - 2} more themes in the full report`}>
            <div className="space-y-2 pb-16">
              {analysis.KeyThemes.slice(0, 2).map((theme, idx) => (
                <div key={idx} className="flex gap-3 p-3 rounded-lg border border-border-subtle bg-surface/50">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-text-secondary">{theme}</p>
                </div>
              ))}
              {analysis.KeyThemes.slice(2, 4).map((theme, idx) => (
                <div key={idx + 2} className="flex gap-3 p-3 rounded-lg border border-border-subtle bg-surface/50 opacity-40 blur-[1px]">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 3}
                  </span>
                  <p className="text-sm text-text-secondary">{theme}</p>
                </div>
              ))}
            </div>
          </FadedSection>
        </section>

        {/* Trading Signals — show 3 of N, fade rest */}
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-4">
            Trading Signals ({analysis.TradingSignals.length})
          </h2>
          <FadedSection label={`${analysis.TradingSignals.length - 3} more signals in the full report`}>
            <div className="pb-16">
              <SignalsTable signals={analysis.TradingSignals.slice(0, 3)} />
            </div>
          </FadedSection>
        </section>

        {/* Sector Breakdown — show 2 of 4, fade rest */}
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-4">Sector Breakdown ({analysis.SectorBreakdown.length})</h2>
          <FadedSection label={`${analysis.SectorBreakdown.length - 2} more sectors in the full report`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-16">
              {analysis.SectorBreakdown.slice(0, 2).map((sector) => (
                <SectorCard key={sector.Sector} sector={sector} />
              ))}
            </div>
          </FadedSection>
        </section>

        {/* Expert Analysis — show 1 of N, fade rest */}
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-4">
            Expert Analysis ({analysis.ExpertSentiments.length} experts)
          </h2>
          <FadedSection label={`${analysis.ExpertSentiments.length - 1} more expert breakdowns in the full report`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
              <ExpertCard expert={analysis.ExpertSentiments[0]} />
              {analysis.ExpertSentiments.slice(1).map((expert) => (
                <div key={expert.ExpertHandle} className="opacity-30 blur-[2px] select-none">
                  <ExpertCard expert={expert} />
                </div>
              ))}
            </div>
          </FadedSection>
        </section>

        {/* Risk Factors — show 1, hint rest */}
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-4">Risk Factors ({analysis.RiskFactors.length})</h2>
          <FadedSection label={`${analysis.RiskFactors.length - 1} more risk factors in the full report`}>
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5 pb-16">
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm text-text-secondary">
                  <svg className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  {analysis.RiskFactors[0]}
                </li>
                {analysis.RiskFactors.slice(1).map((risk, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-text-secondary opacity-30 blur-[1px] select-none">
                    <svg className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          </FadedSection>
        </section>

        {/* Recommendations — completely locked */}
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-4">Recommendations ({analysis.Recommendations.length})</h2>
          <div className="relative">
            <div className="opacity-20 blur-[3px] select-none space-y-3">
              {analysis.Recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border-subtle bg-surface/50">
                  <p className="text-sm font-semibold text-text-primary">{rec.Action}</p>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <svg className="w-10 h-10 text-text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <p className="text-sm text-text-muted font-medium">{analysis.Recommendations.length} actionable recommendations</p>
              <Link
                href="/subscribe"
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20"
              >
                Subscribe to unlock
              </Link>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="p-4 rounded-lg border border-border-subtle bg-surface/30 text-xs text-text-faint text-center">
          This is sample data for demonstration purposes. Real reports are generated daily from live expert tweets.
          This is not financial advice.{' '}
          <a href="/disclaimer" className="underline underline-offset-2 hover:text-text-muted transition-colors">
            Read our full disclaimer
          </a>.
        </div>
      </div>

      <FloatingCTA href="/subscribe" label="Start Free Trial" />
    </div>
  );
}
