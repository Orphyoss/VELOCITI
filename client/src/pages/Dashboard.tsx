import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { api } from '@/services/api';
import AppShell from '@/components/layout/AppShell';
import MetricsOverview from '@/components/dashboard/MetricsOverview';
import NetworkOverview from '@/components/dashboard/NetworkOverview';
import TodaysPriorities from '@/components/dashboard/TodaysPriorities';

export default function Dashboard() {
  const { setDashboardSummary, setCurrentModule } = useVelocitiStore();

  useEffect(() => {
    setCurrentModule('dashboard');
  }, [setCurrentModule]);

  const { data: summary } = useQuery({
    queryKey: ['/api/dashboard/summary'],
    queryFn: () => api.getDashboardSummary(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (summary) {
      setDashboardSummary(summary);
    }
  }, [summary, setDashboardSummary]);

  return (
    <AppShell title="Dashboard">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Key Metrics */}
        <MetricsOverview />
        
        {/* Today's Priorities - Critical alerts only */}
        <TodaysPriorities />
      </div>
    </AppShell>
  );
}
