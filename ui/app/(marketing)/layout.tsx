import Link from 'next/link';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Marketing Header */}
      <header className="sticky top-0 z-50 border-b border-border-subtle/60 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                <svg
                  className="w-4.5 h-4.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold text-text-primary tracking-tight">
                Scraper<span className="text-gradient">Agent</span>
              </span>
            </Link>

            <nav className="flex items-center gap-4">
              <Link
                href="/pricing"
                className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/subscribe"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20"
              >
                Subscribe Free
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-border-subtle/40 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-faint">
            <span>
              &copy; 2026{' '}
              <a
                href="https://kovimatic.ie"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-secondary transition-colors"
              >
                Kovimatic
              </a>
            </span>
            <a
              href="mailto:it@kovimatic.ie"
              className="hover:text-text-secondary transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
