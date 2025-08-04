import { useState, useEffect } from 'react';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { useLocation } from 'wouter';
import AppShell from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
  Radar,
  Filter,
  Search,
  ArrowUpDown
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
  const [, setLocation] = useLocation();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('performance');
  const [isRunning, setIsRunning] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('created');

  useEffect(() => {
    console.log('[ActionAgents] Component mounted');
    setCurrentModule('action-agents');
    
    try {
      initializeAgents();
      loadRealAlerts();
    } catch (error) {
      console.error('[ActionAgents] Error during initialization:', error);
    }
  }, [setCurrentModule]);

  const loadRealAlerts = async () => {
    console.log('[ActionAgents] Starting loadRealAlerts...');
    try {
      setLoading(true);
      console.log('[ActionAgents] Fetching alerts from /api/alerts...');
      const response = await fetch('/api/alerts');
      
      if (!response.ok) {
        console.error('[ActionAgents] Failed to fetch alerts:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const realAlerts = await response.json();
      console.log('[ActionAgents] Received', realAlerts.length, 'alerts from database');
      
      // Transform database alerts to match our interface
      const transformedAlerts: Alert[] = realAlerts.map((alert: any) => ({
        id: alert.id,
        agentName: getAgentDisplayName(alert.agent_id),
        priority: alert.priority as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        title: alert.title,
        description: alert.description,
        recommendation: alert.recommendation || 'No specific recommendation provided.',
        confidenceScore: alert.confidence_score,
        revenueImpact: alert.revenue_impact || 0,
        timeToAct: getTimeToAct(alert.priority),
        affectedRoutes: alert.affected_routes || [],
        createdAt: formatTimeAgo(alert.created_at),
        expiresAt: alert.expires_at ? formatTimeAgo(alert.expires_at) : undefined
      }));
      
      console.log('[ActionAgents] Successfully transformed', transformedAlerts.length, 'alerts');
      setAlerts(transformedAlerts);
    } catch (error) {
      console.error('[ActionAgents] Error in loadRealAlerts:', error);
      // Show user-friendly error message
      setAlerts([]);
    } finally {
      setLoading(false);
      console.log('[ActionAgents] loadRealAlerts completed');
    }
  };

  const getAgentDisplayName = (agentId: string | null | undefined): string => {
    if (!agentId) {
      return 'System Agent';
    }
    const agentMapping: Record<string, string> = {
      'network': 'Network Agent',
      'performance': 'Performance Agent', 
      'competitive': 'Competitive Agent',
      'metrics_monitoring': 'Metrics Agent'
    };
    return agentMapping[agentId] || agentId;
  };

  const getTimeToAct = (priority: string): string => {
    switch (priority) {
      case 'CRITICAL': return 'IMMEDIATE (within 4 hours)';
      case 'HIGH': return 'TODAY';
      case 'MEDIUM': return 'THIS WEEK';
      case 'LOW': return 'THIS MONTH';
      default: return 'WHEN CONVENIENT';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const initializeAgents = () => {
    console.log('[ActionAgents] Initializing agents...');
    const agentData: Agent[] = [
      {
        id: 'performance',
        name: 'Performance Agent',
        description: 'Monitors route performance metrics and identifies optimization opportunities for network efficiency and revenue enhancement.',
        status: 'ACTIVE',
        icon: TrendingUp,
        lastRun: '8 minutes ago',
        nextRun: 'In 22 minutes',
        alertsGenerated: 38,
        avgConfidence: 0.92,
        revenueImpact: 1890000
      },
      {
        id: 'competitive',
        name: 'Competitive Agent',
        description: 'Analyzes competitor pricing strategies and market positioning to identify competitive opportunities and threats.',
        status: 'ACTIVE',
        icon: Radar,
        lastRun: '12 minutes ago',
        nextRun: 'In 18 minutes',
        alertsGenerated: 37,
        avgConfidence: 0.87,
        revenueImpact: 2450000
      },
      {
        id: 'network',
        name: 'Network Agent',
        description: 'Evaluates network capacity, route profitability, and identifies expansion or optimization opportunities across the route network.',
        status: 'PROCESSING',
        icon: Brain,
        lastRun: '2 minutes ago',
        nextRun: 'In 28 minutes',
        alertsGenerated: 32,
        avgConfidence: 0.84,
        revenueImpact: 1340000
      }
    ];
    setAgents(agentData);
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
    console.log('[ActionAgents] Running agent:', agentId);
    setIsRunning(prev => ({ ...prev, [agentId]: true }));
    
    // Simulate processing
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: 'PROCESSING' }
        : agent
    ));
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { ...agent, status: 'ACTIVE', lastRun: 'Just now' }
          : agent
      ));
      
      console.log('[ActionAgents] Agent execution completed successfully:', agentId);
    } catch (error) {
      console.error('[ActionAgents] Agent execution failed:', agentId, error);
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { ...agent, status: 'ERROR', lastRun: 'Failed' }
          : agent
      ));
    } finally {
      setIsRunning(prev => ({ ...prev, [agentId]: false }));
    }
  };

  const handleOpenSettings = (agentId: string) => {
    // Navigate to the admin page with the agents tab active
    // The admin page will handle focusing on the specific agent
    setLocation('/admin?tab=agents&agent=' + agentId);
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

  // Filter and sort alerts for the selected agent
  const getFilteredAndSortedAlerts = () => {
    let filteredAlerts = alerts.filter(alert => alert.agentName.toLowerCase().includes(selectedAgent));
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      filteredAlerts = filteredAlerts.filter(alert => alert.priority.toLowerCase() === priorityFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      filteredAlerts = filteredAlerts.filter(alert => 
        alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort alerts
    return filteredAlerts.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        case 'confidence':
          return b.confidenceScore - a.confidenceScore;
        case 'impact':
          return b.revenueImpact - a.revenueImpact;
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-dark-50">Action Agents</h1>
            <p className="text-dark-400 mt-1 text-sm sm:text-base">
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

        {/* Agent Selection - Mobile Responsive */}
        <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950 dark:via-indigo-950 dark:to-blue-950 border-2 border-blue-300 dark:border-blue-700 shadow-lg">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Label htmlFor="agent-select" className="text-lg sm:text-xl font-bold text-blue-900 dark:text-blue-100 flex items-center">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600" />
                  Select Action Agent:
                </Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="w-full sm:w-[350px] lg:w-[400px] h-12 sm:h-14 text-base sm:text-lg border-4 border-white dark:border-white bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow" id="agent-select">
                    <SelectValue placeholder="Choose an Action Agent">
                      {selectedAgent && agents.find(a => a.id === selectedAgent) && (() => {
                        const agent = agents.find(a => a.id === selectedAgent)!;
                        const IconComponent = agent.icon;
                        return (
                          <div className="flex items-center space-x-2">
                            <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            <span className="font-medium text-sm sm:text-base">{agent.name}</span>
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></div>
                          </div>
                        );
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-full sm:w-[350px] lg:w-[400px]">
                    {agents.map((agent) => {
                      const IconComponent = agent.icon;
                      return (
                        <SelectItem key={agent.id} value={agent.id} className="text-sm sm:text-base py-3 sm:py-4 hover:bg-blue-50 dark:hover:bg-blue-900">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-3">
                              <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                              <div>
                                <div className="font-medium text-sm sm:text-base">{agent.name}</div>
                                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{agent.description.substring(0, 60)}...</div>
                              </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {selectedAgent && agents.find(a => a.id === selectedAgent) && (
                <div className="text-left lg:text-right">
                  <div className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">Current Status</div>
                  <div className="flex items-center lg:justify-end">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(agents.find(a => a.id === selectedAgent)!.status)} mr-2`}></div>
                    <span className="text-sm font-medium">{agents.find(a => a.id === selectedAgent)!.status}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Selected Agent Display */}
        {selectedAgent && agents.find(a => a.id === selectedAgent) && (
          <SelectedAgentCard 
            agent={agents.find(a => a.id === selectedAgent)!} 
            isRunning={isRunning}
            onRunAgent={runAgent}
            onToggleAgent={toggleAgent}
            formatCurrency={formatCurrency}
            getStatusColor={getStatusColor}
            onOpenSettings={handleOpenSettings}
          />
        )}

        {/* Alert Management Controls */}
        {selectedAgent && (
          <Card className="bg-dark-900 border-dark-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-dark-50 flex items-center">
                  <AlertTriangle className="w-5 h-5 text-aviation-500 mr-2" />
                  Alert Management ({getFilteredAndSortedAlerts().length} alerts)
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-aviation-400 border-aviation-500/30">
                    {agents.find(a => a.id === selectedAgent)?.name}
                  </Badge>
                </div>
              </div>
              
              {/* Filters and Controls - Mobile Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-sm text-dark-300 flex items-center">
                    <Search className="h-4 w-4 mr-1" />
                    Search Alerts
                  </Label>
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search alerts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-dark-800 border-dark-600 text-dark-50 placeholder-dark-400 h-10 text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority-filter" className="text-sm text-dark-300 flex items-center">
                    <Filter className="h-4 w-4 mr-1" />
                    Priority
                  </Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="bg-dark-800 border-dark-600 text-dark-50 h-10 text-sm" id="priority-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sort-by" className="text-sm text-dark-300 flex items-center">
                    <ArrowUpDown className="h-4 w-4 mr-1" />
                    Sort By
                  </Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-dark-800 border-dark-600 text-dark-50 h-10 text-sm" id="sort-by">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created">Recent</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="confidence">Confidence</SelectItem>
                      <SelectItem value="impact">Revenue Impact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-dark-300">Quick Actions</Label>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        console.log('[ActionAgents] Clearing all filters');
                        setPriorityFilter('all');
                        setSearchQuery('');
                        setSortBy('created');
                      }}
                      className="bg-dark-800 border-dark-600 hover:bg-dark-700 text-dark-300 h-10 text-sm"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFilteredAndSortedAlerts().map((alert) => (
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
                {getFilteredAndSortedAlerts().length === 0 && !loading && (
                  <div className="text-center py-8 text-dark-400">
                    {searchQuery || priorityFilter !== 'all' 
                      ? 'No alerts match the current filters' 
                      : 'No active alerts for this agent'
                    }
                  </div>
                )}
                {loading && (
                  <div className="text-center py-8 text-dark-400">
                    <div className="animate-spin h-6 w-6 border-2 border-aviation-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    Loading alerts...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

interface SelectedAgentCardProps {
  agent: Agent;
  isRunning: Record<string, boolean>;
  onRunAgent: (agentId: string) => void;
  onToggleAgent: (agentId: string) => void;
  formatCurrency: (amount: number) => string;
  getStatusColor: (status: string) => string;
  onOpenSettings: (agentId: string) => void;
}

function SelectedAgentCard({ agent, isRunning, onRunAgent, onToggleAgent, formatCurrency, getStatusColor, onOpenSettings }: SelectedAgentCardProps) {
  const IconComponent = agent.icon;
  
  return (
    <Card className="bg-dark-900 border-dark-800">
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
        
        {/* Mobile Responsive Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div>
            <div className="text-xs text-dark-500">Alerts Generated</div>
            <div className="text-base sm:text-lg font-semibold text-dark-50">{agent.alertsGenerated}</div>
          </div>
          <div>
            <div className="text-xs text-dark-500">Avg Confidence</div>
            <div className="text-base sm:text-lg font-semibold text-green-400">
              {(agent.avgConfidence * 100).toFixed(0)}%
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="text-xs text-dark-500">Revenue Impact</div>
            <div className="text-sm font-semibold text-aviation-400">
              {formatCurrency(agent.revenueImpact)}
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="text-xs text-dark-500">Next Run</div>
            <div className="text-sm text-dark-300">{agent.nextRun}</div>
          </div>
        </div>

        {/* Mobile Responsive Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              console.log('[ActionAgents] User clicked Run Agent for:', agent.id);
              onRunAgent(agent.id);
            }}
            disabled={isRunning[agent.id] || agent.status === 'PROCESSING'}
            className="flex-1 bg-dark-800 border-dark-600 hover:bg-dark-700 h-10 touch-manipulation"
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
            onClick={() => {
              console.log('[ActionAgents] User clicked Toggle Agent for:', agent.id);
              onToggleAgent(agent.id);
            }}
            disabled={isRunning[agent.id]}
            className="bg-dark-800 border-dark-600 hover:bg-dark-700 h-10 w-full sm:w-12 touch-manipulation"
          >
            {agent.status === 'ACTIVE' ? (
              <>
                <Pause className="w-4 h-4 sm:mr-0 mr-2" />
                <span className="sm:hidden">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 sm:mr-0 mr-2" />
                <span className="sm:hidden">Start</span>
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              console.log('[ActionAgents] User clicked Settings for:', agent.id);
              onOpenSettings(agent.id);
            }}
            className="bg-dark-800 border-dark-600 hover:bg-dark-700 h-10 w-full sm:w-12 touch-manipulation"
            title={`Configure ${agent.name} settings`}
          >
            <Settings className="w-4 h-4 sm:mr-0 mr-2" />
            <span className="sm:hidden">Configure</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}