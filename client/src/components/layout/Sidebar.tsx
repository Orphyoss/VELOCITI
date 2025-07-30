import { Link, useLocation } from 'wouter';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { Plane, ChartLine, ClipboardList, Users, Database, Brain } from 'lucide-react';
import AgentStatus from '../agents/AgentStatus';

export default function Sidebar() {
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
      id: 'workbench',
      label: 'Analyst Workbench',
      icon: ClipboardList,
      path: '/workbench'
    },
    {
      id: 'agents',
      label: 'AI Agents',
      icon: Users,
      path: '/agents'
    },
    {
      id: 'genie',
      label: 'Databricks Genie',
      icon: Database,
      path: '/genie'
    },
    {
      id: 'strategic',
      label: 'Strategic Analysis',
      icon: Brain,
      path: '/strategic'
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
            <p className="text-xs" style={{ color: '#ffaa66' }}>Intelligence Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <div key={item.id} className={`nav-item ${isActive ? 'active' : ''}`}>
              <Link href={item.path}>
                <a 
                  className="flex items-center space-x-3 text-sm font-medium"
                  onClick={() => setCurrentModule(item.id)}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </a>
              </Link>
            </div>
          );
        })}
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
