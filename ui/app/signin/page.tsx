import { signIn } from '@/auth';

export const metadata = { title: 'Sign In' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const redirectTo = callbackUrl ?? '/dashboard';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-xl shadow-brand-500/25 mb-5">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Scraper<span className="text-gradient">Agent</span>
          </h1>
          <p className="text-sm text-text-muted mt-1.5">AI-powered market intelligence</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border-subtle bg-surface p-7 shadow-xl shadow-black/5">
          <h2 className="text-base font-semibold text-text-primary mb-1">Welcome back</h2>
          <p className="text-sm text-text-muted mb-6">
            Sign in to access your dashboard and reports.
          </p>

          <form
            action={async () => {
              'use server';
              await signIn('quantumid', { redirectTo });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-sm font-semibold transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/35"
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              Sign in with QuantumID
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-faint mt-8">
          &copy; 2026{' '}
          <a
            href="https://kovimatic.ie"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors"
          >
            Kovimatic
          </a>
          . Not financial advice.
        </p>
      </div>
    </div>
  );
}
