import { useState, useEffect } from 'react';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import AppShell from '@/components/layout/AppShell';
import DocumentManager from '@/components/admin/DocumentManager';
import APIMonitor from '@/components/admin/APIMonitor';
import MemoryStats from '@/components/memory/MemoryStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Activity, Brain } from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('documents');
  const { setCurrentModule } = useVelocitiStore();

  useEffect(() => {
    setCurrentModule('admin');
  }, [setCurrentModule]);

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-dark-50">Admin Dashboard</h1>
          <p className="text-dark-400 mt-2">
            Manage documents and monitor system performance
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-dark-800 border-dark-700">
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Document Management</span>
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>API Monitoring</span>
            </TabsTrigger>
            <TabsTrigger value="memory" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>Memory System</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-6">
            <DocumentManager />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <APIMonitor />
          </TabsContent>

          <TabsContent value="memory" className="space-y-6">
            <MemoryStats />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}