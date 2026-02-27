'use client';

import { useEffect, useState } from 'react';
import { fetchSubscribers, fetchSubscriberStats, adminUpdateSubscriber } from '@/lib/api';
import type { Subscriber, SubscriberStats } from '@/lib/types';

const statusConfig: Record<string, { label: string; color: string }> = {
  trial: { label: 'Trial', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  active: { label: 'Active', color: 'bg-green-500/10 text-green-400 border-green-500/30' },
  past_due: { label: 'Past Due', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
  expired: { label: 'Expired', color: 'bg-gray-500/10 text-text-muted border-gray-500/30' },
};

const domainConfig: Record<string, { label: string; color: string }> = {
  market: { label: 'Market', color: 'bg-blue-500/10 text-blue-400' },
  crypto: { label: 'Crypto', color: 'bg-purple-500/10 text-purple-400' },
  both: { label: 'Both', color: 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-text-secondary' },
};

export default function SubscribersList() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'trial' | 'active' | 'cancelled' | 'expired'>('all');
  const [updating, setUpdating] = useState<number | null>(null);

  const updateStatus = async (id: number, status: string) => {
    setUpdating(id);
    try {
      await adminUpdateSubscriber(id, { status });
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [subsData, statsData] = await Promise.all([
        fetchSubscribers(),
        fetchSubscriberStats(),
      ]);
      setSubscribers(subsData.subscribers);
      setStats(statsData.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all'
    ? subscribers
    : subscribers.filter((s) => s.Status === filter);

  if (loading) {
    return (
      <div className="p-8 text-center text-text-muted animate-pulse">
        Loading subscribers...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Total', value: stats.TotalSubscribers, color: 'text-text-primary' },
            { label: 'Trial', value: stats.TrialSubscribers, color: 'text-blue-400' },
            { label: 'Active', value: stats.ActiveSubscribers, color: 'text-green-400' },
            { label: 'Expired', value: stats.ExpiredSubscribers, color: 'text-yellow-400' },
            { label: 'Cancelled', value: stats.CancelledSubscribers, color: 'text-red-400' },
          ].map((item) => (
            <div
              key={item.label}
              className="text-center p-3 rounded-lg border border-border-subtle bg-surface/30"
            >
              <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
              <div className="text-xs text-text-faint">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        {(['all', 'trial', 'active', 'cancelled', 'expired'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f
                ? 'bg-surface-elevated text-text-primary border border-border-subtle'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && stats && (
              <span className="ml-1 text-text-faint">
                ({f === 'trial' ? stats.TrialSubscribers
                  : f === 'active' ? stats.ActiveSubscribers
                  : f === 'cancelled' ? stats.CancelledSubscribers
                  : stats.ExpiredSubscribers})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-text-faint text-sm">
          {subscribers.length === 0 ? 'No subscribers yet.' : 'No subscribers match this filter.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border-subtle">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-faint uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-faint uppercase tracking-wider">
                  Name
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-faint uppercase tracking-wider">
                  Domain
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-faint uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-faint uppercase tracking-wider">
                  Trial Usage
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-faint uppercase tracking-wider">
                  Signed Up
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-faint uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtered.map((sub) => {
                const st = statusConfig[sub.Status] || statusConfig.expired;
                const dm = domainConfig[sub.DomainPreference] || domainConfig.both;
                return (
                  <tr key={sub.Id} className="hover:bg-surface-elevated/30 transition-colors">
                    <td className="px-4 py-3 text-text-primary font-medium">
                      {sub.Email}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {sub.Name || <span className="text-text-faint">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${dm.color}`}>
                        {dm.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-text-muted">
                      {sub.Status === 'trial' ? (
                        <span>
                          {sub.TrialReportsUsed}/{sub.TrialReportsLimit}
                        </span>
                      ) : (
                        <span className="text-text-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-text-muted text-xs">
                      {new Date(sub.CreatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {sub.Status !== 'cancelled' && (
                          <button
                            onClick={() => updateStatus(sub.Id, 'cancelled')}
                            disabled={updating === sub.Id}
                            className="px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                          >
                            {updating === sub.Id ? '...' : 'Cancel'}
                          </button>
                        )}
                        {sub.Status === 'cancelled' && (
                          <button
                            onClick={() => updateStatus(sub.Id, 'trial')}
                            disabled={updating === sub.Id}
                            className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                          >
                            {updating === sub.Id ? '...' : 'Reactivate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
