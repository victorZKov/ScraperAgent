'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { triggerAnalysis, fetchJobStatus } from '@/lib/api';
import { JobStatus, domainSlug } from '@/lib/types';

type AnalysisDomain = 'market' | 'crypto';

interface JobState {
  domain: AnalysisDomain;
  jobId: string;
  status: JobStatus['status'];
  reportId?: string;
  error?: string;
}

const STORAGE_KEY = 'scraper_active_jobs';

function loadPersistedJobs(): Record<AnalysisDomain, JobState | null> {
  if (typeof window === 'undefined') return { market: null, crypto: null };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { market: null, crypto: null };
    const parsed = JSON.parse(raw) as Record<AnalysisDomain, JobState | null>;
    // Only restore jobs that were still running
    for (const domain of ['market', 'crypto'] as AnalysisDomain[]) {
      const job = parsed[domain];
      if (job && job.status !== 'Queued' && job.status !== 'Running') {
        // Keep completed/failed so user sees the result
      }
    }
    return parsed;
  } catch {
    return { market: null, crypto: null };
  }
}

function persistJobs(jobs: Record<AnalysisDomain, JobState | null>) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch {
    // ignore
  }
}

export default function TriggerAnalysis() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Record<AnalysisDomain, JobState | null>>({
    market: null,
    crypto: null,
  });
  const [loading, setLoading] = useState<Record<AnalysisDomain, boolean>>({
    market: false,
    crypto: false,
  });
  const pollIntervals = useRef<Record<string, NodeJS.Timeout>>({});
  const initialized = useRef(false);

  // Persist jobs to sessionStorage whenever they change
  useEffect(() => {
    if (initialized.current) {
      persistJobs(jobs);
    }
  }, [jobs]);

  const pollJob = useCallback(
    (domain: AnalysisDomain, jobId: string) => {
      const key = `${domain}-${jobId}`;
      if (pollIntervals.current[key]) {
        clearInterval(pollIntervals.current[key]);
      }

      pollIntervals.current[key] = setInterval(async () => {
        try {
          const status = await fetchJobStatus(domain, jobId);
          setJobs((prev) => ({
            ...prev,
            [domain]: {
              domain,
              jobId,
              status: status.status,
              reportId: status.reportId,
              error: status.error,
            },
          }));

          if (status.status === 'Completed' || status.status === 'Failed') {
            clearInterval(pollIntervals.current[key]);
            delete pollIntervals.current[key];
            setLoading((prev) => ({ ...prev, [domain]: false }));
          }
        } catch (err) {
          clearInterval(pollIntervals.current[key]);
          delete pollIntervals.current[key];
          const message = err instanceof Error ? err.message : 'Failed to poll job status';
          setJobs((prev) => ({
            ...prev,
            [domain]: {
              domain,
              jobId,
              status: 'Failed',
              error: message,
            },
          }));
          setLoading((prev) => ({ ...prev, [domain]: false }));
        }
      }, 3000);
    },
    []
  );

  // Restore persisted jobs on mount and resume polling
  useEffect(() => {
    const persisted = loadPersistedJobs();
    setJobs(persisted);
    initialized.current = true;

    for (const domain of ['market', 'crypto'] as AnalysisDomain[]) {
      const job = persisted[domain];
      if (job && job.jobId && (job.status === 'Queued' || job.status === 'Running')) {
        setLoading((prev) => ({ ...prev, [domain]: true }));
        pollJob(domain, job.jobId);
      }
    }

    return () => {
      // Cleanup all intervals on unmount
      Object.values(pollIntervals.current).forEach(clearInterval);
    };
  }, [pollJob]);

  const handleTrigger = async (domain: AnalysisDomain) => {
    setLoading((prev) => ({ ...prev, [domain]: true }));
    setJobs((prev) => ({
      ...prev,
      [domain]: { domain, jobId: '', status: 'Queued' },
    }));

    try {
      const result = await triggerAnalysis(domain);
      setJobs((prev) => ({
        ...prev,
        [domain]: { domain, jobId: result.jobId, status: 'Queued' },
      }));
      pollJob(domain, result.jobId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setJobs((prev) => ({
        ...prev,
        [domain]: {
          domain,
          jobId: '',
          status: 'Failed',
          error: message,
        },
      }));
      setLoading((prev) => ({ ...prev, [domain]: false }));
    }
  };

  const renderJobStatus = (domain: AnalysisDomain) => {
    const job = jobs[domain];
    if (!job) return null;

    return (
      <div className="mt-3">
        {(job.status === 'Queued' || job.status === 'Running') && (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <svg
              className="animate-spin h-4 w-4 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>
              {job.status === 'Queued' ? 'Queued...' : 'Running analysis...'}
            </span>
          </div>
        )}

        {job.status === 'Completed' && job.reportId && (
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-400">Analysis complete!</span>
            <button
              onClick={() => router.push(`/reports/${domain}/${job.reportId}`)}
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
            >
              View Report
            </button>
          </div>
        )}

        {job.status === 'Failed' && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>{job.error || 'Analysis failed'}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-text-primary">Run Analysis</h2>
      </div>

      <p className="text-sm text-text-muted mb-5">
        Trigger a new analysis to scrape expert tweets and generate AI-powered market intelligence.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Market Analysis */}
        <div className="p-4 rounded-lg border border-border-subtle bg-surface-sunken/40">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-text-secondary">Market Analysis</span>
          </div>
          <button
            onClick={() => handleTrigger('market')}
            disabled={loading.market}
            className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
          >
            {loading.market ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              'Analyze Markets'
            )}
          </button>
          {renderJobStatus('market')}
        </div>

        {/* Crypto Analysis */}
        <div className="p-4 rounded-lg border border-border-subtle bg-surface-sunken/40">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-sm font-medium text-text-secondary">Crypto Analysis</span>
          </div>
          <button
            onClick={() => handleTrigger('crypto')}
            disabled={loading.crypto}
            className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
          >
            {loading.crypto ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              'Analyze Crypto'
            )}
          </button>
          {renderJobStatus('crypto')}
        </div>
      </div>
    </div>
  );
}
