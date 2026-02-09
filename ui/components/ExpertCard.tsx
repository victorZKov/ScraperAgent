'use client';

import { ExpertSentiment } from '@/lib/types';
import SentimentBadge from './SentimentBadge';

interface ExpertCardProps {
  expert: ExpertSentiment;
}

export default function ExpertCard({ expert }: ExpertCardProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm overflow-hidden hover:border-border transition-all group">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border-subtle/60 flex items-center justify-between bg-surface/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            {expert.ExpertHandle.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-text-primary text-base">
              @{expert.ExpertHandle}
            </h3>
          </div>
        </div>
        <SentimentBadge value={expert.Sentiment} size="sm" />
      </div>

      {/* Key Takeaway */}
      <div className="px-5 py-3 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-b border-border-subtle/30">
        <p className="text-sm text-text-secondary italic leading-relaxed">
          &ldquo;{expert.KeyTakeaway}&rdquo;
        </p>
      </div>

      {/* Detailed Analysis */}
      <div className="px-5 py-4">
        <p className="text-sm text-text-muted leading-relaxed line-clamp-4">
          {expert.DetailedAnalysis}
        </p>
      </div>

      {/* Notable Calls */}
      {expert.NotableCalls && expert.NotableCalls.length > 0 && (
        <div className="px-5 pb-4 flex flex-wrap gap-1.5">
          {expert.NotableCalls.map((call, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2.5 py-1 rounded-md bg-surface-elevated text-text-secondary text-xs font-mono border border-border/50 hover:border-border transition-colors"
            >
              {call}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
