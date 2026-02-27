import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import MobileNav from '@/components/marketing/MobileNav';

const navLinks = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/pricing', label: 'Pricing' },
];

const footerProduct = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/subscribe', label: 'Subscribe' },
];

const footerLegal = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/disclaimer', label: 'Financial Disclaimer' },
];

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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/30 transition-shadow">
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

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <ThemeToggle />
              <Link
                href="/subscribe"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/20"
              >
                Start Free Trial
              </Link>
            </nav>

            {/* Mobile nav */}
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-border-subtle/40 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <Link href="/" className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-base font-bold text-text-primary tracking-tight">
                  Scraper<span className="text-gradient">Agent</span>
                </span>
              </Link>
              <p className="text-xs text-text-muted leading-relaxed">
                AI-powered market intelligence from 40+ expert sources, delivered daily to your inbox.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Product</h4>
              <ul className="space-y-2">
                {footerProduct.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Legal</h4>
              <ul className="space-y-2">
                {footerLegal.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a href="https://kovimatic.ie" target="_blank" rel="noopener noreferrer" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                    Kovimatic
                  </a>
                </li>
                <li>
                  <a href="mailto:it@kovimatic.ie" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                    it@kovimatic.ie
                  </a>
                </li>
                <li className="text-xs text-text-faint">Built in Ireland</li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border-subtle/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-text-faint">
              &copy; {new Date().getFullYear()}{' '}
              <a href="https://kovimatic.ie" target="_blank" rel="noopener noreferrer" className="hover:text-text-secondary transition-colors">
                Kovimatic
              </a>
              . All rights reserved.
            </span>
            <div className="flex items-center gap-4">
              <span className="text-xs text-text-faint">Not financial advice</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
