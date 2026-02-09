'use client';

import {
  TradingSignal,
  directionLabel,
  directionColor,
  confidenceColor,
} from '@/lib/types';

interface SignalsTableProps {
  signals: TradingSignal[];
}

export default function SignalsTable({ signals }: SignalsTableProps) {
  if (!signals || signals.length === 0) {
    return (
      <div className="text-text-faint text-center py-8 border border-border-subtle rounded-lg bg-surface/50">
        No trading signals available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-surface/80">
            <th className="text-left px-4 py-3 text-text-muted font-semibold uppercase tracking-wider text-xs">
              Ticker
            </th>
            <th className="text-left px-4 py-3 text-text-muted font-semibold uppercase tracking-wider text-xs">
              Direction
            </th>
            <th className="text-left px-4 py-3 text-text-muted font-semibold uppercase tracking-wider text-xs">
              Confidence
            </th>
            <th className="text-left px-4 py-3 text-text-muted font-semibold uppercase tracking-wider text-xs">
              Timeframe
            </th>
            <th className="text-left px-4 py-3 text-text-muted font-semibold uppercase tracking-wider text-xs">
              Rationale
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle/50">
          {signals.map((signal, idx) => (
            <tr
              key={`${signal.Ticker}-${idx}`}
              className="hover:bg-surface-elevated/40 transition-colors"
            >
              <td className="px-4 py-3">
                <span className="font-mono font-bold text-text-primary bg-surface-elevated px-2 py-0.5 rounded">
                  {signal.Ticker}
                </span>
              </td>
              <td className={`px-4 py-3 font-semibold ${directionColor(signal.Direction)}`}>
                <span className="flex items-center gap-1.5">
                  {signal.Direction >= 3 ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  ) : signal.Direction <= 1 ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  )}
                  {directionLabel(signal.Direction)}
                </span>
              </td>
              <td className={`px-4 py-3 font-semibold ${confidenceColor(signal.Confidence)}`}>
                {signal.Confidence}
              </td>
              <td className="px-4 py-3 text-text-secondary font-mono text-xs">
                {signal.Timeframe}
              </td>
              <td className="px-4 py-3 text-text-muted max-w-md">
                <p className="line-clamp-2">{signal.Rationale}</p>
                {signal.SourceExperts && signal.SourceExperts.length > 0 && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {signal.SourceExperts.map((expert) => (
                      <span
                        key={expert}
                        className="text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded"
                      >
                        {expert}
                      </span>
                    ))}
                  </div>
                )}
                {signal.SourceTweetUrls && signal.SourceTweetUrls.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {signal.SourceTweetUrls.map((url, i) => {
                      const handle = url.match(/x\.com\/([^/]+)/)?.[1] || 'tweet';
                      return (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-1.5 py-0.5 rounded transition-colors"
                        >
                          @{handle}
                        </a>
                      );
                    })}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
