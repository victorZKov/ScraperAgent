'use client';

import { SectorBreakdown } from '@/lib/types';
import SentimentBadge from './SentimentBadge';

interface SectorCardProps {
  sector: SectorBreakdown;
}

export default function SectorCard({ sector }: SectorCardProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm p-5 hover:border-border transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text-primary text-base">{sector.Sector}</h3>
        <SentimentBadge value={sector.Sentiment} size="sm" />
      </div>

      {/* Summary */}
      <p className="text-sm text-text-muted leading-relaxed mb-4">
        {sector.Summary}
      </p>

      {/* Key Tickers */}
      {sector.KeyTickers && sector.KeyTickers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sector.KeyTickers.map((ticker) => (
            <span
              key={ticker}
              className="inline-flex items-center px-2.5 py-1 rounded-md bg-surface-elevated text-text-secondary text-xs font-mono font-semibold border border-border/50"
            >
              {ticker}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
