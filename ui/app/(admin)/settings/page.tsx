'use client';

import { useState } from 'react';
import ExpertsList from '@/components/ExpertsList';
import RecipientsList from '@/components/RecipientsList';
import AIModelsList from '@/components/AIModelsList';
import SchedulesList from '@/components/SchedulesList';
import SubscribersList from '@/components/SubscribersList';

type Tab = 'market-experts' | 'crypto-experts' | 'recipients' | 'ai-models' | 'schedules' | 'subscribers';

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'market-experts', label: 'Market Experts', icon: 'market' },
  { key: 'crypto-experts', label: 'Crypto Experts', icon: 'crypto' },
  { key: 'recipients', label: 'Email Recipients', icon: 'email' },
  { key: 'ai-models', label: 'AI Models', icon: 'ai' },
  { key: 'schedules', label: 'Schedules', icon: 'schedule' },
  { key: 'subscribers', label: 'Subscribers', icon: 'subscribers' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('market-experts');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-faint mt-1">
          Manage expert accounts, email recipients, AI models, schedules, and subscribers
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-border-subtle overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
              activeTab === tab.key
                ? tab.key === 'crypto-experts'
                  ? 'text-text-primary border-purple-500'
                  : tab.key === 'ai-models'
                    ? 'text-text-primary border-amber-500'
                    : tab.key === 'schedules'
                      ? 'text-text-primary border-green-500'
                      : tab.key === 'subscribers'
                        ? 'text-text-primary border-cyan-500'
                        : 'text-text-primary border-blue-500'
                : 'text-text-faint border-transparent hover:text-text-secondary hover:border-border'
            }`}
          >
            {tab.icon === 'market' && (
              <span
                className={`w-2 h-2 rounded-full ${
                  activeTab === tab.key ? 'bg-blue-500' : 'bg-text-faint'
                }`}
              />
            )}
            {tab.icon === 'crypto' && (
              <span
                className={`w-2 h-2 rounded-full ${
                  activeTab === tab.key ? 'bg-purple-500' : 'bg-text-faint'
                }`}
              />
            )}
            {tab.icon === 'email' && (
              <svg
                className={`w-4 h-4 ${
                  activeTab === tab.key ? 'text-blue-400' : 'text-text-faint'
                }`}
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
            )}
            {tab.icon === 'ai' && (
              <svg
                className={`w-4 h-4 ${
                  activeTab === tab.key ? 'text-amber-400' : 'text-text-faint'
                }`}
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
            )}
            {tab.icon === 'schedule' && (
              <svg
                className={`w-4 h-4 ${
                  activeTab === tab.key ? 'text-green-400' : 'text-text-faint'
                }`}
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
            )}
            {tab.icon === 'subscribers' && (
              <svg
                className={`w-4 h-4 ${
                  activeTab === tab.key ? 'text-cyan-400' : 'text-text-faint'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'market-experts' && <ExpertsList domain="market" />}
      {activeTab === 'crypto-experts' && <ExpertsList domain="crypto" />}
      {activeTab === 'recipients' && <RecipientsList />}
      {activeTab === 'ai-models' && <AIModelsList />}
      {activeTab === 'schedules' && <SchedulesList />}
      {activeTab === 'subscribers' && <SubscribersList />}
    </div>
  );
}
