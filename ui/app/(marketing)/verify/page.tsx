'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyEmail } from '@/lib/api';

type State = 'loading' | 'success' | 'error';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [state, setState] = useState<State>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMsg('No verification token provided.');
      return;
    }
    verifyEmail(token)
      .then(() => setState('success'))
      .catch((err) => {
        setState('error');
        setErrorMsg(err instanceof Error ? err.message : 'Verification failed.');
      });
  }, [token]);

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      {state === 'loading' && (
        <>
          <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-brand-500/30" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-3">Verifying your email…</h1>
        </>
      )}

      {state === 'success' && (
        <>
          <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-3">Email confirmed!</h1>
          <p className="text-text-secondary mb-8">
            You&apos;re all set. Your first report will be on its way shortly.
          </p>
          <Link
            href="/"
            className="text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            Back to home
          </Link>
        </>
      )}

      {state === 'error' && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-3">Link invalid or expired</h1>
          <p className="text-text-secondary mb-8">{errorMsg}</p>
          <Link
            href="/subscribe"
            className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
          >
            Subscribe again
          </Link>
        </>
      )}
    </div>
  );
}
