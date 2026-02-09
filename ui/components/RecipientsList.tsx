'use client';

import { useState, useEffect, useCallback } from 'react';
import { EmailRecipientConfig } from '@/lib/types';
import { fetchRecipients, addRecipient, updateRecipient, deleteRecipient } from '@/lib/api';

const DOMAIN_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'market', label: 'Market' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'none', label: 'None' },
];

function domainBadgeClass(domain: string): string {
  switch (domain.toLowerCase()) {
    case 'market':
      return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    case 'crypto':
      return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
    case 'none':
      return 'bg-red-500/10 text-red-400/60 border border-red-500/20';
    default:
      return 'bg-gray-500/20 text-text-muted border border-gray-500/30';
  }
}

export default function RecipientsList() {
  const [recipients, setRecipients] = useState<EmailRecipientConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addDomain, setAddDomain] = useState('all');
  const [addLoading, setAddLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDomain, setEditDomain] = useState('');

  const loadRecipients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRecipients();
      setRecipients(result.recipients);
    } catch {
      setError('Failed to load recipients. Make sure the API is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipients();
  }, [loadRecipients]);

  const handleAdd = async () => {
    if (!addEmail.trim()) return;
    setAddLoading(true);
    try {
      await addRecipient({
        Email: addEmail.trim(),
        Domain: addDomain,
      });
      setAddEmail('');
      setAddDomain('all');
      setShowAddForm(false);
      await loadRecipients();
    } catch {
      setError('Failed to add recipient.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      await updateRecipient(id, { Domain: editDomain });
      setEditingId(null);
      await loadRecipients();
    } catch {
      setError('Failed to update recipient.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRecipient(id);
      setDeleteConfirmId(null);
      await loadRecipients();
    } catch {
      setError('Failed to delete recipient.');
    }
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Email Recipients
            </h2>
            <p className="text-xs text-text-faint">
              {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}{' '}
              configured
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadRecipients}
            className="text-sm text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setAddEmail('');
              setAddDomain('all');
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
          >
            {showAddForm ? 'Cancel' : '+ Add Recipient'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300 ml-3"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-4 p-4 rounded-lg border border-border-subtle bg-surface-sunken/40">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-faint uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 w-full"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-text-faint uppercase tracking-wider mb-1.5">
                Domain
              </label>
              <select
                value={addDomain}
                onChange={(e) => setAddDomain(e.target.value)}
                className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 w-full"
              >
                {DOMAIN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAdd}
              disabled={addLoading || !addEmail.trim()}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addLoading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <svg
            className="animate-spin h-6 w-6 text-blue-400"
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
        </div>
      )}

      {/* Recipient List */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider pb-3 pl-3">
                  Email
                </th>
                <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider pb-3">
                  Domain
                </th>
                <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider pb-3">
                  Added
                </th>
                <th className="text-right text-xs font-medium text-text-faint uppercase tracking-wider pb-3 pr-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((recipient) => (
                <tr key={recipient.Id} className="border-t border-border-subtle">
                  <td className="py-3 pl-3">
                    <span className="text-sm text-text-primary">
                      {recipient.Email}
                    </span>
                  </td>
                  <td className="py-3">
                    {editingId === recipient.Id ? (
                      <select
                        value={editDomain}
                        onChange={(e) => setEditDomain(e.target.value)}
                        className="bg-input-bg border border-input-border text-text-primary rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                      >
                        {DOMAIN_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`inline-flex text-xs px-2 py-1 rounded-full ${domainBadgeClass(recipient.Domain)}`}
                      >
                        {recipient.Domain.charAt(0).toUpperCase() +
                          recipient.Domain.slice(1)}
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    <span className="text-xs text-text-faint">
                      {new Date(recipient.CreatedAt).toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }
                      )}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-right">
                    {editingId === recipient.Id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUpdate(recipient.Id)}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-text-muted hover:text-text-secondary text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : deleteConfirmId === recipient.Id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-text-muted">Delete?</span>
                        <button
                          onClick={() => handleDelete(recipient.Id)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-text-muted hover:text-text-secondary text-sm transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingId(recipient.Id);
                            setEditDomain(recipient.Domain);
                            setDeleteConfirmId(null);
                          }}
                          className="text-text-muted hover:text-text-primary text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirmId(recipient.Id);
                            setEditingId(null);
                          }}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {/* Empty State */}
              {recipients.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <svg
                      className="mx-auto w-12 h-12 text-text-faint mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-text-faint text-sm">
                      No recipients configured
                    </p>
                    <p className="text-text-faint text-xs mt-1">
                      Add an email recipient to get started
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
