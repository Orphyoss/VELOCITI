import { Link, useLocation } from 'wouter';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { Plane, ChartLine, ClipboardList, Users, Database, Brain, Settings, X, Target, Zap, Sunrise } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AgentStatus from '../agents/AgentStatus';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const [location] = useLocation();
  const { currentModule, setCurrentModule } = useVelocitiStore();

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: ChartLine,
      path: '/'
    },
    {
      id: 'briefing',
      label: 'Morning Briefing',
      icon: Sunrise,
      path: '/briefing'
    },
    {
      id: 'telos',
      label: 'Telos Intelligence',
      icon: Target,
      path: '/telos'
    },
    {
      id: 'workbench',
      label: 'Analyst Workbench',
      icon: ClipboardList,
      path: '/workbench'
    },
    {
      id: 'strategic',
      label: 'Strategic Analysis',
      icon: Brain,
      path: '/strategic'
    },
    {
      id: 'genie',
      label: 'Databricks Genie',
      icon: Database,
      path: '/genie'
    },
    {
      id: 'agents',
      label: 'AI Agents',
      icon: Users,
      path: '/agents'
    },
    {
      id: 'action-agents',
      label: 'Action Agents',
      icon: Zap,
      path: '/action-agents'
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: Settings,
      path: '/admin'
    }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-dark-900 border-r border-dark-700 z-50 lg:hidden transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-dark-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 aviation-gradient rounded-lg flex items-center justify-center">
                <Plane className="text-white text-sm" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Velociti</h1>
                <p className="text-xs text-aviation-400">Intelligence Platform</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-dark-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.id} href={item.path}>
                  <div
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-aviation-600/20 text-aviation-400 border-l-2 border-aviation-500'
                        : 'text-dark-300 hover:text-white hover:bg-dark-800'
                    }`}
                    onClick={() => {
                      setCurrentModule(item.id as any);
                      onClose();
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Agent Status - Mobile Compact Version */}
          <div className="p-3 border-t border-dark-700">
            <div className="bg-dark-800 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-dark-200 mb-2">Agent Status</h3>
              <AgentStatus compact />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}