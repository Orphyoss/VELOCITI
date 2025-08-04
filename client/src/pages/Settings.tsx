import { useEffect } from 'react';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import AppShell from '@/components/layout/AppShell';
import DocumentManager from '@/components/admin/DocumentManager';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  const { setCurrentModule } = useVelocitiStore();

  useEffect(() => {
    setCurrentModule('admin');
  }, [setCurrentModule]);

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <SettingsIcon className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-dark-50">Settings</h1>
          </div>
          <p className="text-dark-400">
            Manage system configuration and document uploads
          </p>
        </div>

        <DocumentManager />
      </div>
    </AppShell>
  );
}