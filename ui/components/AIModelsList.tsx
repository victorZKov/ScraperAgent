'use client';

import { useState, useEffect, useCallback } from 'react';
import { AIModelConfig } from '@/lib/types';
import {
  fetchAIModels,
  addAIModel,
  updateAIModel,
  deleteAIModel,
  setDefaultAIModel,
} from '@/lib/api';

const PROVIDER_OPTIONS = [
  { value: 'azure-openai', label: 'Azure OpenAI' },
  { value: 'azure-foundry', label: 'Azure Foundry' },
  { value: 'scaleway', label: 'Scaleway' },
  { value: 'openai-compatible', label: 'OpenAI Compatible' },
];

const DOMAIN_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'market', label: 'Market' },
  { value: 'crypto', label: 'Crypto' },
];

function providerBadgeClass(provider: string): string {
  switch (provider.toLowerCase()) {
    case 'azure-openai':
      return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    case 'azure-foundry':
      return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    case 'scaleway':
      return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
    case 'openai-compatible':
      return 'bg-green-500/20 text-green-400 border border-green-500/30';
    default:
      return 'bg-gray-500/20 text-text-muted border border-gray-500/30';
  }
}

function domainBadgeClass(domain: string): string {
  switch (domain.toLowerCase()) {
    case 'market':
      return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    case 'crypto':
      return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
    default:
      return 'bg-gray-500/20 text-text-muted border border-gray-500/30';
  }
}

function truncateEndpoint(endpoint: string, maxLen = 40): string {
  if (endpoint.length <= maxLen) return endpoint;
  return endpoint.substring(0, maxLen) + '...';
}

interface FormState {
  name: string;
  provider: string;
  endpoint: string;
  apiKey: string;
  deploymentName: string;
  domain: string;
}

const emptyForm: FormState = {
  name: '',
  provider: 'azure-openai',
  endpoint: '',
  apiKey: '',
  deploymentName: '',
  domain: 'all',
};

