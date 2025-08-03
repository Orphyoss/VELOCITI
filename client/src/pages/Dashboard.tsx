import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { api } from '@/services/api';
import AppShell from '@/components/layout/AppShell';
import MorningBriefing from '@/components/dashboard/MorningBriefing';
import MetricsOverview from '@/components/dashboard/MetricsOverview';

import NetworkOverview from '@/components/dashboard/NetworkOverview';
import RecentActivity from '@/components/dashboard/RecentActivity';

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
    <AppShell>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Morning Briefing */}
        <MorningBriefing />
        
        {/* Key Metrics */}
        <MetricsOverview />
        

        
        {/* Network Performance - Full width horizontal */}
        <NetworkOverview />
        
        {/* Recent Activity - Below network performance */}
        <RecentActivity />
      </div>
    </AppShell>
  );
}
