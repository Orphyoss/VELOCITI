import { useEffect, useState } from 'react';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { wsService } from '@/services/websocket';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileSidebar from './MobileSidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { setConnectionStatus } = useVelocitiStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
    wsService.connect();

    return () => {
      wsService.disconnect();
    };
  }, [setConnectionStatus]);

  return (
    <div className="flex h-screen bg-dark-950">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex-1 overflow-auto bg-dark-950">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
