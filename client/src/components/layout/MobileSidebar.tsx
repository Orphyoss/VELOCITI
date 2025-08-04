import { Link, useLocation } from 'wouter';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { Plane, ChartLine, ClipboardList, Users, Database, Brain, Settings, X, Target, Zap, Sunrise, ChevronDown, ChevronRight, BarChart3, Activity, Cog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import AgentStatus from '../agents/AgentStatus';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const [location] = useLocation();
  const { currentModule, setCurrentModule } = useVelocitiStore();
  const [isAdminExpanded, setIsAdminExpanded] = useState(false);

  const mainNavigationItems = [
    {
      id: 'dashboard',
      label: 'Velociti Intelligence Platform',
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
      id: 'workbench',
      label: 'Analyst Workbench',
      icon: ClipboardList,
      path: '/workbench'
    },
    {
      id: 'strategic',
      label: 'AI Strategic Analysis',
      icon: Brain,
      path: '/strategic'
    },
    {
      id: 'genie',
      label: 'Databricks Genie',
      icon: Database,
      path: '/genie'
    }
  ];

  const adminNavigationItems = [
    {
      id: 'action-agents',
      label: 'Action Agents',
      icon: Zap,
      path: '/action-agents'
    },
    {
      id: 'agents',
      label: 'AI Agents',
      icon: Users,
      path: '/agents'
    },
    {
      id: 'data-generation',
      label: 'Data Generation',
      icon: BarChart3,
      path: '/data-generation'
    },
    {
      id: 'system-monitoring',
      label: 'System Monitoring',
      icon: Activity,
      path: '/system-monitoring'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Cog,
      path: '/settings'
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
            {/* Main Navigation */}
            {mainNavigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.id} href={item.path}>
                  <a
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
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
                  </a>
                </Link>
              );
            })}
            
            {/* Admin Section */}
            <div className="pt-4 mt-4 border-t border-dark-700">
              {/* Admin Header - Clickable to toggle */}
              <div 
                className="flex items-center justify-between px-3 py-2 mb-2 cursor-pointer hover:bg-dark-800 rounded-lg"
                onClick={() => setIsAdminExpanded(!isAdminExpanded)}
              >
                <div className="text-xs font-bold text-orange-400 uppercase tracking-wider font-mono">
                  Admin
                </div>
                {isAdminExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
              
              {/* Admin Navigation Items - Collapsible */}
              {isAdminExpanded && (
                <div className="space-y-1 ml-4">
                  {adminNavigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.path || location.startsWith(item.path.split('?')[0]);
                    
                    return (
                      <Link key={item.id} href={item.path}>
                        <a
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-aviation-600/20 text-aviation-400 border-l-2 border-aviation-500'
                              : 'text-dark-300 hover:text-white hover:bg-dark-800'
                          }`}
                          onClick={() => {
                            setCurrentModule(item.id as any);
                            onClose();
                          }}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </a>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
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