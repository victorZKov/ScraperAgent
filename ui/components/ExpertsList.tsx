'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExpertConfig } from '@/lib/types';
import { fetchExperts, addExpert, updateExpert, deleteExpert } from '@/lib/api';

const CATEGORY_OPTIONS = [
  'Breaking News',
  'Macro Strategist',
  'Options Flow',
  'Fund Manager',
  'Crypto Analyst',
  'On-Chain Data',
  'DeFi Research',
  'Technical Analysis',
  'Quantitative',
  'Venture Capital',
  'Other',
];

interface ExpertsListProps {
  domain: 'market' | 'crypto';
}

interface FormState {
  handle: string;
  displayName: string;
  category: string;
  isVerified: boolean;
  weight: number;
  bias: string;
  isContrarian: boolean;
}

const emptyForm: FormState = {
  handle: '',
  displayName: '',
  category: CATEGORY_OPTIONS[0],
  isVerified: false,
  weight: 5,
  bias: '',
  isContrarian: false,
};

export default function ExpertsList({ domain }: ExpertsListProps) {
  const [experts, setExperts] = useState<ExpertConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(emptyForm);
  const [addLoading, setAddLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const loadExperts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchExperts(domain);
      setExperts(result.experts);
    } catch {
      setError('Failed to load experts. Make sure the API is running.');
    } finally {
      setLoading(false);
    }
  }, [domain]);

  useEffect(() => {
    loadExperts();
  }, [loadExperts]);

  const handleAdd = async () => {
    if (!addForm.handle.trim() || !addForm.displayName.trim()) return;
    setAddLoading(true);
    try {
      await addExpert({
        Handle: addForm.handle.replace(/^@/, ''),
        DisplayName: addForm.displayName,
        Category: addForm.category,
        IsVerified: addForm.isVerified,
        Weight: addForm.weight,
        Bias: addForm.bias,
        IsContrarian: addForm.isContrarian,
        Domain: domain,
      });
      setAddForm(emptyForm);
      setShowAddForm(false);
      await loadExperts();
    } catch {
      setError('Failed to add expert.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEdit = (expert: ExpertConfig) => {
    setEditingId(expert.Id);
    setEditForm({
      handle: expert.Handle,
      displayName: expert.DisplayName,
      category: expert.Category,
      isVerified: expert.IsVerified,
      weight: expert.Weight ?? 5,
      bias: expert.Bias ?? '',
      isContrarian: expert.IsContrarian ?? false,
    });
  };

  const handleEditSave = async () => {
    if (editingId === null) return;
    if (!editForm.handle.trim() || !editForm.displayName.trim()) return;
    setEditLoading(true);
    try {
      await updateExpert(editingId, {
        Handle: editForm.handle.replace(/^@/, ''),
        DisplayName: editForm.displayName,
        Category: editForm.category,
        IsVerified: editForm.isVerified,
        Weight: editForm.weight,
        Bias: editForm.bias,
        IsContrarian: editForm.isContrarian,
        Domain: domain,
      });
      setEditingId(null);
      setEditForm(emptyForm);
      await loadExperts();
    } catch {
      setError('Failed to update expert.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm(emptyForm);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteExpert(id);
      setDeleteConfirmId(null);
      await loadExperts();
    } catch {
      setError('Failed to delete expert.');
    }
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              domain === 'market'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                : 'bg-gradient-to-br from-purple-500 to-purple-600'
            }`}
          >
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {domain === 'market' ? 'Market' : 'Crypto'} Experts
            </h2>
            <p className="text-xs text-text-faint">
              {experts.length} expert{experts.length !== 1 ? 's' : ''}{' '}
              configured
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadExperts}
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
              setAddForm(emptyForm);
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
          >
            {showAddForm ? 'Cancel' : '+ Add Expert'}
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

      {/* Table */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider pb-3 pl-3">
                  Handle
                </th>
                <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider pb-3">
                  Display Name
                </th>
                <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider pb-3">
                  Category
                </th>
                <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider pb-3">
                  Verified
                </th>
                <th className="text-center text-xs font-medium text-text-faint uppercase tracking-wider pb-3">
                  Weight
                </th>
                <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider pb-3">
                  Bias
                </th>
                <th className="text-center text-xs font-medium text-text-faint uppercase tracking-wider pb-3">
                  Contrarian
                </th>
                <th className="text-right text-xs font-medium text-text-faint uppercase tracking-wider pb-3 pr-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Add Form Row */}
              {showAddForm && (
                <tr className="border-t border-border-subtle">
                  <td className="py-3 pl-3">
                    <input
                      type="text"
                      value={addForm.handle}
                      onChange={(e) =>
                        setAddForm({ ...addForm, handle: e.target.value })
                      }
                      placeholder="@handle"
                      className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 w-full"
                    />
                  </td>
                  <td className="py-3 pr-2">
                    <input
                      type="text"
                      value={addForm.displayName}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          displayName: e.target.value,
                        })
                      }
                      placeholder="Display Name"
                      className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 w-full"
                    />
                  </td>
                  <td className="py-3 pr-2">
                    <select
                      value={addForm.category}
                      onChange={(e) =>
                        setAddForm({ ...addForm, category: e.target.value })
                      }
                      className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 w-full"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addForm.isVerified}
                        onChange={(e) =>
                          setAddForm({
                            ...addForm,
                            isVerified: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-input-border bg-input-bg text-blue-500 focus:ring-blue-500/50"
                      />
                      <span className="text-xs text-text-muted">Verified</span>
                    </label>
                  </td>
                  <td className="py-3">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={addForm.weight}
                      onChange={(e) =>
                        setAddForm({ ...addForm, weight: parseInt(e.target.value) || 5 })
                      }
                      className="bg-input-bg border border-input-border text-text-primary rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 w-16"
                    />
                  </td>
                  <td className="py-3 pr-2">
                    <input
                      type="text"
                      value={addForm.bias}
                      onChange={(e) =>
                        setAddForm({ ...addForm, bias: e.target.value })
                      }
                      placeholder="e.g. Bullish SPX"
                      className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 w-full"
                    />
                  </td>
                  <td className="py-3 text-center">
                    <input
                      type="checkbox"
                      checked={addForm.isContrarian}
                      onChange={(e) =>
                        setAddForm({ ...addForm, isContrarian: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-input-border bg-input-bg text-orange-500 focus:ring-orange-500/50"
                    />
                  </td>
                  <td className="py-3 pr-3 text-right">
                    <button
                      onClick={handleAdd}
                      disabled={
                        addLoading ||
                        !addForm.handle.trim() ||
                        !addForm.displayName.trim()
                      }
                      className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addLoading ? 'Adding...' : 'Add'}
                    </button>
                  </td>
                </tr>
              )}

              {/* Expert Rows */}
              {experts.map((expert) => (
                <tr key={expert.Id} className="border-t border-border-subtle">
                  {editingId === expert.Id ? (
                    <>
                      <td className="py-3 pl-3">
                        <input
                          type="text"
                          value={editForm.handle}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              handle: e.target.value,
                            })
                          }
                          className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 w-full"
                        />
                      </td>
                      <td className="py-3 pr-2">
                        <input
                          type="text"
                          value={editForm.displayName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              displayName: e.target.value,
                            })
                          }
                          className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 w-full"
                        />
                      </td>
                      <td className="py-3 pr-2">
                        <select
                          value={editForm.category}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              category: e.target.value,
                            })
                          }
                          className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 w-full"
                        >
                          {CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.isVerified}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                isVerified: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded border-input-border bg-input-bg text-blue-500 focus:ring-blue-500/50"
                          />
                          <span className="text-xs text-text-muted">
                            Verified
                          </span>
                        </label>
                      </td>
                      <td className="py-3">
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={editForm.weight}
                          onChange={(e) =>
                            setEditForm({ ...editForm, weight: parseInt(e.target.value) || 5 })
                          }
                          className="bg-input-bg border border-input-border text-text-primary rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 w-16"
                        />
                      </td>
                      <td className="py-3 pr-2">
                        <input
                          type="text"
                          value={editForm.bias}
                          onChange={(e) =>
                            setEditForm({ ...editForm, bias: e.target.value })
                          }
                          placeholder="e.g. Bullish SPX"
                          className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 w-full"
                        />
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="checkbox"
                          checked={editForm.isContrarian}
                          onChange={(e) =>
                            setEditForm({ ...editForm, isContrarian: e.target.checked })
                          }
                          className="w-4 h-4 rounded border-input-border bg-input-bg text-orange-500 focus:ring-orange-500/50"
                        />
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={handleEditSave}
                            disabled={
                              editLoading ||
                              !editForm.handle.trim() ||
                              !editForm.displayName.trim()
                            }
                            className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {editLoading ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="text-text-muted hover:text-text-secondary text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 pl-3">
                        <span className="text-sm text-text-secondary">
                          @{expert.Handle}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-sm text-text-primary">
                          {expert.DisplayName}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-surface-elevated text-text-secondary">
                          {expert.Category}
                        </span>
                      </td>
                      <td className="py-3">
                        {expert.IsVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-surface-elevated/50 text-text-faint">
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-sm text-text-primary font-mono">{expert.Weight ?? 5}</span>
                      </td>
                      <td className="py-3">
                        {expert.Bias ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {expert.Bias}
                          </span>
                        ) : (
                          <span className="text-xs text-text-faint">—</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        {expert.IsContrarian && (
                          <span className="text-xs px-2 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25">
                            Contrarian
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-right">
                        {deleteConfirmId === expert.Id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-text-muted">
                              Delete?
                            </span>
                            <button
                              onClick={() => handleDelete(expert.Id)}
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
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => handleEdit(expert)}
                              className="text-text-muted hover:text-text-primary text-sm transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(expert.Id)}
                              className="text-red-400 hover:text-red-300 text-sm transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {/* Empty State */}
              {!loading && experts.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12">
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <p className="text-text-faint text-sm">
                      No experts configured
                    </p>
                    <p className="text-text-faint text-xs mt-1">
                      Add an expert to get started
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
