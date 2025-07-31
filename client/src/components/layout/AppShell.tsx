import { useEffect } from 'react';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { wsService } from '@/services/websocket';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { setConnectionStatus } = useVelocitiStore();

  useEffect(() => {
    // Initialize WebSocket connection
    wsService.connect();

    return () => {
      wsService.disconnect();
    };
  }, [setConnectionStatus]);

  return (
    <div className="flex h-screen bg-dark-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-dark-950">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
