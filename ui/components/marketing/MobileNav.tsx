'use client';

import { useState } from 'react';
import Link from 'next/link';

const navLinks = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/pricing', label: 'Pricing' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-text-muted hover:text-text-primary transition-colors"
        aria-label="Toggle menu"
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border-subtle z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors py-2"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/subscribe"
              onClick={() => setOpen(false)}
              className="mt-1 px-4 py-2.5 rounded-lg text-sm font-medium text-center bg-gradient-to-r from-brand-500 to-brand-600 text-white"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
