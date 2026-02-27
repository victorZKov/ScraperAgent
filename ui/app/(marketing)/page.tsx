'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { PRICING } from '@/lib/pricing';
import { SAMPLE_MARKET_REPORT, SAMPLE_CRYPTO_REPORT } from '@/lib/sample-data';
import SectionWrapper from '@/components/marketing/SectionWrapper';
import CTABanner from '@/components/marketing/CTABanner';
import DomainTabs from '@/components/marketing/DomainTabs';
import SentimentGauge from '@/components/marketing/SentimentGauge';
import PipelineStep from '@/components/marketing/PipelineStep';
import RoadmapItem from '@/components/marketing/RoadmapItem';
import TrustCard from '@/components/marketing/TrustCard';
import SignalsTable from '@/components/SignalsTable';
import ExpertCard from '@/components/ExpertCard';
import SectorCard from '@/components/SectorCard';
import SentimentBadge from '@/components/SentimentBadge';
import { FadeIn } from '@/components/FadeIn';
import { sentimentLabel, directionLabel } from '@/lib/types';

const features = [
  { title: 'Sentiment Analysis', description: 'AI analyzes expert opinions across X to gauge market mood, from Very Bearish to Very Bullish, with a precision score.', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" /></svg> },
  { title: 'Expert Insights', description: 'Track individual expert positions, key takeaways, and notable calls from 40+ market professionals.', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg> },
  { title: 'Trading Signals', description: 'Get 10+ actionable buy/sell/hold signals with confidence levels, timeframes, and expert attribution.', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg> },
  { title: 'Sector Breakdown', description: 'Understand which sectors are heating up or cooling down with sentiment-weighted analysis and key tickers.', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg> },
  { title: 'Risk Factor Analysis', description: 'Identify potential market risks before they materialize with AI-detected warning signals from expert commentary.', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> },
  { title: 'Actionable Recommendations', description: '10 prioritized recommendations with risk levels, timeframes, and detailed reasoning for each action.', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { title: 'Real-Time Market Data', description: 'Price snapshots with 24-hour changes and volume data for all mentioned tickers, contextualizing every signal.', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { title: 'Market & Crypto Coverage', description: 'Separate specialized reports for traditional markets and cryptocurrency, each with domain-specific expert selection and analysis.', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg> },
];

// Bento col spans: alternating wide/narrow pattern
// Row 1: [Sentiment 2-col] [Experts 1-col]
// Row 2: [Signals 1-col] [Sector 2-col]
// Row 3: [Risk 2-col] [Recs 1-col]
// Row 4: [Data 1-col] [Coverage 2-col]
const bentoCols = [2, 1, 1, 2, 2, 1, 1, 2] as const;

const pipelineSteps = [
  { step: 1, title: 'Scrape', description: 'Collect the latest tweets from 40+ verified market experts on X', icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg> },
  { step: 2, title: 'Analyze', description: 'Our AI processes 500+ tweets, identifying sentiment, signals, and themes', icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg> },
  { step: 3, title: 'Synthesize', description: 'Generate a comprehensive report with signals, sectors, and expert breakdowns', icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
  { step: 4, title: 'Deliver', description: 'A formatted report lands in your inbox every morning, ready for your trading day', icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg> },
];

const testimonials = [
  { quote: 'ScraperAgent saves me 2 hours every morning. Instead of scrolling through dozens of expert accounts, I get a synthesized view with actionable signals before the market opens.', attribution: 'Marcus T.', role: 'Day Trader · Dublin' },
  { quote: 'The sentiment analysis is remarkably accurate. The expert attribution gives me confidence in the analysis — I can trace every signal back to a specific voice I already follow.', attribution: 'Petra W.', role: 'Portfolio Manager · London' },
  { quote: 'I use the crypto reports to track DeFi sentiment across experts I would never have time to follow individually. The sector breakdowns are especially valuable.', attribution: 'Jan K.', role: 'Crypto Investor · Berlin' },
];

const roadmapItems: Array<{ quarter: string; title: string; description: string; status: 'completed' | 'in-progress' | 'planned' }> = [
  { quarter: 'Q1 2026', title: 'Web Dashboard', description: 'Browse your report history, compare day-over-day sentiment changes, and filter signals by confidence level.', status: 'in-progress' },
  { quarter: 'Q2 2026', title: 'Custom Expert Lists', description: 'Build your own expert roster, tag by specialty (NASDAQ, DeFi, Commodities...), set priority weights, and share lists with other users.', status: 'planned' },
  { quarter: 'Q2 2026', title: 'Alert System', description: 'Get instant notifications for high-confidence signals and significant sentiment shifts throughout the day.', status: 'planned' },
  { quarter: 'Q3 2026', title: 'Portfolio Integration', description: 'Connect your portfolio for personalized signals and recommendations tailored to your holdings.', status: 'planned' },
  { quarter: 'Q3 2026', title: 'Mobile App', description: 'Full report access on iOS and Android with push notifications for critical signals.', status: 'planned' },
  { quarter: 'Q4 2026', title: 'API Access', description: 'Integrate ScraperAgent signals directly into your own trading tools, dashboards, and workflows.', status: 'planned' },
];

const ease = [0.16, 1, 0.3, 1] as const;

export default function LandingPage() {
  const [previewDomain, setPreviewDomain] = useState<'market' | 'crypto'>('market');
  const report = previewDomain === 'market' ? SAMPLE_MARKET_REPORT : SAMPLE_CRYPTO_REPORT;
  const previewSignals = report.Analysis.TradingSignals.slice(0, 4);

  return (
    <div>
      {/* ── Section 1: Hero ── */}
      <section className="relative overflow-hidden min-h-[90dvh] flex items-center">
        {/* Subtle dot-grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgb(var(--border-subtle) / 0.6) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-16 items-center">

            {/* LEFT: Content */}
            <div className="order-2 lg:order-1">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-subtle bg-surface/60 text-xs text-text-muted mb-6"
              >
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="w-1.5 h-1.5 rounded-full bg-green-500"
                />
                AI Market Intelligence
              </motion.div>

              {/* H1 — no gradient, color hierarchy via text-secondary */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.08, ease }}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.95] mb-6"
              >
                <span className="text-text-primary">Expert market<br />analysis,</span>
                <br />
                <span className="text-text-secondary">delivered daily.</span>
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.16, ease }}
                className="text-base text-text-secondary leading-relaxed max-w-[48ch] mb-8"
              >
                Every morning, our AI reads 40+ market experts on X, synthesizes
                500+ tweets, and delivers actionable intelligence straight to your inbox.
              </motion.p>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.22, ease }}
                className="flex items-center gap-6 mb-8 text-sm"
              >
                <div>
                  <span className="font-bold text-text-primary text-lg font-mono">40+</span>
                  <span className="ml-1.5 text-text-muted">Experts</span>
                </div>
                <div className="w-px h-4 bg-border-subtle" />
                <div>
                  <span className="font-bold text-text-primary text-lg font-mono">500+</span>
                  <span className="ml-1.5 text-text-muted">Tweets/day</span>
                </div>
                <div className="w-px h-4 bg-border-subtle" />
                <div>
                  <span className="font-bold text-text-primary text-lg font-mono">2</span>
                  <span className="ml-1.5 text-text-muted">Domains</span>
                </div>
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.28, ease }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Link
                  href="/subscribe"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 active:scale-[0.98]"
                >
                  Start Free Trial — No Credit Card
                </Link>
                <Link
                  href="#report-preview"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-text-secondary border border-border-subtle hover:bg-surface-elevated/60 transition-all active:scale-[0.98]"
                >
                  See Report Preview
                </Link>
              </motion.div>
            </div>

            {/* RIGHT: Live Intelligence Panel */}
            <div className="order-1 lg:order-2 relative flex justify-center lg:justify-end">
              {/* Decorative blurs */}
              <div className="absolute -top-16 -right-8 w-56 h-56 bg-brand-500/8 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

              {/* Entrance animation wraps the float loop */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease }}
                className="w-full max-w-sm"
              >
                <motion.div
                  animate={{ y: [0, -7, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                  className="relative rounded-2xl border border-border-subtle bg-surface/90 backdrop-blur-xl shadow-2xl p-6"
                  style={{ boxShadow: '0 24px 48px -12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.06)' }}
                >
                  {/* Panel header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ repeat: Infinity, duration: 2.2 }}
                        className="w-2 h-2 rounded-full bg-green-500"
                      />
                      <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Market Pulse</span>
                    </div>
                    {/* Inline domain toggle */}
                    <div className="flex items-center gap-1 rounded-lg bg-surface-sunken/60 p-1">
                      {(['market', 'crypto'] as const).map((d) => (
                        <button
                          key={d}
                          onClick={() => setPreviewDomain(d)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                            previewDomain === d
                              ? 'bg-surface-elevated text-text-primary shadow-sm'
                              : 'text-text-muted hover:text-text-secondary'
                          }`}
                        >
                          {d === 'market' ? 'Market' : 'Crypto'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gauge */}
                  <div className="flex justify-center mb-4">
                    <SentimentGauge
                      score={report.Analysis.SentimentScore}
                      label={sentimentLabel(report.Analysis.OverallSentiment)}
                    />
                  </div>

                  {/* Signal pills grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {previewSignals.map((s) => (
                      <div
                        key={s.Ticker}
                        className="px-3 py-2 rounded-lg bg-surface border border-border-subtle"
                      >
                        <span className="font-bold text-text-primary text-sm font-mono">{s.Ticker}</span>
                        <span className={`ml-2 text-xs font-medium ${
                          s.Direction >= 3 ? 'text-green-500'
                          : s.Direction <= 1 ? 'text-red-400'
                          : 'text-yellow-500'
                        }`}>
                          {directionLabel(s.Direction)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Teaser footer */}
                  <div className="mt-4 pt-4 border-t border-border-subtle/50 text-center">
                    <span className="text-xs text-text-faint">
                      +{report.Analysis.TradingSignals.length - 4} more signals in full report
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 2: Report Preview ── */}
      <SectionWrapper id="report-preview" title="See What a Real Report Looks Like" subtitle="Each report contains executive summaries, trading signals, sector analysis, expert breakdowns, and more." variant="accent">
        <FadeIn>
          <div className="flex justify-center mb-8">
            <DomainTabs activeTab={previewDomain} onTabChange={setPreviewDomain} />
          </div>
          <div className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-base font-semibold text-text-primary">Executive Summary</h3>
              <SentimentBadge value={report.Analysis.OverallSentiment} score={report.Analysis.SentimentScore} size="sm" />
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{report.Analysis.ExecutiveSummary}</p>
          </div>
          <div className="relative">
            <SignalsTable signals={previewSignals} />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent flex items-end justify-center pb-4">
              <Link href="/subscribe" className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/20">
                Subscribe to get {report.Analysis.TradingSignals.length}+ signals daily
              </Link>
            </div>
          </div>
        </FadeIn>
      </SectionWrapper>

      {/* ── Section 3: How It Works ── */}
      <SectionWrapper id="how-it-works" title="From Expert Tweets to Your Inbox in 4 Steps" subtitle="Our pipeline runs daily, scraping, analyzing, and synthesizing market intelligence automatically.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {pipelineSteps.map((step, i) => (
            <FadeIn key={step.step} delay={i * 0.1}>
              <PipelineStep {...step} />
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.35} className="text-center mt-8">
          <Link href="/how-it-works" className="text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors">
            Learn more about our methodology →
          </Link>
        </FadeIn>
      </SectionWrapper>

      {/* ── Section 4: Expert Network ── */}
      <SectionWrapper id="experts" title="Powered by 40+ Expert Voices" subtitle="We track the most influential market commentators on X, from macro strategists to options flow analysts." variant="accent">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {report.Analysis.ExpertSentiments.map((expert, i) => (
            <FadeIn key={expert.ExpertHandle} delay={i * 0.1}>
              <ExpertCard expert={expert} />
            </FadeIn>
          ))}
        </div>
        <FadeIn>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold font-mono">40+</span>
              Experts Tracked
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold font-mono">2</span>
              Domains
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center text-xs font-bold font-mono">500+</span>
              Tweets Daily
            </div>
          </div>
        </FadeIn>
      </SectionWrapper>

      {/* ── Section 5: Sector Analysis ── */}
      <SectionWrapper id="sectors" title="Market Sectors at a Glance" subtitle="Identify where momentum is building and where caution is warranted.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {report.Analysis.SectorBreakdown.map((sector, i) => (
            <FadeIn key={sector.Sector} delay={i * 0.08}>
              <SectorCard sector={sector} />
            </FadeIn>
          ))}
        </div>
      </SectionWrapper>

      {/* ── Section 6: Features — Bento Grid ── */}
      <SectionWrapper id="features" title="What You Get in Every Report" subtitle="Comprehensive market intelligence covering every angle." variant="accent">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => {
            const isWide = bentoCols[i] === 2;
            return (
              <FadeIn
                key={f.title}
                delay={i * 0.06}
                className={isWide ? 'md:col-span-2' : 'md:col-span-1'}
              >
                <div className={`h-full rounded-2xl border border-border-subtle bg-surface/50 hover:bg-surface-elevated/40 transition-all hover:border-border ${isWide ? 'p-8' : 'p-6'}`}>
                  {isWide ? (
                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center flex-shrink-0">
                        {f.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">{f.title}</h3>
                        <p className="text-sm text-text-secondary leading-relaxed max-w-[52ch]">{f.description}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
                        {f.icon}
                      </div>
                      <h3 className="text-base font-semibold text-text-primary mb-2">{f.title}</h3>
                      <p className="text-sm text-text-secondary leading-relaxed">{f.description}</p>
                    </>
                  )}
                </div>
              </FadeIn>
            );
          })}
        </div>
      </SectionWrapper>

      {/* ── Section 7: Roadmap ── */}
      <SectionWrapper id="roadmap" title="What's Coming Next" subtitle="We're building the most comprehensive market intelligence platform.">
        <div className="max-w-2xl mx-auto">
          {roadmapItems.map((item, i) => (
            <FadeIn key={item.title} delay={i * 0.08}>
              <RoadmapItem {...item} />
            </FadeIn>
          ))}
        </div>
      </SectionWrapper>

      {/* ── Section 8: Testimonials — Infinite Marquee ── */}
      <SectionWrapper id="testimonials" title="What Subscribers Are Saying" subtitle="Early adopters are already saving hours every day with ScraperAgent." variant="accent">
        <div className="overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <motion.div
              className="flex"
              style={{ gap: '1.25rem' }}
              animate={{ x: ['0%', '-50%'] }}
              transition={{ repeat: Infinity, duration: 38, ease: 'linear' }}
            >
              {[...testimonials, ...testimonials].map((t, i) => (
                <div
                  key={i}
                  className="w-80 flex-shrink-0 p-6 rounded-2xl border border-border-subtle bg-surface/60 backdrop-blur-sm"
                >
                  {/* Quote mark */}
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400/60 flex items-center justify-center mb-4">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed mb-5 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="border-t border-border-subtle/50 pt-4">
                    <p className="text-sm font-semibold text-text-primary">{t.attribution}</p>
                    <p className="text-xs text-text-muted mt-0.5">{t.role}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </FadeIn>
        </div>
        <FadeIn className="text-center mt-8">
          <p className="text-sm text-text-muted">Join early adopters receiving daily market intelligence</p>
        </FadeIn>
      </SectionWrapper>

      {/* ── Section 9: Trust & Legal ── */}
      <SectionWrapper id="trust" title="Transparent, Compliant, Secure">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
              title: 'Not Financial Advice',
              description: 'ScraperAgent provides AI-synthesized market analysis for informational purposes only. We are not licensed financial advisors. Always do your own research.',
            },
            {
              icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
              title: 'GDPR Compliant',
              description: 'Your data is stored securely. Delete all your data at any time with one click. We never sell or share your information.',
            },
            {
              icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
              title: 'Data Sources',
              description: 'All analysis is derived from publicly available posts on X (Twitter). We aggregate and synthesize — never fabricate data.',
            },
          ].map((card, i) => (
            <FadeIn key={card.title} delay={i * 0.1}>
              <TrustCard icon={card.icon} title={card.title} description={card.description} />
            </FadeIn>
          ))}
        </div>
        <FadeIn className="flex justify-center gap-6 mt-6">
          <div className="flex justify-center gap-6 text-xs text-text-muted">
            <Link href="/disclaimer" className="hover:text-text-secondary transition-colors underline underline-offset-2">Financial Disclaimer</Link>
            <Link href="/privacy" className="hover:text-text-secondary transition-colors underline underline-offset-2">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-text-secondary transition-colors underline underline-offset-2">Terms of Service</Link>
          </div>
        </FadeIn>
      </SectionWrapper>

      {/* ── Section 10: Final CTA ── */}
      <SectionWrapper>
        <FadeIn>
          <CTABanner
            heading={`Start With ${PRICING.trialReports} Free Reports`}
            subtext={`No credit card required. Try for ${PRICING.trialDays} days, then €${PRICING.monthlyPrice}/month for unlimited daily reports. Cancel anytime.`}
            primaryHref="/subscribe"
            primaryLabel="Start Free Trial"
            secondaryHref="/pricing"
            secondaryLabel="View Pricing Details"
          />
        </FadeIn>
      </SectionWrapper>
    </div>
  );
}
