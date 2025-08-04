import { useState, useEffect } from 'react';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { useLocation } from 'wouter';
import AppShell from '@/components/layout/AppShell';
import DocumentManager from '@/components/admin/DocumentManager';
import APIMonitor from '@/components/admin/APIMonitor';
import MemoryStats from '@/components/memory/MemoryStats';

import DataGeneration from '@/pages/DataGeneration';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Activity, Brain, Zap, Database, Users, BarChart3 } from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('agents');
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-50">Admin Dashboard</h1>
          <p className="text-dark-400 mt-2">
            Configure action agents and AI agent settings
          </p>
        </div>

        {/* Enhanced Admin Tabs with distinct styling */}
        <div className="bg-gradient-to-r from-dark-900 via-dark-800 to-dark-900 p-1 rounded-xl shadow-xl border border-orange-500/20">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 bg-dark-850 border-2 border-orange-500/30 rounded-lg p-2 shadow-lg">
              <TabsTrigger 
                value="agents" 
                className="flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-dark-700"
              >
                <Users className="w-4 h-4" />
                <span>Agent Configuration</span>
              </TabsTrigger>
              <TabsTrigger 
                value="rag" 
                className="flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-dark-700"
              >
                <FileText className="w-4 h-4" />
                <span>RAG Management</span>
              </TabsTrigger>
              <TabsTrigger 
                value="monitoring" 
                className="flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-dark-700"
              >
                <Activity className="w-4 h-4" />
                <span>System Monitoring</span>
              </TabsTrigger>
              <TabsTrigger 
                value="data-gen" 
                className="flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-dark-700"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Data Generation</span>
              </TabsTrigger>
            </TabsList>

            <div className="bg-dark-900/50 rounded-lg p-6 min-h-[600px]">
              <TabsContent value="agents" className="space-y-6 m-0">
                <Tabs defaultValue="agent-status" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-dark-800 border border-dark-600">
                    <TabsTrigger value="agent-status" className="text-dark-200 data-[state=active]:bg-orange-600 data-[state=active]:text-white">Agent Status</TabsTrigger>
                    <TabsTrigger value="agent-setup" className="text-dark-200 data-[state=active]:bg-orange-600 data-[state=active]:text-white">Agent Setup</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="agent-status" className="space-y-4">
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-dark-50 mb-4">Agent Status</h3>
                      <p className="text-dark-400 mb-6">Monitor agent performance and activity.</p>
                      <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                        <p className="text-dark-300">Agent status monitoring interface coming soon...</p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="agent-setup" className="space-y-4">
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-dark-50 mb-4">Agent Setup</h3>
                      <p className="text-dark-400 mb-6">Configure agent parameters and thresholds.</p>
                      <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                        <p className="text-dark-300">Agent setup configuration interface coming soon...</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="rag" className="space-y-6 m-0">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-dark-50 mb-4">RAG Management</h3>
                  <p className="text-dark-400 mb-6">Manage document processing and semantic search.</p>
                  <DocumentManager />
                </div>
              </TabsContent>

              <TabsContent value="monitoring" className="space-y-6 m-0">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-dark-50 mb-4">System Monitoring</h3>
                  <p className="text-dark-400 mb-6">Monitor system performance and API health.</p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <APIMonitor />
                    <MemoryStats />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="data-gen" className="space-y-6 m-0">
                <DataGeneration />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}