export default function AIModelsList() {
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(emptyForm);
  const [addLoading, setAddLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const loadModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAIModels();
      setModels(result.models);
    } catch {
      setError('Failed to load AI models. Make sure the API is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.endpoint.trim() || !addForm.deploymentName.trim()) return;
    setAddLoading(true);
    try {
      await addAIModel({
        Name: addForm.name,
        Provider: addForm.provider,
        Endpoint: addForm.endpoint,
        ApiKey: addForm.apiKey,
        DeploymentName: addForm.deploymentName,
        Domain: addForm.domain,
      });
      setAddForm(emptyForm);
      setShowAddForm(false);
      await loadModels();
    } catch {
      setError('Failed to add AI model.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEdit = (model: AIModelConfig) => {
    setEditingId(model.Id);
    setEditForm({
      name: model.Name,
      provider: model.Provider,
      endpoint: model.Endpoint,
      apiKey: model.ApiKey,
      deploymentName: model.DeploymentName,
      domain: model.Domain,
    });
  };

  const handleEditSave = async () => {
    if (editingId === null) return;
    if (!editForm.name.trim() || !editForm.endpoint.trim() || !editForm.deploymentName.trim()) return;
    setEditLoading(true);
    try {
      await updateAIModel(editingId, {
        Name: editForm.name,
        Provider: editForm.provider,
        Endpoint: editForm.endpoint,
        ApiKey: editForm.apiKey,
        DeploymentName: editForm.deploymentName,
        Domain: editForm.domain,
      });
      setEditingId(null);
      setEditForm(emptyForm);
      await loadModels();
    } catch {
      setError('Failed to update AI model.');
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
      await deleteAIModel(id);
      setDeleteConfirmId(null);
      await loadModels();
    } catch {
      setError('Failed to delete AI model.');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultAIModel(id);
      await loadModels();
    } catch {
      setError('Failed to set default AI model.');
    }
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
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
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">AI Models</h2>
            <p className="text-xs text-text-faint">
              {models.length} model{models.length !== 1 ? 's' : ''} configured
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadModels}
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
            className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
          >
            {showAddForm ? 'Cancel' : '+ Add Model'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-text-faint uppercase tracking-wider mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="My GPT-4o Model"
                className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-faint uppercase tracking-wider mb-1.5">
                Provider
              </label>
              <select
                value={addForm.provider}
                onChange={(e) => setAddForm({ ...addForm, provider: e.target.value })}
                className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 w-full"
              >
                {PROVIDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-faint uppercase tracking-wider mb-1.5">
                Endpoint
              </label>
              <input
                type="text"
                value={addForm.endpoint}
                onChange={(e) => setAddForm({ ...addForm, endpoint: e.target.value })}
                placeholder="https://..."
                className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-faint uppercase tracking-wider mb-1.5">
                API Key
              </label>
              <input
                type="password"
                value={addForm.apiKey}
                onChange={(e) => setAddForm({ ...addForm, apiKey: e.target.value })}
                placeholder="sk-..."
                className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-faint uppercase tracking-wider mb-1.5">
                Deployment Name
              </label>
              <input
                type="text"
                value={addForm.deploymentName}
                onChange={(e) => setAddForm({ ...addForm, deploymentName: e.target.value })}
                placeholder="gpt-4o or claude-sonnet-4-20250514"
                className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-faint uppercase tracking-wider mb-1.5">
                Domain
              </label>
              <select
                value={addForm.domain}
                onChange={(e) => setAddForm({ ...addForm, domain: e.target.value })}
                className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 w-full"
              >
                {DOMAIN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAdd}
              disabled={
                addLoading ||
                !addForm.name.trim() ||
                !addForm.endpoint.trim() ||
                !addForm.deploymentName.trim()
              }
              className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addLoading ? 'Adding...' : 'Add Model'}
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <svg
            className="animate-spin h-6 w-6 text-amber-400"
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
                  Name
                </th>
                <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider pb-3">
                  Provider
                </th>
                <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider pb-3">
                  Endpoint
                </th>
                <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider pb-3">
                  Deployment
                </th>
                <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider pb-3">
                  Domain
                </th>
                <th className="text-center text-xs font-medium text-text-faint uppercase tracking-wider pb-3">
                  Default
                </th>
                <th className="text-right text-xs font-medium text-text-faint uppercase tracking-wider pb-3 pr-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Model Rows */}
              {models.map((model) => (
                <tr key={model.Id} className="border-t border-border-subtle">
                  {editingId === model.Id ? (
                    <>
                      <td className="py-3 pl-3">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 w-full"
                        />
                      </td>
                      <td className="py-3 pr-2">
                        <select
                          value={editForm.provider}
                          onChange={(e) =>
                            setEditForm({ ...editForm, provider: e.target.value })
                          }
                          className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 w-full"
                        >
                          {PROVIDER_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 pr-2">
                        <input
                          type="text"
                          value={editForm.endpoint}
                          onChange={(e) =>
                            setEditForm({ ...editForm, endpoint: e.target.value })
                          }
                          placeholder="https://..."
                          className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 w-full"
                        />
                      </td>
                      <td className="py-3 pr-2">
                        <input
                          type="text"
                          value={editForm.deploymentName}
                          onChange={(e) =>
                            setEditForm({ ...editForm, deploymentName: e.target.value })
                          }
                          placeholder="gpt-4o"
                          className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 w-full"
                        />
                      </td>
                      <td className="py-3 pr-2">
                        <select
                          value={editForm.domain}
                          onChange={(e) =>
                            setEditForm({ ...editForm, domain: e.target.value })
                          }
                          className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 w-full"
                        >
                          {DOMAIN_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3" />
                      <td className="py-3 pr-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={handleEditSave}
                            disabled={
                              editLoading ||
                              !editForm.name.trim() ||
                              !editForm.endpoint.trim() ||
                              !editForm.deploymentName.trim()
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
                        <span className="text-sm text-text-primary font-medium">
                          {model.Name}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex text-xs px-2 py-1 rounded-full ${providerBadgeClass(model.Provider)}`}
                        >
                          {model.Provider}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className="text-xs text-text-muted font-mono"
                          title={model.Endpoint}
                        >
                          {truncateEndpoint(model.Endpoint)}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-sm text-text-secondary">
                          {model.DeploymentName}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex text-xs px-2 py-1 rounded-full ${domainBadgeClass(model.Domain)}`}
                        >
                          {model.Domain.charAt(0).toUpperCase() + model.Domain.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleSetDefault(model.Id)}
                          className="transition-colors"
                          title={model.IsDefault ? 'Default model' : 'Set as default'}
                        >
                          {model.IsDefault ? (
                            <svg
                              className="w-5 h-5 text-amber-400 mx-auto"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5 text-text-faint hover:text-amber-400 mx-auto"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                              />
                            </svg>
                          )}
                        </button>
                      </td>
                      <td className="py-3 pr-3 text-right">
                        {deleteConfirmId === model.Id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-text-muted">
                              Delete?
                            </span>
                            <button
                              onClick={() => handleDelete(model.Id)}
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
                              onClick={() => handleEdit(model)}
                              className="text-text-muted hover:text-text-primary text-sm transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(model.Id)}
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
              {!loading && models.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12">
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
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-text-faint text-sm">
                      No AI models configured
                    </p>
                    <p className="text-text-faint text-xs mt-1">
                      Add an AI model to get started
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
