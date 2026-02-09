'use client';

import { useState, useEffect, useCallback } from 'react';
import { ScheduleConfig, SCHEDULE_PRESETS } from '@/lib/types';
import {
  fetchSchedules,
  addSchedule,
  updateSchedule,
  deleteSchedule,
  toggleSchedule,
} from '@/lib/api';

const DOMAIN_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'market', label: 'Market' },
  { value: 'crypto', label: 'Crypto' },
];

const TIMEZONE_OPTIONS = [
  'Europe/Madrid',
  'Europe/London',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'UTC',
];

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

function statusBadgeClass(status: string | null): string {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-green-500/20 text-green-400';
    case 'failed':
      return 'bg-red-500/20 text-red-400';
    case 'queued':
    case 'running':
      return 'bg-blue-500/20 text-blue-400';
    default:
      return 'bg-gray-500/20 text-text-muted';
  }
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '---';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function cronToLabel(cron: string): string {
  const preset = SCHEDULE_PRESETS.find((p) => p.cron === cron);
  return preset ? preset.label : cron;
}

const EMPTY_FORM = {
  Name: '',
  CronExpression: '0 8 * * *',
  Domain: 'all',
  Timezone: 'Europe/Madrid',
  preset: '0 8 * * *',
};

export default function SchedulesList() {
  const [schedules, setSchedules] = useState<ScheduleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSchedules();
      setSchedules(result.schedules);
    } catch {
      setError('Failed to load schedules. Make sure the API is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handlePresetChange = (
    cron: string,
    setter: (val: typeof EMPTY_FORM) => void,
    current: typeof EMPTY_FORM
  ) => {
    setter({ ...current, preset: cron, CronExpression: cron || current.CronExpression });
  };

  const handleAdd = async () => {
    if (!addForm.Name.trim() || !addForm.CronExpression.trim()) return;
    setAddLoading(true);
    try {
      await addSchedule({
        Name: addForm.Name.trim(),
        CronExpression: addForm.CronExpression.trim(),
        Domain: addForm.Domain,
        Timezone: addForm.Timezone,
        IsEnabled: false,
      });
      setAddForm(EMPTY_FORM);
      setShowAddForm(false);
      await loadSchedules();
    } catch {
      setError('Failed to add schedule.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      await updateSchedule(id, {
        Name: editForm.Name,
        CronExpression: editForm.CronExpression,
        Domain: editForm.Domain,
        Timezone: editForm.Timezone,
      });
      setEditingId(null);
      await loadSchedules();
    } catch {
      setError('Failed to update schedule.');
    }
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    try {
      await toggleSchedule(id, enabled);
      await loadSchedules();
    } catch {
      setError('Failed to toggle schedule.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSchedule(id);
      setDeleteConfirmId(null);
      await loadSchedules();
    } catch {
      setError('Failed to delete schedule.');
    }
  };

  const startEditing = (schedule: ScheduleConfig) => {
    const matchingPreset = SCHEDULE_PRESETS.find(
      (p) => p.cron === schedule.CronExpression
    );
    setEditingId(schedule.Id);
    setEditForm({
      Name: schedule.Name,
      CronExpression: schedule.CronExpression,
      Domain: schedule.Domain,
      Timezone: schedule.Timezone,
      preset: matchingPreset ? matchingPreset.cron : '',
    });
    setDeleteConfirmId(null);
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-surface/60 backdrop-blur-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Schedules</h2>
            <p className="text-xs text-text-faint">
              {schedules.length} schedule{schedules.length !== 1 ? 's' : ''}{' '}
              configured
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSchedules}
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
              setAddForm(EMPTY_FORM);
            }}
            className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
          >
            {showAddForm ? 'Cancel' : '+ Add Schedule'}
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
                value={addForm.Name}
                onChange={(e) =>
                  setAddForm({ ...addForm, Name: e.target.value })
                }
                placeholder="Daily Market Analysis"
                className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-faint uppercase tracking-wider mb-1.5">
                Preset
              </label>
              <select
                value={addForm.preset}
                onChange={(e) =>
                  handlePresetChange(e.target.value, setAddForm, addForm)
                }
                className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 w-full"
              >
                {SCHEDULE_PRESETS.map((p) => (
                  <option key={p.label} value={p.cron}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-text-faint uppercase tracking-wider mb-1.5">
                Cron Expression
              </label>
              <input
                type="text"
                value={addForm.CronExpression}
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    CronExpression: e.target.value,
                    preset: '',
                  })
                }
                placeholder="0 8 * * *"
                className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 w-full font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-faint uppercase tracking-wider mb-1.5">
                Domain
              </label>
              <select
                value={addForm.Domain}
                onChange={(e) =>
                  setAddForm({ ...addForm, Domain: e.target.value })
                }
                className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 w-full"
              >
                {DOMAIN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-faint uppercase tracking-wider mb-1.5">
                Timezone
              </label>
              <select
                value={addForm.Timezone}
                onChange={(e) =>
                  setAddForm({ ...addForm, Timezone: e.target.value })
                }
                className="bg-input-bg border border-input-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 w-full"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={
              addLoading || !addForm.Name.trim() || !addForm.CronExpression.trim()
            }
            className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addLoading ? 'Adding...' : 'Add Schedule'}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <svg
            className="animate-spin h-6 w-6 text-green-400"
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

      {/* Schedule List */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider pb-3 pl-3">
                  Name
                </th>
                <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider pb-3">
                  Schedule
                </th>
                <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider pb-3">
                  Domain
                </th>
                <th className="text-center text-xs font-medium text-text-faint uppercase tracking-wider pb-3">
                  Enabled
                </th>
                <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider pb-3">
                  Next Run
                </th>
                <th className="text-left text-xs font-medium text-text-faint uppercase tracking-wider pb-3">
                  Last Run
                </th>
                <th className="text-right text-xs font-medium text-text-faint uppercase tracking-wider pb-3 pr-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.Id} className="border-t border-border-subtle">
                  <td className="py-3 pl-3">
                    {editingId === schedule.Id ? (
                      <input
                        type="text"
                        value={editForm.Name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, Name: e.target.value })
                        }
                        className="bg-input-bg border border-input-border text-text-primary rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 w-full max-w-[200px]"
                      />
                    ) : (
                      <span className="text-sm text-text-primary">
                        {schedule.Name}
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    {editingId === schedule.Id ? (
                      <div className="flex flex-col gap-1">
                        <select
                          value={editForm.preset}
                          onChange={(e) =>
                            handlePresetChange(
                              e.target.value,
                              setEditForm,
                              editForm
                            )
                          }
                          className="bg-input-bg border border-input-border text-text-primary rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        >
                          {SCHEDULE_PRESETS.map((p) => (
                            <option key={p.label} value={p.cron}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={editForm.CronExpression}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              CronExpression: e.target.value,
                              preset: '',
                            })
                          }
                          className="bg-input-bg border border-input-border text-text-primary rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-green-500/50 w-32"
                        />
                      </div>
                    ) : (
                      <div>
                        <span className="text-sm text-text-primary">
                          {cronToLabel(schedule.CronExpression)}
                        </span>
                        {cronToLabel(schedule.CronExpression) !==
                          schedule.CronExpression && (
                          <span className="block text-xs text-text-faint font-mono">
                            {schedule.CronExpression}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3">
                    {editingId === schedule.Id ? (
                      <select
                        value={editForm.Domain}
                        onChange={(e) =>
                          setEditForm({ ...editForm, Domain: e.target.value })
                        }
                        className="bg-input-bg border border-input-border text-text-primary rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      >
                        {DOMAIN_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`inline-flex text-xs px-2 py-1 rounded-full ${domainBadgeClass(schedule.Domain)}`}
                      >
                        {schedule.Domain.charAt(0).toUpperCase() +
                          schedule.Domain.slice(1)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() =>
                        handleToggle(schedule.Id, !schedule.IsEnabled)
                      }
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        schedule.IsEnabled ? 'bg-green-500' : 'bg-border'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                          schedule.IsEnabled
                            ? 'translate-x-4'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="py-3">
                    <span
                      className={`text-xs ${schedule.IsEnabled ? 'text-green-400' : 'text-text-faint'}`}
                    >
                      {schedule.IsEnabled
                        ? formatDateTime(schedule.NextRunAt)
                        : '---'}
                    </span>
                  </td>
                  <td className="py-3">
                    {schedule.LastRunAt ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-text-faint">
                          {formatDateTime(schedule.LastRunAt)}
                        </span>
                        {schedule.LastRunStatus && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${statusBadgeClass(schedule.LastRunStatus)}`}
                          >
                            {schedule.LastRunStatus}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-text-faint">Never</span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-right">
                    {editingId === schedule.Id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUpdate(schedule.Id)}
                          className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
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
                    ) : deleteConfirmId === schedule.Id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-text-muted">Delete?</span>
                        <button
                          onClick={() => handleDelete(schedule.Id)}
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
                          onClick={() => startEditing(schedule)}
                          className="text-text-muted hover:text-text-primary text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirmId(schedule.Id);
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
              {schedules.length === 0 && (
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-text-faint text-sm">
                      No schedules configured
                    </p>
                    <p className="text-text-faint text-xs mt-1">
                      Add a schedule to automate your analyses
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
