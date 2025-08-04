import { useEffect } from 'react';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import AppShell from '@/components/layout/AppShell';
import APIMonitor from '@/components/admin/APIMonitor';
import MemoryStats from '@/components/memory/MemoryStats';
import { Activity } from 'lucide-react';

export default function SystemMonitoring() {
  const { setCurrentModule } = useVelocitiStore();

  useEffect(() => {
    setCurrentModule('admin');
  }, [setCurrentModule]);

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Activity className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-dark-50">System Monitoring</h1>
          </div>
          <p className="text-dark-400">
            Monitor API health, system performance, and memory usage
          </p>
        </div>

        <div className="space-y-6">
          <APIMonitor />
          <MemoryStats />
        </div>
      </div>
    </AppShell>
  );
}