import { useState, useEffect } from 'react';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import AppShell from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  Play, 
  Pause, 
  Settings,
  Target,
  Clock,
  DollarSign,
  Activity,
  Brain,
  Radar
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'PROCESSING' | 'SLEEPING' | 'ERROR';
  icon: React.ComponentType<any>;
  lastRun: string;
  nextRun: string;
  alertsGenerated: number;
  avgConfidence: number;
  revenueImpact: number;
}

interface Alert {
  id: string;
  agentName: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  recommendation: string;
  confidenceScore: number;
  revenueImpact: number;
  timeToAct: string;
  affectedRoutes: string[];
  createdAt: string;
  expiresAt?: string;
}

export default function ActionAgents() {
  const { setCurrentModule } = useVelocitiStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('surge-detector');
  const [isRunning, setIsRunning] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCurrentModule('action-agents');
    initializeAgents();
    generateMockAlerts();
  }, [setCurrentModule]);

  const initializeAgents = () => {
    const agentData: Agent[] = [
      {
        id: 'surge-detector',
        name: 'Surge Event Detector',
        description: 'Monitors external events and correlates with historical demand patterns to predict revenue opportunities before competitors notice.',
        status: 'ACTIVE',
        icon: Radar,
        lastRun: '12 minutes ago',
        nextRun: 'In 18 minutes',
        alertsGenerated: 23,
        avgConfidence: 0.87,
        revenueImpact: 2450000
      },
      {
        id: 'booking-curve',
        name: 'Advance Booking Curve Alert',
        description: 'Predictive booking pace intelligence that detects anomalies in advance booking patterns and recommends dynamic pricing adjustments.',
        status: 'ACTIVE',
        icon: TrendingUp,
        lastRun: '8 minutes ago',
        nextRun: 'In 22 minutes',
        alertsGenerated: 41,
        avgConfidence: 0.92,
        revenueImpact: 1890000
      },
      {
        id: 'elasticity-detector',
        name: 'Elasticity Change Alert',
        description: 'Detects fundamental demand shift patterns and price elasticity changes to optimize revenue management strategies.',
        status: 'PROCESSING',
        icon: Brain,
        lastRun: '2 minutes ago',
        nextRun: 'In 28 minutes',
        alertsGenerated: 17,
        avgConfidence: 0.84,
        revenueImpact: 1340000
      }
    ];
    setAgents(agentData);
  };

  const generateMockAlerts = () => {
    const mockAlerts: Alert[] = [
      {
        id: 'alert-surge-001',
        agentName: 'Surge Event Detector',
        priority: 'CRITICAL',
        title: 'Champions League Final Announced - Madrid Route Surge Expected',
        description: 'UEFA just announced Champions League Final 2025 at Santiago Bernabéu. Historical data shows 35% demand increase for similar events.',
        recommendation: 'Increase MAD route prices by 18% immediately. Set up hourly booking pace alerts. Expected 72-hour booking surge window.',
        confidenceScore: 0.94,
        revenueImpact: 287000,
        timeToAct: 'IMMEDIATE (within 4 hours)',
        affectedRoutes: ['LGW-MAD', 'LTN-MAD', 'STN-MAD'],
        createdAt: '2 hours ago',
        expiresAt: '22 hours from now'
      },
      {
        id: 'alert-booking-002',
        agentName: 'Advance Booking Curve Alert',
        priority: 'HIGH',
        title: 'BCN Route Booking Pace 40% Above Forecast',
        description: 'Barcelona routes showing unprecedented advance booking acceleration. Current pace suggests capacity constraints by week 8.',
        recommendation: 'Implement progressive pricing strategy. Increase prices 12% for departures in next 6 weeks. Consider capacity reallocation.',
        confidenceScore: 0.89,
        revenueImpact: 156000,
        timeToAct: 'TODAY',
        affectedRoutes: ['LGW-BCN', 'LTN-BCN'],
        createdAt: '45 minutes ago'
      },
      {
        id: 'alert-elasticity-003',
        agentName: 'Elasticity Change Alert',
        priority: 'HIGH',
        title: 'AMS Route Elasticity Shift Detected',
        description: 'Price elasticity for Amsterdam routes has decreased by 23% over past 14 days. Market appears less price-sensitive.',
        recommendation: 'Test aggressive pricing strategy. Implement 15% price increase and monitor conversion rates closely.',
        confidenceScore: 0.86,
        revenueImpact: 198000,
        timeToAct: 'THIS WEEK',
        affectedRoutes: ['LGW-AMS', 'STN-AMS'],
        createdAt: '1 hour ago'
      }
    ];
    setAlerts(mockAlerts);
  };

  const toggleAgent = async (agentId: string) => {
    setIsRunning(prev => ({ ...prev, [agentId]: true }));
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: agent.status === 'ACTIVE' ? 'SLEEPING' : 'ACTIVE' }
        : agent
    ));
    
    setIsRunning(prev => ({ ...prev, [agentId]: false }));
  };

  const runAgent = async (agentId: string) => {
    setIsRunning(prev => ({ ...prev, [agentId]: true }));
    
    // Simulate processing
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: 'PROCESSING' }
        : agent
    ));
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: 'ACTIVE', lastRun: 'Just now' }
        : agent
    ));
    
    setIsRunning(prev => ({ ...prev, [agentId]: false }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500';
      case 'PROCESSING': return 'bg-blue-500 animate-pulse';
      case 'SLEEPING': return 'bg-gray-500';
      case 'ERROR': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-600/20 text-red-400 border-red-500/40';
      case 'HIGH': return 'bg-orange-600/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM': return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/40';
      case 'LOW': return 'bg-green-600/20 text-green-400 border-green-500/40';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-500/40';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-50">Action Agents</h1>
            <p className="text-dark-400 mt-1">
              Advanced Predictive Analytics Suite - Mission Control for Revenue Intelligence
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-dark-300">System Active</span>
            </div>
          </div>
        </div>

        {/* Agent Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const IconComponent = agent.icon;
            return (
              <Card key={agent.id} className="bg-dark-900 border-dark-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-aviation-600/20 rounded-lg">
                        <IconComponent className="w-5 h-5 text-aviation-500" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-dark-50">
                          {agent.name}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></div>
                          <span className="text-xs text-dark-400">{agent.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-dark-400 mb-4 line-clamp-3">
                    {agent.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <div className="text-xs text-dark-500">Alerts Generated</div>
                      <div className="text-lg font-semibold text-dark-50">{agent.alertsGenerated}</div>
                    </div>
                    <div>
                      <div className="text-xs text-dark-500">Avg Confidence</div>
                      <div className="text-lg font-semibold text-green-400">
                        {(agent.avgConfidence * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-dark-500">Revenue Impact</div>
                      <div className="text-sm font-semibold text-aviation-400">
                        {formatCurrency(agent.revenueImpact)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-dark-500">Next Run</div>
                      <div className="text-sm text-dark-300">{agent.nextRun}</div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runAgent(agent.id)}
                      disabled={isRunning[agent.id] || agent.status === 'PROCESSING'}
                      className="flex-1 bg-dark-800 border-dark-600 hover:bg-dark-700"
                    >
                      {isRunning[agent.id] || agent.status === 'PROCESSING' ? (
                        <>
                          <Activity className="w-4 h-4 mr-2 animate-spin text-blue-500" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Run Now
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAgent(agent.id)}
                      disabled={isRunning[agent.id]}
                      className="bg-dark-800 border-dark-600 hover:bg-dark-700"
                    >
                      {agent.status === 'ACTIVE' ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-dark-800 border-dark-600 hover:bg-dark-700"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Active Alerts */}
        <Card className="bg-dark-900 border-dark-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-dark-50 flex items-center">
              <AlertTriangle className="w-5 h-5 text-aviation-500 mr-2" />
              Active Intelligence Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="border border-dark-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-2 py-0.5 ${getPriorityColor(alert.priority)}`}
                        >
                          {alert.priority}
                        </Badge>
                        <span className="text-xs text-dark-400">{alert.agentName}</span>
                        <div className="flex items-center space-x-1">
                          <Target className="w-3 h-3 text-green-400" />
                          <span className="text-xs text-green-400">
                            {(alert.confidenceScore * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                      </div>
                      <h3 className="text-base font-semibold text-dark-50 mb-2">
                        {alert.title}
                      </h3>
                      <p className="text-sm text-dark-400 mb-3">
                        {alert.description}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-center text-green-400 mb-1">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span className="font-semibold">{formatCurrency(alert.revenueImpact)}</span>
                      </div>
                      <div className="flex items-center text-orange-400">
                        <Clock className="w-3 h-3 mr-1" />
                        <span className="text-xs">{alert.timeToAct}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-dark-800/50 rounded-lg p-3 mb-3">
                    <h4 className="text-sm font-medium text-dark-50 mb-2">Recommended Actions:</h4>
                    <p className="text-sm text-dark-300 whitespace-pre-line">
                      {alert.recommendation}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <span className="text-xs text-dark-500">Affected Routes:</span>
                        <div className="flex space-x-1 mt-1">
                          {alert.affectedRoutes.map((route) => (
                            <Badge key={route} variant="outline" className="text-xs bg-aviation-600/10 text-aviation-400 border-aviation-500/30">
                              {route}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-dark-500">Created:</span>
                        <div className="text-xs text-dark-400">{alert.createdAt}</div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" className="bg-aviation-600 hover:bg-aviation-700">
                        Take Action
                      </Button>
                      <Button size="sm" variant="outline" className="bg-dark-800 border-dark-600 hover:bg-dark-700">
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}