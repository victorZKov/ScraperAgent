import type { Metadata } from 'next';
import Link from 'next/link';
import SectionWrapper from '@/components/marketing/SectionWrapper';
import CTABanner from '@/components/marketing/CTABanner';

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    'Learn how ScraperAgent collects expert tweets, analyzes them with AI, and delivers daily market intelligence reports to your inbox.',
};

const reportSections = [
  { name: 'Executive Summary', desc: 'A 4-6 sentence overview capturing the dominant market narrative and key divergences' },
  { name: 'Overall Sentiment', desc: 'Market mood from Very Bearish to Very Bullish with a precision score (-1.0 to +1.0)' },
  { name: 'Key Themes', desc: '5+ major themes driving market sentiment, each with specific expert references' },
  { name: 'Trading Signals', desc: '10+ actionable signals with ticker, direction, confidence, timeframe, and rationale' },
  { name: 'Sector Analysis', desc: '4-6 sectors with individual sentiment ratings, summaries, and key tickers' },
  { name: 'Expert Sentiments', desc: 'Per-expert breakdown with key takeaway, detailed analysis, and notable calls' },
  { name: 'Risk Factors', desc: '4+ identified risks with detailed explanations and potential impact assessment' },
  { name: 'Recommendations', desc: '10 prioritized actions with risk levels, timeframes, and reasoning' },
  { name: 'Market Data', desc: 'Real-time price snapshots with 24h changes and volume for all mentioned tickers' },
];

export default function HowItWorksPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center relative">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
            How <span className="text-gradient">ScraperAgent</span> Works
          </h1>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
            From raw expert tweets to actionable market intelligence — our 4-step pipeline
            runs daily to deliver comprehensive analysis to your inbox.
          </p>
        </div>
      </section>

      {/* Step 1: Data Collection */}
      <SectionWrapper title="Step 1: Data Collection">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border border-border-subtle bg-surface/50 p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="w-10 h-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white text-lg font-bold flex items-center justify-center">1</span>
              <h3 className="text-xl font-semibold text-text-primary">Scrape Expert Tweets</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Our scrapers query the Twitter/X syndication API to collect the latest posts from 40+ verified market experts.
              We use parallel scraping (3 concurrent connections) with rate-limit-aware delays to ensure reliable data collection.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 rounded-lg bg-surface-elevated/40 border border-border-subtle/50">
                <p className="text-2xl font-bold text-text-primary">40+</p>
                <p className="text-xs text-text-muted mt-1">Expert accounts tracked</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-surface-elevated/40 border border-border-subtle/50">
                <p className="text-2xl font-bold text-text-primary">500+</p>
                <p className="text-xs text-text-muted mt-1">Tweets collected per run</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-surface-elevated/40 border border-border-subtle/50">
                <p className="text-2xl font-bold text-text-primary">~40s</p>
                <p className="text-xs text-text-muted mt-1">Collection time</p>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-4">
              Expert categories include: macro strategists, fund managers, options flow analysts, breaking news desks, behavioral finance experts, on-chain researchers, and DeFi specialists.
            </p>
          </div>
        </div>
      </SectionWrapper>

      {/* Step 2: AI Analysis */}
      <SectionWrapper title="Step 2: AI Analysis" variant="accent">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border border-border-subtle bg-surface/50 p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="w-10 h-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white text-lg font-bold flex items-center justify-center">2</span>
              <h3 className="text-xl font-semibold text-text-primary">Analyze with AI</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              All collected tweets are fed into our AI engine along with real-time market data
              and recent news headlines. The model processes this information through a structured JSON schema,
              extracting sentiment, identifying trading signals, and synthesizing expert opinions.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated/40 border border-border-subtle/50">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-text-secondary">Sentiment extraction (5-level scale)</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated/40 border border-border-subtle/50">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm text-text-secondary">Trading signal generation</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated/40 border border-border-subtle/50">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-sm text-text-secondary">Theme identification</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated/40 border border-border-subtle/50">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-sm text-text-secondary">Risk factor detection</span>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-4">
              Each expert&apos;s tweets are analyzed individually for sentiment and notable calls, then synthesized
              into a unified market view. The AI accounts for expert weight, known biases, and contrarian tendencies.
            </p>
          </div>
        </div>
      </SectionWrapper>

      {/* Step 3: Report Generation */}
      <SectionWrapper title="Step 3: Report Generation">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border border-border-subtle bg-surface/50 p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="w-10 h-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white text-lg font-bold flex items-center justify-center">3</span>
              <h3 className="text-xl font-semibold text-text-primary">Generate Comprehensive Report</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">
              The AI output is assembled into a structured report containing 9 distinct sections,
              each providing a different angle on the market. Reports are stored in our database
              and rendered into a rich HTML email.
            </p>
            <div className="space-y-3">
              {reportSections.map((section, idx) => (
                <div key={section.name} className="flex gap-3 p-3 rounded-lg bg-surface-elevated/40 border border-border-subtle/50">
                  <span className="text-xs font-mono text-text-faint w-5 shrink-0 mt-0.5">{idx + 1}.</span>
                  <div>
                    <span className="text-sm font-semibold text-text-primary">{section.name}</span>
                    <p className="text-xs text-text-muted mt-0.5">{section.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Step 4: Email Delivery */}
      <SectionWrapper title="Step 4: Email Delivery" variant="accent">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border border-border-subtle bg-surface/50 p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="w-10 h-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white text-lg font-bold flex items-center justify-center">4</span>
              <h3 className="text-xl font-semibold text-text-primary">Deliver to Your Inbox</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              The formatted report is delivered via email at your scheduled time — typically before market open.
              Reports are domain-aware with distinct branding: blue for Market analysis, purple for Crypto analysis.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-lg border-2 border-blue-500/20 bg-blue-500/5">
                <p className="text-sm font-semibold text-blue-400 mb-1">Market Reports</p>
                <p className="text-xs text-text-muted">Traditional equities, ETFs, sectors, macro analysis. Focus on S&P 500, NASDAQ, and global markets.</p>
              </div>
              <div className="p-4 rounded-lg border-2 border-purple-500/20 bg-purple-500/5">
                <p className="text-sm font-semibold text-purple-400 mb-1">Crypto Reports</p>
                <p className="text-xs text-text-muted">Bitcoin, Ethereum, altcoins, DeFi, on-chain data. Focus on Layer 1s, Layer 2s, and DeFi protocols.</p>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-4">
              Every email includes a link to manage your subscription — update preferences, pause, or cancel with one click.
            </p>
          </div>
        </div>
      </SectionWrapper>

      {/* CTA */}
      <SectionWrapper>
        <CTABanner
          heading="Ready to Try It?"
          subtext="Start your free trial today. 10 free reports, no credit card required."
          primaryHref="/subscribe"
          primaryLabel="Start Free Trial"
          secondaryHref="/pricing"
          secondaryLabel="View Pricing"
        />
      </SectionWrapper>
    </div>
  );
}
