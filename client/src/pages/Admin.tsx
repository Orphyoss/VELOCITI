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

  const tabs = [
    { id: 'action-agents', label: 'Action Agents', icon: Brain },
    { id: 'documents', label: 'RAG Management', icon: FileText },
    { id: 'data-generation', label: 'Data Generation', icon: Database },
    { id: 'api-monitor', label: 'API Monitor', icon: Activity },
    { id: 'memory', label: 'Memory Stats', icon: Zap }
  ];

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark-50 mb-2">System Administration</h1>
          <p className="text-dark-400">Manage system components, monitor performance, and configure AI agents</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-dark-800 p-1 rounded-lg mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-aviation-600 text-white'
                  : 'text-dark-300 hover:text-dark-100 hover:bg-dark-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-dark-900/50 rounded-lg p-6 min-h-[600px]">
          {activeTab === 'action-agents' && (
            <ActionAgentsNew selectedAgentId={new URLSearchParams(location.split('?')[1] || '').get('agent')} />
          )}
          {activeTab === 'documents' && <DocumentManager />}
          {activeTab === 'data-generation' && <DataGeneration />}
          {activeTab === 'api-monitor' && <APIMonitor />}
          {activeTab === 'memory' && <MemoryStats />}
        </div>
      </div>
    </AppShell>
  );
}