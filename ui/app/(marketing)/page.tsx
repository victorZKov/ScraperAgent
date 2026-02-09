import Link from 'next/link';
import { PRICING } from '@/lib/pricing';

const features = [
  {
    title: 'Sentiment Analysis',
    description:
      'AI analyzes expert opinions across Twitter to gauge market mood, from Very Bearish to Very Bullish.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
      </svg>
    ),
  },
  {
    title: 'Trading Signals',
    description:
      'Get actionable buy/sell/hold signals with confidence levels and timeframes, backed by expert analysis.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    title: 'Sector Breakdown',
    description:
      'Understand which sectors are heating up or cooling down with sentiment-weighted sector analysis.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
      </svg>
    ),
  },
  {
    title: 'Expert Insights',
    description:
      'Track individual expert positions, key takeaways, and notable calls from 40+ market professionals.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center relative">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary tracking-tight leading-tight">
            AI-Powered Market Intelligence,
            <br />
            <span className="text-gradient">Delivered Daily</span>
          </h1>
          <p className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto">
            Our AI scrapes and analyzes tweets from 40+ market experts every day,
            delivering actionable intelligence straight to your inbox.
          </p>

          {/* Stats */}
          <div className="mt-10 flex items-center justify-center gap-8 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              40+ Experts
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Market & Crypto
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Daily Reports
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/subscribe"
              className="px-8 py-3 rounded-xl text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
            >
              Try Free — No Credit Card Required
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3 rounded-xl text-base font-semibold text-text-secondary border border-border-subtle hover:bg-surface-elevated/60 transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-2xl font-bold text-text-primary text-center mb-12">
          What You Get in Every Report
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-xl border border-border-subtle bg-surface/50 hover:bg-surface-elevated/40 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center p-10 rounded-2xl border border-border-subtle bg-gradient-to-br from-blue-500/5 to-purple-500/5">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Start With {PRICING.trialReports} Free Reports
          </h2>
          <p className="text-text-secondary mb-1">
            No credit card required. Try for {PRICING.trialDays} days.
          </p>
          <p className="text-text-muted text-sm mb-8">
            Then ${PRICING.monthlyPrice}/month for unlimited daily reports.
          </p>
          <Link
            href="/subscribe"
            className="inline-block px-8 py-3 rounded-xl text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20"
          >
            Subscribe Free
          </Link>
        </div>
      </section>
    </div>
  );
}
