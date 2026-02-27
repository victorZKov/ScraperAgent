'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  getSubscription,
  updateSubscription,
  upgradeSubscription,
  cancelSubscription,
  deleteSubscription,
  checkPayment,
} from '@/lib/api';
import { PRICING } from '@/lib/pricing';
import type { Subscriber } from '@/lib/types';

export default function ManagePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const paymentPending = searchParams.get('payment') === 'pending';

  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(paymentPending);

  // Editable fields
  const [editName, setEditName] = useState('');
  const [editDomain, setEditDomain] = useState<'market' | 'crypto' | 'both'>('both');

  const loadSubscriber = useCallback(async () => {
    try {
      const data = await getSubscription(token);
      setSubscriber(data.subscriber);
      setEditName(data.subscriber.Name || '');
      setEditDomain(data.subscriber.DomainPreference);
    } catch {
      setError('Subscription not found or expired.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSubscriber();
  }, [loadSubscriber]);

  // Check payment status after returning from Mollie checkout
  useEffect(() => {
    if (!paymentPending || loading) return;

    let cancelled = false;
    const check = async () => {
      try {
        const result = await checkPayment(token);
        if (cancelled) return;

        if (result.paymentStatus === 'paid') {
          setCheckingPayment(false);
          if (result.subscriber) {
            setSubscriber(result.subscriber);
            setActionMessage('Payment successful! Your subscription is now active.');
          }
          // Remove ?payment=pending from URL
          router.replace(`/manage/${token}`);
        } else if (result.paymentStatus === 'open' || result.paymentStatus === 'pending') {
          // Still processing, poll again in 3s
          setTimeout(check, 3000);
        } else {
          setCheckingPayment(false);
          setActionMessage(`Payment ${result.paymentStatus}. Please try again.`);
          router.replace(`/manage/${token}`);
        }
      } catch {
        if (!cancelled) {
          setCheckingPayment(false);
          setActionMessage('Could not verify payment status.');
        }
      }
    };

    check();
    return () => { cancelled = true; };
  }, [paymentPending, loading, token, router]);

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const data = await updateSubscription(token, {
        Name: editName || undefined,
        DomainPreference: editDomain,
      });
      setSubscriber(data.subscriber);
      setActionMessage('Preferences saved!');
      setTimeout(() => setActionMessage(''), 3000);
    } catch {
      setActionMessage('Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const data = await upgradeSubscription(token);
      window.location.href = data.checkoutUrl;
    } catch {
      setActionMessage('Failed to start upgrade. Please try again.');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelSubscription(token);
      await loadSubscriber();
      setActionMessage('Subscription cancelled.');
    } catch {
      setActionMessage('Failed to cancel subscription.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSubscription(token);
      router.push('/?deleted=true');
    } catch {
      setActionMessage('Failed to delete data.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="animate-pulse text-text-muted">Loading subscription...</div>
      </div>
    );
  }

  if (error || !subscriber) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-text-primary mb-3">Subscription Not Found</h1>
        <p className="text-text-secondary mb-6">{error}</p>
        <Link href="/subscribe" className="text-blue-400 hover:text-blue-300 underline">
          Subscribe here
        </Link>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    trial: { label: 'Free Trial', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    active: { label: 'Active', color: 'bg-green-500/10 text-green-400 border-green-500/30' },
    past_due: { label: 'Past Due', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
    cancelled: { label: 'Cancelled', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
    expired: { label: 'Trial Expired', color: 'bg-gray-500/10 text-text-muted border-gray-500/30' },
  };

  const status = statusConfig[subscriber.Status] || statusConfig.expired;

  return (
    <div className="max-w-lg mx-auto px-4 py-20">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Manage Subscription</h1>

      {/* Status Card */}
      <div className="p-5 rounded-xl border border-border-subtle bg-surface/50 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-text-muted">Status</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
            {status.label}
          </span>
        </div>
        <div className="text-sm text-text-secondary space-y-2">
          <div className="flex justify-between">
            <span className="text-text-muted">Email</span>
            <span>{subscriber.Email}</span>
          </div>
          {subscriber.Status === 'trial' && (
            <>
              <div className="flex justify-between">
                <span className="text-text-muted">Reports used</span>
                <span>
                  {subscriber.TrialReportsUsed} / {subscriber.TrialReportsLimit}
                </span>
              </div>
              {subscriber.TrialExpiresAt && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Trial expires</span>
                  <span>{new Date(subscriber.TrialExpiresAt).toLocaleDateString()}</span>
                </div>
              )}
            </>
          )}
          <div className="flex justify-between">
            <span className="text-text-muted">Member since</span>
            <span>{new Date(subscriber.CreatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Payment Processing */}
      {checkingPayment && (
        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 mb-6 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-text-secondary">Verifying your payment...</p>
          <p className="text-xs text-text-muted mt-1">This may take a few seconds.</p>
        </div>
      )}

      {/* Action Message */}
      {actionMessage && (
        <div className={`p-3 rounded-lg text-sm mb-6 ${
          actionMessage.includes('successful') || actionMessage.includes('active')
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
        }`}>
          {actionMessage}
        </div>
      )}

      {/* Preferences */}
      <div className="p-5 rounded-xl border border-border-subtle bg-surface/50 mb-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Preferences</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-2">Reports</label>
            <div className="grid grid-cols-3 gap-2">
              {(['market', 'crypto', 'both'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setEditDomain(d)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    editDomain === d
                      ? d === 'crypto'
                        ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                        : d === 'market'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-blue-500 bg-blue-500/10 text-text-primary'
                      : 'border-border-subtle text-text-muted hover:bg-surface-elevated/40'
                  }`}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSavePreferences}
            disabled={saving}
            className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Upgrade (trial only) */}
      {(subscriber.Status === 'trial' || subscriber.Status === 'expired') && (
        <div className="p-5 rounded-xl border border-blue-500/30 bg-blue-500/5 mb-6">
          <h2 className="text-sm font-semibold text-text-primary mb-2">Upgrade to Paid</h2>
          <p className="text-xs text-text-secondary mb-4">
            €{PRICING.monthlyPrice}/month for unlimited daily reports. Cancel anytime.
          </p>
          <button
            onClick={handleUpgrade}
            className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 transition-all"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Cancel (active/trial) */}
      {(subscriber.Status === 'active' || subscriber.Status === 'trial') && (
        <button
          onClick={handleCancel}
          className="w-full px-4 py-2 rounded-lg text-sm font-medium border border-border-subtle text-text-muted hover:text-red-400 hover:border-red-500/30 transition-all mb-3"
        >
          Cancel Subscription
        </button>
      )}

      {/* GDPR Delete */}
      <div className="mt-8 pt-6 border-t border-border-subtle">
        <h3 className="text-xs font-medium text-text-muted mb-2">Data & Privacy</h3>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs text-red-400 hover:text-red-300 underline"
          >
            Delete all my data
          </button>
        ) : (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400 mb-3">
              This will permanently delete all your data. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Yes, delete everything
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium border border-border-subtle text-text-muted hover:text-text-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
