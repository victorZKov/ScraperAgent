'use client';

import { useState } from 'react';
import Link from 'next/link';
import { subscribe } from '@/lib/api';
import { PRICING } from '@/lib/pricing';
import type { Subscriber } from '@/lib/types';

type FormState = 'form' | 'success' | 'error';

export default function SubscribePage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [domain, setDomain] = useState<'market' | 'crypto' | 'both'>('both');
  const [state, setState] = useState<FormState>('form');
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await subscribe(email, name || null, domain);
      setSubscriber(res.subscriber);
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setState('error');
    } finally {
      setLoading(false);
    }
  };

  if (state === 'success' && subscriber) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-3">Check your email</h1>
        <p className="text-text-secondary mb-2">
          We&apos;ve sent a confirmation link to{' '}
          <strong className="text-text-primary">{subscriber.Email}</strong>.
        </p>
        <p className="text-sm text-text-muted mb-8">
          Click the link to activate your {PRICING.trialReports}-report free trial — no credit card required.
        </p>
        <Link
          href="/"
          className="text-sm text-text-muted hover:text-text-secondary transition-colors"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-20">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Subscribe to Market Intelligence</h1>
        <p className="mt-2 text-text-secondary">
          {PRICING.trialReports} free reports, no credit card required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1.5">
            Email address *
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 rounded-lg border border-border-subtle bg-surface text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          />
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1.5">
            Name <span className="text-text-faint">(optional)</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-4 py-2.5 rounded-lg border border-border-subtle bg-surface text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          />
        </div>

        {/* Domain Preference */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            What reports do you want?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['market', 'crypto', 'both'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDomain(d)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  domain === d
                    ? d === 'crypto'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                      : d === 'market'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-blue-500 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-text-primary'
                    : 'border-border-subtle text-text-muted hover:bg-surface-elevated/40'
                }`}
              >
                {d === 'market' && (
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Market
                  </span>
                )}
                {d === 'crypto' && (
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Crypto
                  </span>
                )}
                {d === 'both' && (
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                    Both
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {(state === 'error' || error) && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Consent */}
        <p className="text-xs text-text-faint">
          By subscribing, you consent to receiving daily market analysis emails.
          You can unsubscribe or delete your data at any time.
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 rounded-xl text-base font-semibold bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Subscribing...' : 'Start Free Trial'}
        </button>
      </form>
    </div>
  );
}
