import { useEffect } from 'react';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import AppShell from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export default function SimpleWorkbench() {
  const { setCurrentModule } = useVelocitiStore();

  useEffect(() => {
    setCurrentModule('workbench');
  }, [setCurrentModule]);

  return (
    <AppShell>
      <div className="space-y-6">
        <Card className="bg-dark-900 border-dark-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-dark-50 flex items-center">
              <ClipboardList className="text-aviation-500 mr-2" />
              Analyst Workbench - Simple Version
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-dark-300">
              <p>Simple workbench component without API calls to test loading.</p>
              <p>This should load without any issues.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}