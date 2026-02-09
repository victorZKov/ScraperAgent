import TriggerAnalysis from '@/components/TriggerAnalysis';
import ReportsList from '@/components/ReportsList';
import SubscriberStatsCard from '@/components/SubscriberStatsCard';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-faint mt-1">
          Monitor market sentiment and generate AI-powered analysis reports
        </p>
      </div>

      {/* Subscriber Stats */}
      <SubscriberStatsCard />

      {/* Trigger Analysis */}
      <TriggerAnalysis />

      {/* Reports List */}
      <ReportsList />
    </div>
  );
}
