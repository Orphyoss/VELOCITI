import { useEffect } from 'react';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import AppShell from '@/components/layout/AppShell';
import DataInterrogation from '@/components/workbench/DataInterrogation';

export default function DatabricsGenie() {
  const { setCurrentModule } = useVelocitiStore();

  useEffect(() => {
    setCurrentModule('genie');
  }, [setCurrentModule]);

  return (
    <AppShell>
      <DataInterrogation />
    </AppShell>
  );
}
