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
    <div className="w-64 bg-dark-900 border-r border-dark-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-dark-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 aviation-gradient rounded-lg flex items-center justify-center">
            <Plane className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-dark-50">Velociti</h1>
            <p className="text-xs text-dark-400">Intelligence Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <div key={item.id} className={`nav-item ${isActive ? 'active' : ''}`}>
              <Link href={item.path}>
                <a 
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors"
                  onClick={() => setCurrentModule(item.id)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </a>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Agent Status */}
      <AgentStatus />

      {/* User Profile */}
      <div className="p-4 border-t border-dark-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-aviation-600 rounded-full flex items-center justify-center">
            <Users className="text-white text-sm" />
          </div>
          <div>
            <p className="text-sm font-medium text-dark-50">Development Mode</p>
            <p className="text-xs text-dark-400">No Auth Required</p>
          </div>
        </div>
      </div>
    </div>
  );
}
