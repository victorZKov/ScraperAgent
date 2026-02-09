'use client';

interface DomainTabsProps {
  activeTab: 'market' | 'crypto';
  onTabChange: (tab: 'market' | 'crypto') => void;
}

export default function DomainTabs({ activeTab, onTabChange }: DomainTabsProps) {
  return (
    <div className="inline-flex rounded-lg border border-border-subtle bg-surface/50 p-1">
      <button
        onClick={() => onTabChange('market')}
        className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
          activeTab === 'market'
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-text-muted hover:text-text-primary'
        }`}
      >
        Market
      </button>
      <button
        onClick={() => onTabChange('crypto')}
        className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
          activeTab === 'crypto'
            ? 'bg-purple-500 text-white shadow-sm'
            : 'text-text-muted hover:text-text-primary'
        }`}
      >
        Crypto
      </button>
    </div>
  );
}
