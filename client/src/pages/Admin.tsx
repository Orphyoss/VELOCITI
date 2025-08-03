import { useState, useEffect } from 'react';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import AppShell from '@/components/layout/AppShell';
import DocumentManager from '@/components/admin/DocumentManager';
import APIMonitor from '@/components/admin/APIMonitor';
import MemoryStats from '@/components/memory/MemoryStats';
import ActionAgentsNew from '@/pages/ActionAgentsNew';
import DataGeneration from '@/pages/DataGeneration';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Activity, Brain, Zap, Database } from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('agents');
  const { setCurrentModule } = useVelocitiStore();

  useEffect(() => {
    setCurrentModule('admin');
  }, [setCurrentModule]);

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-50">Admin Dashboard</h1>
          <p className="text-dark-400 mt-2">
            Manage agents, documents, and monitor system performance
          </p>
        </div>

        {/* Enhanced Admin Tabs with distinct styling */}
        <div className="bg-gradient-to-r from-dark-900 via-dark-800 to-dark-900 p-1 rounded-xl shadow-xl border border-orange-500/20">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-5 bg-dark-850 border-2 border-orange-500/30 rounded-lg p-2 shadow-lg">
              <TabsTrigger 
                value="agents" 
                className="flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-dark-700"
              >
                <Zap className="w-4 h-4" />
                <span>Agent Config</span>
              </TabsTrigger>
              <TabsTrigger 
                value="documents" 
                className="flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-dark-700"
              >
                <FileText className="w-4 h-4" />
                <span>Documents</span>
              </TabsTrigger>
              <TabsTrigger 
                value="monitoring" 
                className="flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-dark-700"
              >
                <Activity className="w-4 h-4" />
                <span>API Monitor</span>
              </TabsTrigger>
              <TabsTrigger 
                value="memory" 
                className="flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-dark-700"
              >
                <Brain className="w-4 h-4" />
                <span>Memory</span>
              </TabsTrigger>
              <TabsTrigger 
                value="data-generation" 
                className="flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-dark-700"
              >
                <Database className="w-4 h-4" />
                <span>Data Gen</span>
              </TabsTrigger>
            </TabsList>

            <div className="bg-dark-900/50 rounded-lg p-6 min-h-[600px]">
              <TabsContent value="agents" className="space-y-6 m-0">
                <ActionAgentsNew />
              </TabsContent>

              <TabsContent value="documents" className="space-y-6 m-0">
                <DocumentManager />
              </TabsContent>

              <TabsContent value="monitoring" className="space-y-6 m-0">
                <APIMonitor />
              </TabsContent>

              <TabsContent value="memory" className="space-y-6 m-0">
                <MemoryStats />
              </TabsContent>

              <TabsContent value="data-generation" className="space-y-6 m-0">
                <DataGeneration />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}