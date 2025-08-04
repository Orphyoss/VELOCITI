import { Link, useLocation } from 'wouter';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { Plane, ChartLine, ClipboardList, Users, Database, Brain, Settings, Target, Sunrise, Zap } from 'lucide-react';
import AgentStatus from '../agents/AgentStatus';

export default function Sidebar() {
  const [location] = useLocation();
  const { currentModule, setCurrentModule } = useVelocitiStore();

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
      id: 'action-agents',
      label: 'Action Agents',
      icon: Zap,
      path: '/action-agents'
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
    },
    {
      id: 'agents',
      label: 'AI Agents',
      icon: Users,
      path: '/agents'
    }
  ];

  const adminNavigationItems = [
    {
      id: 'admin',
      label: 'Admin',
      icon: Settings,
      path: '/admin'
    }
  ];

  return (
    <div className="w-64 sidebar flex flex-col">
      {/* Logo */}
      <div className="p-6 sidebar-header">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 aviation-gradient rounded-lg flex items-center justify-center shadow-lg">
            <Plane className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Velociti</h1>
            <p className="text-xs" style={{ color: '#ffaa66' }}>Intelligence</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {mainNavigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.id} href={item.path}>
              <div 
                className={`nav-item ${isActive ? 'active' : ''} flex items-center space-x-3 text-lg font-medium cursor-pointer`}
                onClick={() => setCurrentModule(item.id as any)}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
            </Link>
          );
        })}
        
        {/* Admin Section - Separated */}
        <div className="pt-6 mt-6 border-t border-gray-600 dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2">
            System
          </div>
          {adminNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.id} href={item.path}>
                <div 
                  className={`nav-item ${isActive ? 'active' : ''} flex items-center space-x-3 text-lg font-medium cursor-pointer ml-2`}
                  onClick={() => setCurrentModule(item.id as any)}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Agent Status */}
      <div className="agent-status-section">
        <AgentStatus />
      </div>

      {/* User Profile */}
      <div className="p-4 border-t-4 border-orange-600 bg-gradient-to-r from-black via-gray-700 to-black relative z-20 shadow-inner" style={{ borderColor: '#ff6600' }}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border" style={{ background: 'linear-gradient(135deg, #ff6600, #cc5500)', borderColor: '#ff6600' }}>
            <Users className="text-white text-sm" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Development Mode</p>
            <p className="text-xs" style={{ color: '#ffaa66' }}>No Auth Required</p>
          </div>
        </div>
      </div>
    </div>
  );
}
