'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FloatingCTAProps {
  href: string;
  label: string;
}

export default function FloatingCTA({ href, label }: FloatingCTAProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-background/90 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <p className="text-sm text-text-secondary hidden sm:block">
          Like what you see? Get reports like this delivered daily.
        </p>
        <Link
          href={href}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/20 sm:ml-4"
        >
          {label}
        </Link>
      </div>
    </div>
  );
}
