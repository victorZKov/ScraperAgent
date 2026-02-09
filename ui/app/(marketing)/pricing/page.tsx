import type { Metadata } from 'next';
import Link from 'next/link';
import { PRICING } from '@/lib/pricing';

export const metadata: Metadata = {
  title: 'Pricing',
  description: `ScraperAgent pricing — ${PRICING.trialReports} free reports, then €${PRICING.monthlyPrice}/month for daily AI-powered market intelligence.`,
};

const faqs = [
  {
    q: 'What happens after the free trial?',
    a: `After ${PRICING.trialReports} free reports (or ${PRICING.trialDays} days), you'll be prompted to subscribe. Reports stop until you subscribe — no surprise charges, ever.`,
  },
  {
    q: 'Can I choose which reports I receive?',
    a: 'Yes! Choose between Market analysis, Crypto analysis, or both when you subscribe. Change your preference anytime from your management page.',
  },
  {
    q: 'How do I cancel?',
    a: 'Cancel anytime from your management page (linked in every email). One click, no questions asked. Cancellation takes effect at the end of your billing period.',
  },
  {
    q: 'Can I delete my data?',
    a: "Absolutely. We're GDPR compliant. You can permanently delete all your data from your management page with a single click.",
  },
  {
    q: 'What experts do you track?',
    a: 'We track 40+ experts across categories including macro strategists, fund managers, options flow analysts, breaking news desks, on-chain researchers, and DeFi specialists.',
  },
  {
    q: 'How accurate are the signals?',
    a: "Our signals are AI-generated from expert commentary and should be used as one input among many in your decision-making. AI can be wrong — always do your own research. See our Financial Disclaimer for full details.",
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-text-primary">Simple, Transparent Pricing</h1>
        <p className="mt-3 text-text-secondary">
          Start free. Upgrade when you&apos;re ready.
        </p>
      </div>

      {/* Plan Card */}
      <div className="max-w-md mx-auto rounded-2xl border border-border-subtle bg-surface/50 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-center">
          <p className="text-white font-semibold">
            Free Trial: {PRICING.trialReports} reports in {PRICING.trialDays} days
          </p>
          <p className="text-white/80 text-sm">No credit card required</p>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-text-primary">€{PRICING.monthlyPrice}</span>
              <span className="text-text-muted">/month</span>
            </div>
            <p className="text-sm text-text-muted mt-1">After free trial</p>
          </div>

          <ul className="space-y-3 mb-8">
            {PRICING.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-text-secondary">{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/subscribe"
            className="block w-full text-center px-6 py-3 rounded-xl text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20"
          >
            Start Free Trial
          </Link>
        </div>
      </div>

      {/* Trust signals */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          No surprise charges
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Cancel anytime
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          GDPR compliant
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-16 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-text-primary text-center mb-8">Common Questions</h2>
        <div className="space-y-6">
          {faqs.map(({ q, a }) => (
            <div key={q} className="p-5 rounded-xl border border-border-subtle bg-surface/30">
              <h3 className="font-semibold text-text-primary mb-2">{q}</h3>
              <p className="text-sm text-text-secondary">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center mt-12 text-xs text-text-faint">
        Not financial advice.{' '}
        <Link href="/disclaimer" className="underline underline-offset-2 hover:text-text-muted transition-colors">
          Read our full disclaimer
        </Link>.
      </p>
    </div>
  );
}
