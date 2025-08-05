import { useState, useEffect } from 'react';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { useLocation } from 'wouter';
import AppShell from '@/components/layout/AppShell';
import DocumentManager from '@/components/admin/DocumentManager';
import APIMonitor from '@/components/admin/APIMonitor';
import MemoryStats from '@/components/memory/MemoryStats';
import ActionAgentsNew from '@/pages/ActionAgentsNew';
import DataGeneration from '@/pages/DataGeneration';
import { FileText, Activity, Brain, Zap, Database, Users } from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('action-agents');
  const { setCurrentModule } = useVelocitiStore();
  const [location] = useLocation();

  useEffect(() => {
    setCurrentModule('admin');
    
    // Check for URL parameters to navigate to specific tab
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const tab = urlParams.get('tab');
    const agent = urlParams.get('agent');
    
    if (tab) {
      setActiveTab(tab);
    }
    
    // Pass agent parameter to ActionAgentsNew component if needed
    if (agent) {
      // This will be handled by the ActionAgentsNew component
      console.log('Navigating to agent configuration for:', agent);
    }
  }, [setCurrentModule, location]);

  return (
    <AppShell>
      <div className="p-6">
        {/* Direct Admin Content - No tabs needed */}
        <div className="bg-dark-900/50 rounded-lg p-6 min-h-[600px]">
          <ActionAgentsNew selectedAgentId={new URLSearchParams(location.split('?')[1] || '').get('agent')} />
        </div>
      </div>
    </AppShell>
  );
}