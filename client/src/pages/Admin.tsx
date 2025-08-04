import { useState, useEffect } from 'react';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { useLocation } from 'wouter';
import AppShell from '@/components/layout/AppShell';
import DocumentManager from '@/components/admin/DocumentManager';
import APIMonitor from '@/components/admin/APIMonitor';
import MemoryStats from '@/components/memory/MemoryStats';

import DataGeneration from '@/pages/DataGeneration';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Activity, Brain, Zap, Database, Users } from 'lucide-react';

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
          {/* Agent Configuration with Sub-tabs */}
          <div className="space-y-6">
            <div className="text-center py-4">
              <h2 className="text-2xl font-semibold text-dark-50 flex items-center justify-center space-x-2">
                <Users className="w-6 h-6" />
                <span>Agent Configuration</span>
              </h2>
            </div>
            
            <Tabs defaultValue="agent-status" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-dark-800 border border-dark-600">
                <TabsTrigger value="agent-status" className="text-dark-200 data-[state=active]:bg-orange-600 data-[state=active]:text-white">Agent Status</TabsTrigger>
                <TabsTrigger value="agent-setup" className="text-dark-200 data-[state=active]:bg-orange-600 data-[state=active]:text-white">Agent Setup</TabsTrigger>
              </TabsList>
              
              <div className="bg-dark-900/50 rounded-lg p-6 min-h-[600px]">
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
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </AppShell>
  );
}