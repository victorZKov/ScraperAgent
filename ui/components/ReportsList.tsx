'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReportMetadata,
  domainLabel,
  domainColorClass,
  domainSlug,
} from '@/lib/types';
import { fetchAllReports, fetchReports } from '@/lib/api';
import SentimentBadge from './SentimentBadge';

type FilterTab = 'all' | 'market' | 'crypto';

export default function ReportsList() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'all') {
        const result = await fetchAllReports();
        setReports(result.reports);
      } else {
        const result = await fetchReports(activeTab);
        setReports(result.reports);
      }
    } catch {
      setError('Failed to load reports. Make sure the API is running.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // ─── Compare Mode Logic ──────────────────────────────────────────────────

  const getSelectedDomain = (): number | null => {
    if (selectedIds.length === 0) return null;
    const firstSelected = reports.find((r) => r.Id === selectedIds[0]);
    return firstSelected?.Domain ?? null;
  };

  const isRowDisabled = (report: ReportMetadata): boolean => {
    if (!compareMode) return false;
    const selectedDomain = getSelectedDomain();
    if (selectedDomain === null) return false;
    return report.Domain !== selectedDomain;
  };

  const toggleSelection = (reportId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(reportId)) {
        return prev.filter((id) => id !== reportId);
      }
      if (prev.length >= 2) {
        // Replace oldest selection
        return [prev[1], reportId];
      }
      return [...prev, reportId];
    });
  };

  const handleCompare = () => {
    if (selectedIds.length !== 2) return;
    const selected = reports.filter((r) => selectedIds.includes(r.Id));
    // Order by date (older first as param 'a')
    selected.sort(
      (a, b) => new Date(a.GeneratedAt).getTime() - new Date(b.GeneratedAt).getTime()
    );
    const domain = domainSlug(selected[0].Domain);
    router.push(`/reports/${domain}/compare?a=${selected[0].Id}&b=${selected[1].Id}`);
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setSelectedIds([]);
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All Reports' },
    { key: 'market', label: 'Market' },
    { key: 'crypto', label: 'Crypto' },
  ];

  return (
    <div className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm overflow-hidden">
      {/* Header + Tabs */}
      <div className="px-6 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Reports</h2>
          </div>
          <div className="flex items-center gap-2">
            {compareMode ? (
              <button
                onClick={exitCompareMode}
                className="text-sm text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-border"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={() => setCompareMode(true)}
                className="text-sm text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-blue-500/50 hover:text-blue-400"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Compare
              </button>
            )}
            <button
              onClick={loadReports}
              className="text-sm text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border-subtle -mx-6 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                activeTab === tab.key
                  ? 'text-text-primary border-blue-500'
                  : 'text-text-faint border-transparent hover:text-text-secondary hover:border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-2">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}

        {error && (
          <div className="mx-4 my-8 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="text-center py-16">
            <svg className="mx-auto w-12 h-12 text-text-faint mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-text-faint text-sm">No reports yet</p>
            <p className="text-text-faint text-xs mt-1">Run an analysis to generate your first report</p>
          </div>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="space-y-1">
            {reports.map((report) => {
              const disabled = isRowDisabled(report);
              const selected = selectedIds.includes(report.Id);

              return (
                <button
                  key={report.Id}
                  onClick={() => {
                    if (compareMode) {
                      if (!disabled) toggleSelection(report.Id);
                    } else {
                      router.push(`/reports/${domainSlug(report.Domain)}/${report.Id}`);
                    }
                  }}
                  disabled={compareMode && disabled}
                  className={`w-full text-left px-4 py-3.5 rounded-lg transition-all group flex items-center gap-4 ${
                    compareMode && disabled
                      ? 'opacity-30 cursor-not-allowed'
                      : compareMode && selected
                        ? 'bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/15'
                        : 'hover:bg-surface-elevated/60'
                  }`}
                >
                  {/* Checkbox (compare mode only) */}
                  {compareMode && (
                    <div
                      className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        selected
                          ? 'bg-blue-500 border-blue-500'
                          : disabled
                            ? 'border-border'
                            : 'border-border group-hover:border-text-muted'
                      }`}
                    >
                      {selected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  )}

                  {/* Domain Badge */}
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${domainColorClass(report.Domain)}`}
                  >
                    {domainLabel(report.Domain)}
                  </span>

                  {/* Timestamp */}
                  <div className="shrink-0 min-w-[100px]">
                    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                      {formatRelativeTime(report.GeneratedAt)}
                    </span>
                  </div>

                  {/* Sentiment */}
                  <div className="shrink-0">
                    <SentimentBadge
                      value={report.OverallSentiment}
                      score={report.SentimentScore}
                      size="sm"
                    />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 ml-auto text-xs text-text-faint">
                    {report.ModelUsed && (
                      <span className="px-1.5 py-0.5 rounded bg-surface-elevated text-text-muted font-mono text-[11px]">
                        {report.ModelUsed}
                      </span>
                    )}
                    {report.DurationSeconds > 0 && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {report.DurationSeconds >= 60
                          ? `${Math.floor(report.DurationSeconds / 60)}m ${Math.round(report.DurationSeconds % 60)}s`
                          : `${report.DurationSeconds}s`}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      {report.TweetsAnalyzed} tweets
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {report.ExpertsIncluded} experts
                    </span>
                  </div>

                  {/* Arrow (only when not in compare mode) */}
                  {!compareMode && (
                    <svg
                      className="w-4 h-4 text-text-faint group-hover:text-text-muted transition-colors shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Compare Action Bar */}
      {compareMode && selectedIds.length === 2 && (
        <div className="sticky bottom-0 border-t border-border-subtle bg-surface/95 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-text-muted">
            2 reports selected
          </span>
          <button
            onClick={handleCompare}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Compare 2 Reports
          </button>
        </div>
      )}
    </div>
  );
}
