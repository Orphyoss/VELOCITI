import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Settings, 
  TrendingUp, 
  AlertTriangle, 
  Zap,
  BarChart3,
  Route,
  Brain
} from 'lucide-react';

interface ActionAgent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  type: 'surge_detector' | 'booking_curve' | 'elasticity_change';
  lastRun: string;
  nextRun: string;
  alertsGenerated: number;
  revenueImpact: number;
  confidence: number;
  routes: string[];
}

interface AgentAlert {
  id: string;
  agentId: string;
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  route: string;
  revenueImpact: number;
  confidence: number;
  timeToAct: string;
  recommendation: string;
  createdAt: string;
  status: 'new' | 'reviewing' | 'acted' | 'dismissed';
}

interface AgentPerformance {
  agentId: string;
  totalAlerts: number;
  actionRate: number;
  avgRevenueImpact: number;
  accuracy: number;
  lastWeekTrend: number;
}

export default function ActionAgents() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Mock data for demonstration - in real implementation, these would come from API
  const [actionAgents] = useState<ActionAgent[]>([
    {
      id: 'surge-detector',
      name: 'Surge Event Detector',
      description: 'Monitors market events, viral demand surges, and competitive signals in real-time',
      status: 'active',
      type: 'surge_detector',
      lastRun: '2025-08-02T23:15:00Z',
      nextRun: '2025-08-02T23:30:00Z',
      alertsGenerated: 12,
      revenueImpact: 458000,
      confidence: 87,
      routes: ['LGW-AMS', 'LGW-BCN', 'LGW-MAD', 'LGW-FCO']
    },
    {
      id: 'booking-curve',
      name: 'Booking Curve Alerting',
      description: 'Analyzes booking patterns vs historical curves to detect anomalies',
      status: 'active',
      type: 'booking_curve',
      lastRun: '2025-08-02T23:10:00Z',
      nextRun: '2025-08-02T23:25:00Z',
      alertsGenerated: 8,
      revenueImpact: 234000,
      confidence: 92,
      routes: ['LGW-CDG', 'LGW-DUB', 'LGW-BRU']
    },
    {
      id: 'elasticity-change',
      name: 'Elasticity Change Alert',
      description: 'Detects changes in price elasticity and demand sensitivity',
      status: 'active',
      type: 'elasticity_change',
      lastRun: '2025-08-02T23:12:00Z',
      nextRun: '2025-08-02T23:27:00Z',
      alertsGenerated: 6,
      revenueImpact: 186000,
      confidence: 84,
      routes: ['LGW-MXP', 'LGW-VCE', 'LGW-NAP']
    }
  ]);

  const [recentAlerts] = useState<AgentAlert[]>([
    {
      id: 'alert-1',
      agentId: 'surge-detector',
      type: 'viral_demand_surge',
      priority: 'critical',
      title: 'Viral Demand Surge Detected - LGW-BCN',
      description: 'Search volume increased 127% in last 48 hours. Conversion rate up 23%.',
      route: 'LGW-BCN',
      revenueImpact: 89000,
      confidence: 89,
      timeToAct: 'IMMEDIATE',
      recommendation: 'VIRAL SURGE DETECTED: Test 12-18% price increase immediately. Monitor conversion rates hourly.',
      createdAt: '2025-08-02T22:45:00Z',
      status: 'new'
    },
    {
      id: 'alert-2',
      agentId: 'booking-curve',
      type: 'booking_anomaly',
      priority: 'high',
      title: 'Booking Curve Deviation - LGW-CDG',
      description: 'Bookings 31% below historical curve for 45-day advance window.',
      route: 'LGW-CDG',
      revenueImpact: 67000,
      confidence: 94,
      timeToAct: 'TODAY',
      recommendation: 'BOOKING UNDERPERFORMANCE: Consider promotional pricing or capacity adjustment.',
      createdAt: '2025-08-02T22:30:00Z',
      status: 'reviewing'
    },
    {
      id: 'alert-3',
      agentId: 'elasticity-change',
      type: 'elasticity_shift',
      priority: 'medium',
      title: 'Elasticity Shift - LGW-MXP',
      description: 'Price sensitivity decreased 18% over last 14 days.',
      route: 'LGW-MXP',
      revenueImpact: 45000,
      confidence: 78,
      timeToAct: 'THIS WEEK',
      recommendation: 'ELASTICITY IMPROVEMENT: Test 8-12% price increase on select flights.',
      createdAt: '2025-08-02T22:15:00Z',
      status: 'acted'
    }
  ]);

  const [performance] = useState<AgentPerformance[]>([
    {
      agentId: 'surge-detector',
      totalAlerts: 47,
      actionRate: 68,
      avgRevenueImpact: 72000,
      accuracy: 84,
      lastWeekTrend: 12
    },
    {
      agentId: 'booking-curve',
      totalAlerts: 32,
      actionRate: 78,
      avgRevenueImpact: 58000,
      accuracy: 91,
      lastWeekTrend: 8
    },
    {
      agentId: 'elasticity-change',
      totalAlerts: 28,
      actionRate: 71,
      avgRevenueImpact: 49000,
      accuracy: 86,
      lastWeekTrend: -3
    }
  ]);

  const toggleAgent = (agentId: string, enabled: boolean) => {
    console.log(`Toggle agent ${agentId}: ${enabled}`);
    // In real implementation, this would call the API
  };

  const runAgent = (agentId: string) => {
    console.log(`Run agent ${agentId}`);
    // In real implementation, this would trigger the agent
  };

  const updateAlertStatus = (alertId: string, status: string) => {
    console.log(`Update alert ${alertId} status: ${status}`);
    // In real implementation, this would update alert status
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'surge_detector': return <Zap className="w-5 h-5" />;
      case 'booking_curve': return <BarChart3 className="w-5 h-5" />;
      case 'elasticity_change': return <TrendingUp className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'inactive': return 'bg-gray-600';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600/20 text-red-400 border-red-500/40';
      case 'high': return 'bg-orange-600/20 text-orange-400 border-orange-500/40';
      case 'medium': return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/40';
      case 'low': return 'bg-green-600/20 text-green-400 border-green-500/40';
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

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-dark-50">Action Agents</h1>
          <p className="text-sm text-dark-400 mt-1">Real-time intelligence agents monitoring revenue opportunities</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Global </span>Settings
          </Button>
        </div>
      </div>

      {/* Agent Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {actionAgents.map((agent) => {
          const agentPerf = performance.find(p => p.agentId === agent.id);
          
          return (
            <Card key={agent.id} className="bg-dark-900/50 border-dark-800 hover:bg-dark-900/70 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-aviation-600/20">
                      {getAgentIcon(agent.type)}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-dark-50">{agent.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                        <span className="text-xs text-dark-400 capitalize">{agent.status}</span>
                      </div>
                    </div>
                  </div>
                  <Switch 
                    checked={agent.status === 'active'}
                    onCheckedChange={(checked) => toggleAgent(agent.id, checked)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-dark-400">{agent.description}</p>
                
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-dark-500 mb-1">Alerts Today</div>
                    <div className="text-lg font-semibold text-dark-50">{agent.alertsGenerated}</div>
                  </div>
                  <div>
                    <div className="text-xs text-dark-500 mb-1">Revenue Impact</div>
                    <div className="text-lg font-semibold text-aviation-400">{formatCurrency(agent.revenueImpact)}</div>
                  </div>
                </div>

                {/* Confidence and Routes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-dark-500">Confidence</span>
                    <span className="text-xs text-dark-300">{agent.confidence}%</span>
                  </div>
                  <Progress value={agent.confidence} className="h-1" />
                </div>

                <div>
                  <div className="text-xs text-dark-500 mb-1">Monitoring Routes</div>
                  <div className="flex flex-wrap gap-1">
                    {agent.routes.slice(0, 3).map((route) => (
                      <Badge key={route} variant="outline" className="text-xs px-1.5 py-0.5 text-dark-400 border-dark-700">
                        {route}
                      </Badge>
                    ))}
                    {agent.routes.length > 3 && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-dark-400 border-dark-700">
                        +{agent.routes.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 text-xs"
                    onClick={() => runAgent(agent.id)}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Run Now
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setSelectedAgent(agent.id)}
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>

                {/* Last Run Info */}
                <div className="flex items-center justify-between text-xs text-dark-500 pt-2 border-t border-dark-800">
                  <span>Last: {formatTimeAgo(agent.lastRun)}</span>
                  <span>Next: {formatTimeAgo(agent.nextRun)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="alerts" className="space-y-3 sm:space-y-4 lg:space-y-6">
        <TabsList className="bg-dark-900/50 border border-dark-800 grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="alerts" className="data-[state=active]:bg-aviation-600/20 flex-col sm:flex-row gap-1 sm:gap-2 py-2 sm:py-3">
            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Recent Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-aviation-600/20 flex-col sm:flex-row gap-1 sm:gap-2 py-2 sm:py-3">
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="routes" className="data-[state=active]:bg-aviation-600/20 flex-col sm:flex-row gap-1 sm:gap-2 py-2 sm:py-3">
            <Route className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Routes</span>
          </TabsTrigger>
        </TabsList>

        {/* Recent Alerts Tab */}
        <TabsContent value="alerts" className="space-y-3 sm:space-y-4">
          <Card className="bg-dark-900/50 border-dark-800">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg text-dark-50">Recent Agent Alerts</CardTitle>
              <CardDescription className="text-sm text-dark-400">
                Real-time alerts generated by intelligence agents
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="h-80 sm:h-96 overflow-y-auto">
                <div className="space-y-3 sm:space-y-4">
                  {recentAlerts.map((alert) => (
                    <div key={alert.id} className="border border-dark-800 rounded-lg p-3 sm:p-4 hover:bg-dark-800/30 transition-colors">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getPriorityColor(alert.priority)}`}>
                            {alert.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs px-2 py-0.5 text-aviation-400 border-aviation-500/40">
                            {alert.route}
                          </Badge>
                          <span className="text-xs text-dark-500">{formatTimeAgo(alert.createdAt)}</span>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold text-dark-50 mb-1">{alert.title}</h4>
                          <p className="text-xs text-dark-400 mb-3">{alert.description}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs">
                          <div>
                            <span className="text-dark-500">Revenue Impact:</span>
                            <div className="font-semibold text-aviation-400">{formatCurrency(alert.revenueImpact)}</div>
                          </div>
                          <div>
                            <span className="text-dark-500">Confidence:</span>
                            <div className="font-semibold text-dark-300">{alert.confidence}%</div>
                          </div>
                          <div>
                            <span className="text-dark-500">Time to Act:</span>
                            <div className="font-semibold text-yellow-400">{alert.timeToAct}</div>
                          </div>
                        </div>
                        
                        <div className="bg-dark-800/50 rounded p-2 mb-3">
                          <div className="text-xs text-dark-500 mb-1">Recommendation:</div>
                          <div className="text-xs text-dark-300">{alert.recommendation}</div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                          <Button 
                            size="sm" 
                            variant={alert.status === 'new' ? 'default' : 'outline'}
                            className="text-xs flex-1"
                            onClick={() => updateAlertStatus(alert.id, 'reviewing')}
                          >
                            {alert.status === 'new' ? 'Review' : 'Update'}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs flex-1">
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {performance.map((perf) => {
              const agent = actionAgents.find(a => a.id === perf.agentId);
              if (!agent) return null;
              
              return (
                <Card key={perf.agentId} className="bg-dark-900/50 border-dark-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-dark-50 flex items-center space-x-2">
                      {getAgentIcon(agent.type)}
                      <span>{agent.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-dark-500 mb-1">Total Alerts</div>
                        <div className="text-2xl font-bold text-dark-50">{perf.totalAlerts}</div>
                      </div>
                      <div>
                        <div className="text-xs text-dark-500 mb-1">Action Rate</div>
                        <div className="text-2xl font-bold text-aviation-400">{perf.actionRate}%</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-dark-500 mb-1">Avg Revenue Impact</div>
                      <div className="text-lg font-semibold text-dark-50">{formatCurrency(perf.avgRevenueImpact)}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-dark-500">Accuracy</span>
                        <span className="text-xs text-dark-300">{perf.accuracy}%</span>
                      </div>
                      <Progress value={perf.accuracy} className="h-1" />
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-dark-800">
                      <span className="text-xs text-dark-500">Last Week Trend</span>
                      <div className={`flex items-center text-xs ${perf.lastWeekTrend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <TrendingUp className={`w-3 h-3 mr-1 ${perf.lastWeekTrend < 0 ? 'rotate-180' : ''}`} />
                        {Math.abs(perf.lastWeekTrend)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Route Analysis Tab */}
        <TabsContent value="routes" className="space-y-4">
          <Card className="bg-dark-900/50 border-dark-800">
            <CardHeader>
              <CardTitle className="text-lg text-dark-50">Route-Level Agent Activity</CardTitle>
              <CardDescription className="text-dark-400">
                Intelligence agent monitoring across route network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-dark-500">
                <Route className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Route analysis dashboard will be implemented here</p>
                <p className="text-sm mt-2">Real-time route-level agent performance and alert distribution</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}