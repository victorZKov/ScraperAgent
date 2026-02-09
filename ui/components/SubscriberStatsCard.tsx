'use client';

import { useEffect, useState } from 'react';
import { fetchSubscriberStats } from '@/lib/api';
import type { SubscriberStats } from '@/lib/types';

export default function SubscriberStatsCard() {
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriberStats()
      .then((data) => setStats(data.stats))
      .catch(() => {/* stats not available */})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) return null;
  if (stats.TotalSubscribers === 0) return null;

  const statItems = [
    { label: 'Total', value: stats.TotalSubscribers, color: 'text-text-primary' },
    { label: 'Trial', value: stats.TrialSubscribers, color: 'text-blue-400' },
    { label: 'Active', value: stats.ActiveSubscribers, color: 'text-green-400' },
    { label: 'Expired', value: stats.ExpiredSubscribers, color: 'text-yellow-400' },
    { label: 'Cancelled', value: stats.CancelledSubscribers, color: 'text-red-400' },
  ];

  return (
    <div className="rounded-xl border border-border-subtle bg-surface/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
        <h3 className="text-sm font-semibold text-text-primary">Newsletter Subscribers</h3>
      </div>
      <div className="grid grid-cols-5 gap-4">
        {statItems.map((item) => (
          <div key={item.label} className="text-center">
            <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs text-text-faint mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
      {(stats.MarketOnly > 0 || stats.CryptoOnly > 0 || stats.Both > 0) && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border-subtle text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Market: {stats.MarketOnly}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Crypto: {stats.CryptoOnly}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
            Both: {stats.Both}
          </span>
        </div>
      )}
    </div>
  );
}
