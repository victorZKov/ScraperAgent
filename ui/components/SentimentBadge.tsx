'use client';

import { sentimentLabel, sentimentColor } from '@/lib/types';

interface SentimentBadgeProps {
  value: number | string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function SentimentBadge({ value, score, size = 'md' }: SentimentBadgeProps) {
  const label = sentimentLabel(value);
  const color = sentimentColor(value);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide ${color} ${sizeClasses[size]}`}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
      {score !== undefined && (
        <span className="opacity-75 font-mono text-[0.85em]">
          ({score > 0 ? '+' : ''}{score.toFixed(2)})
        </span>
      )}
    </span>
  );
}
