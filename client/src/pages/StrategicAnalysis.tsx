import { useEffect } from 'react';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import AppShell from '@/components/layout/AppShell';
import StrategicAnalysisComponent from '@/components/workbench/StrategicAnalysis';

export default function StrategicAnalysis() {
  const { setCurrentModule } = useVelocitiStore();

  useEffect(() => {
    setCurrentModule('strategic');
  }, [setCurrentModule]);

  return (
    <AppShell hidePageTitle={true}>
      <StrategicAnalysisComponent />
    </AppShell>
  );
}
