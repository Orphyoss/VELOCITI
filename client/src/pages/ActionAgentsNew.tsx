import React, { useState, useEffect } from 'react';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target, 
  Zap, 
  TrendingUp,
  Globe,
  Brain,
  Eye,
  AlertCircle,
  ChevronRight,
  BarChart3,
  Users,
  Plane,
  Database,
  Server,
  Code,
  Loader,
  DollarSign
} from 'lucide-react';

interface ActionAgent {
  id: string;
  name: string;
  className: string;
  description: string;
  status: 'active' | 'paused' | 'error' | 'maintenance';
  dbTables: string[];
  configParams: Array<{
    key: string;
    type: 'float' | 'int' | 'string';
    default: any;
    description: string;
  }>;
  methods: string[];
  schedule: {
    frequency: string;
    time: string;
  };
  lastExecution?: string;
  nextExecution?: string;
}

interface AgentMetrics {
  avg_processing_time?: number;
  success_rate?: number;
  alerts_generated?: number;
  revenue_impact?: number;
  execution_count?: number;
  error_count?: number;
}

interface AgentAlert {
  id: string;
  title: string;
  description: string;
  priority_level: string;
  confidence_score: number;
  created_at: string;
}

interface ExecutionHistory {
  id: string;
  execution_start: string;
  status: string;
  alerts_generated: number;
  processing_time_ms: number;
  revenue_impact?: number;
  error_message?: string;
}

interface ActionAgentsNewProps {
  selectedAgentId?: string | null;
}

export default function ActionAgentsNew({ selectedAgentId }: ActionAgentsNewProps = {}) {
  const { setCurrentModule } = useVelocitiStore();
  const [activeAgentTab, setActiveAgentTab] = useState(selectedAgentId || 'performance');
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [agentData, setAgentData] = useState<Record<string, any>>({});

  // Update activeAgentTab when selectedAgentId changes
  useEffect(() => {
    if (selectedAgentId) {
      setActiveAgentTab(selectedAgentId);
    }
  }, [selectedAgentId]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action Agents matching database agent IDs
  const actionAgentDefinitions: Record<string, ActionAgent> = {
    'performance': {
      id: 'performance',
      name: 'Performance Agent',
      className: 'PerformanceAgent',
      description: 'Monitors route performance metrics and identifies optimization opportunities for network efficiency and revenue enhancement',
      status: 'active',
      dbTables: ['route_performance', 'flight_performance', 'load_factors'],
      configParams: [
        { key: 'performance_threshold', type: 'float', default: 0.85, description: 'Performance score threshold for alerts' },
        { key: 'load_factor_threshold', type: 'float', default: 0.75, description: 'Load factor threshold for optimization' },
        { key: 'confidence_threshold', type: 'float', default: 0.80, description: 'Minimum confidence threshold' }
      ],
      methods: [
        'analyze_route_performance(routes)',
        '_get_performance_metrics(conn, route)',
        '_calculate_optimization_opportunities(conn, route)',
        '_detect_underperforming_routes(conn, routes)'
      ],
      schedule: { frequency: 'daily', time: '02:00' }
    },
    
    'competitive': {
      id: 'competitive',
      name: 'Competitive Agent',
      className: 'CompetitiveAgent',
      description: 'Analyzes competitor pricing strategies and market positioning to identify competitive opportunities and threats',
      status: 'active',
      dbTables: ['competitive_pricing', 'market_share', 'competitor_analysis'],
      configParams: [
        { key: 'price_variance_threshold', type: 'float', default: 0.15, description: 'Price variance threshold for alerts' },
        { key: 'market_share_threshold', type: 'float', default: 0.10, description: 'Market share change threshold' },
        { key: 'confidence_threshold', type: 'float', default: 0.75, description: 'Minimum confidence threshold' }
      ],
      methods: [
        'analyze_competitive_landscape(routes)',
        '_get_competitor_pricing(conn, route)',
        '_calculate_price_positioning(conn, route)',
        '_detect_competitive_threats(conn, routes)'
      ],
      schedule: { frequency: 'daily', time: '03:00' }
    },

    'network': {
      id: 'network', 
      name: 'Network Agent',
      className: 'NetworkAgent',
      description: 'Evaluates network capacity, route profitability, and identifies expansion or optimization opportunities across the route network',
      status: 'active',
      dbTables: ['network_analysis', 'capacity_utilization', 'route_profitability'],
      configParams: [
        { key: 'capacity_threshold', type: 'float', default: 0.90, description: 'Capacity utilization threshold' },
        { key: 'profitability_threshold', type: 'float', default: 0.15, description: 'Route profitability threshold' },
        { key: 'confidence_threshold', type: 'float', default: 0.70, description: 'Minimum confidence threshold' }
      ],
      methods: [
        'analyze_network_optimization(routes)',
        '_get_capacity_metrics(conn, route)',
        '_calculate_network_efficiency(conn, route)',
        '_identify_expansion_opportunities(conn, routes)'
      ],
      schedule: { frequency: 'hourly', time: '00' }
    }
  };

  useEffect(() => {
    console.log('[ActionAgentsNew] Component mounted, setting current module...');
    setCurrentModule('action-agents');
    
    try {
      loadAgentData();
    } catch (error) {
      console.error('[ActionAgentsNew] Error during initialization:', error);
      setError('Failed to initialize Action Agents. Please refresh the page.');
    }
  }, [setCurrentModule]);

  const loadAgentData = async () => {
    console.log('[ActionAgentsNew] Starting loadAgentData...');
    setLoading(true);
    try {
      console.log('[ActionAgentsNew] Fetching /api/telos/agents/status...');
      const response = await fetch('/api/telos/agents/status');
      console.log('[ActionAgentsNew] Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ActionAgentsNew] API Error:', response.status, errorText);
        throw new Error(`Failed to load agent data: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[ActionAgentsNew] Agent data loaded successfully:', data);
      setAgentData(data);
      setError(null);
    } catch (err: any) {
      console.error('[ActionAgentsNew] Error loading agent data:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
      console.log('[ActionAgentsNew] loadAgentData completed');
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      active: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-400', dot: 'bg-green-400', label: 'Active' },
      paused: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-400', dot: 'bg-yellow-400', label: 'Paused' },
      error: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-400', dot: 'bg-red-400', label: 'Error' },
      maintenance: { bg: 'bg-gray-100 dark:bg-gray-900/20', text: 'text-gray-800 dark:text-gray-400', dot: 'bg-gray-400', label: 'Maintenance' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.maintenance;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <div className={`w-2 h-2 ${config.dot} rounded-full mr-1.5 ${status === 'active' ? 'animate-pulse' : ''}`}></div>
        {config.label}
      </span>
    );
  };

  const AgentSubTabs = ({ agent }: { agent: ActionAgent }) => {
    const subTabs = [
      { id: 'overview', label: 'Overview', icon: Activity },
      { id: 'configuration', label: 'Configuration', icon: Settings },
      { id: 'schedule', label: 'Schedule', icon: Calendar },
      { id: 'execution', label: 'Run & Monitor', icon: Play }
    ];

    return (
      <>
        <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
          <nav className="flex space-x-8">
            {subTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeSubTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sub-tab Content */}
        {activeSubTab === 'overview' && <AgentOverview agent={agent} />}
        {activeSubTab === 'configuration' && <AgentConfiguration agent={agent} />}
        {activeSubTab === 'schedule' && <AgentSchedule agent={agent} />}
        {activeSubTab === 'execution' && <AgentExecution agent={agent} />}
      </>
    );
  };

  const AgentOverview = ({ agent }: { agent: ActionAgent }) => {
    const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
    const [recentAlerts, setRecentAlerts] = useState<AgentAlert[]>([]);
    const [loadingMetrics, setLoadingMetrics] = useState(true);

    useEffect(() => {
      loadAgentMetrics();
      loadRecentAlerts();
    }, [agent.id]);

    const loadAgentMetrics = async () => {
      try {
        const response = await fetch(`/api/telos/agents/${agent.id}/metrics`);
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        console.error('Error loading agent metrics:', err);
      } finally {
        setLoadingMetrics(false);
      }
    };

    const loadRecentAlerts = async () => {
      try {
        const response = await fetch(`/api/telos/agents/${agent.id}/alerts?limit=5`);
        const data = await response.json();
        setRecentAlerts(data);
      } catch (err) {
        console.error('Error loading recent alerts:', err);
      }
    };

    if (loadingMetrics) {
      return (
        <div className="flex justify-center items-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-600 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">Loading metrics...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Real Performance Metrics from Database */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Processing Time</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {metrics?.avg_processing_time ? `${metrics.avg_processing_time}ms` : '--'}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {metrics?.success_rate ? `${parseFloat(metrics.success_rate.toString()).toFixed(1)}%` : '--'}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Alerts Generated</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {metrics?.alerts_generated || '--'}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue Impact</p>
                  <p className="text-xl font-bold text-green-600">
                    {metrics?.revenue_impact ? `€${parseFloat(metrics.revenue_impact.toString()).toLocaleString()}` : '--'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database Tables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Database Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agent.dbTables.map((table, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <Server className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{table}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Connected • Live Data
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts from intelligence_insights table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {recentAlerts.length > 0 ? recentAlerts.map((alert) => (
                <div key={alert.id} className="py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className={`p-2 rounded-lg mr-4 ${
                        alert.priority_level === 'Critical' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 
                        alert.priority_level === 'High' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' :
                        'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      }`}>
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{alert.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.description}</p>
                        <p className="text-xs text-gray-500 mt-2">{alert.created_at}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">{(alert.confidence_score * 100).toFixed(0)}%</div>
                      <div className="text-xs text-gray-500">Confidence</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-6 text-center text-gray-500">
                  No recent alerts from this agent
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Class Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="h-5 w-5 mr-2" />
              Agent Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {agent.methods.map((method, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                  <code className="text-sm text-blue-600 dark:text-blue-400 font-mono">{method}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const AgentConfiguration = ({ agent }: { agent: ActionAgent }) => {
    const [config, setConfig] = useState<Record<string, any>>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      loadAgentConfig();
    }, [agent.id]);

    const loadAgentConfig = async () => {
      try {
        const response = await fetch(`/api/telos/agents/${agent.id}/config`);
        const data = await response.json();
        setConfig(data);
      } catch (err) {
        console.error('Error loading agent config:', err);
      }
    };

    const updateConfig = (key: string, value: any) => {
      setConfig(prev => ({ ...prev, [key]: value }));
      setHasChanges(true);
    };

    const saveConfig = async () => {
      setSaving(true);
      try {
        const response = await fetch(`/api/telos/agents/${agent.id}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
        
        if (!response.ok) throw new Error('Failed to save configuration');
        
        setHasChanges(false);
        console.log(`Saved ${agent.className} config:`, config);
      } catch (err) {
        console.error('Error saving config:', err);
        alert('Failed to save configuration');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {agent.className} Configuration
              </CardTitle>
              {hasChanges && (
                <Button
                  onClick={saveConfig}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Real Configuration Parameters */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Detection Thresholds</h4>
                
                {agent.configParams.map((param) => (
                  <div key={param.key}>
                    <Label className="text-sm font-medium">
                      {param.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                    <Input
                      type={param.type === 'int' ? 'number' : param.type === 'float' ? 'number' : 'text'}
                      step={param.type === 'float' ? '0.01' : '1'}
                      value={config[param.key] ?? param.default}
                      onChange={(e) => updateConfig(param.key, param.type === 'int' ? parseInt(e.target.value) : parseFloat(e.target.value))}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                  </div>
                ))}
              </div>

              {/* Routes Configuration - loaded from database */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Route Configuration</h4>
                
                <div>
                  <Label className="text-sm font-medium">
                    Monitored Routes
                  </Label>
                  <div className="space-y-2 mt-2">
                    {config.routes?.map((route: string, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                        <span className="text-sm font-medium">{route}</span>
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newRoutes = config.routes.filter((_: any, i: number) => i !== index);
                            updateConfig('routes', newRoutes);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </Button>
                      </div>
                    )) || (
                      <div className="text-sm text-gray-500">Loading routes from database...</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const AgentSchedule = ({ agent }: { agent: ActionAgent }) => {
    const [schedule, setSchedule] = useState<Record<string, any>>({});
    const [executionHistory, setExecutionHistory] = useState<ExecutionHistory[]>([]);

    useEffect(() => {
      loadSchedule();
      loadExecutionHistory();
    }, [agent.id]);

    const loadSchedule = async () => {
      try {
        const response = await fetch(`/api/telos/agents/${agent.id}/schedule`);
        const data = await response.json();
        setSchedule(data);
      } catch (err) {
        console.error('Error loading schedule:', err);
      }
    };

    const loadExecutionHistory = async () => {
      try {
        const response = await fetch(`/api/telos/agents/${agent.id}/execution-history?limit=10`);
        const data = await response.json();
        setExecutionHistory(data);
      } catch (err) {
        console.error('Error loading execution history:', err);
      }
    };

    const updateSchedule = async (newSchedule: Record<string, any>) => {
      try {
        const response = await fetch(`/api/telos/agents/${agent.id}/schedule`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSchedule)
        });
        
        if (!response.ok) throw new Error('Failed to update schedule');
        setSchedule(newSchedule);
      } catch (err) {
        console.error('Error updating schedule:', err);
        alert('Failed to update schedule');
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              Schedule {agent.className}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">
                    Execution Frequency
                  </Label>
                  <Select 
                    value={schedule.frequency || 'daily'}
                    onValueChange={(value) => updateSchedule({...schedule, frequency: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="manual">Manual Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Execution Time
                  </Label>
                  <Input
                    type="time"
                    value={schedule.time || '02:00'}
                    onChange={(e) => updateSchedule({...schedule, time: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Execution History</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {executionHistory.map((execution) => (
                    <div key={execution.id} className={`flex justify-between items-center p-3 rounded ${
                      execution.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20' :
                      execution.status === 'failed' ? 'bg-red-50 dark:bg-red-900/20' :
                      'bg-yellow-50 dark:bg-yellow-900/20'
                    }`}>
                      <span className="text-sm">{execution.execution_start}</span>
                      <span className={`text-xs font-medium ${
                        execution.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                        execution.status === 'failed' ? 'text-red-600 dark:text-red-400' :
                        'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {execution.status}
                      </span>
                    </div>
                  ))}
                  {executionHistory.length === 0 && (
                    <div className="text-sm text-gray-500">Loading execution history...</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const AgentExecution = ({ agent }: { agent: ActionAgent }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<Array<{time: string, level: string, message: string}>>([]);
    const [executionResults, setExecutionResults] = useState<any>(null);

    const runAgent = async () => {
      setIsRunning(true);
      setLogs([]);
      
      try {
        const response = await fetch(`/api/telos/agents/${agent.id}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Agent execution failed');

        const result = await response.json();
        setExecutionResults(result);
        
        setLogs(prev => [...prev, {
          time: new Date().toLocaleTimeString(),
          level: 'INFO',
          message: `${agent.className} execution completed successfully`
        }]);

      } catch (err: any) {
        console.error('Agent execution error:', err);
        setLogs(prev => [...prev, {
          time: new Date().toLocaleTimeString(),
          level: 'ERROR',
          message: `Execution failed: ${err.message}`
        }]);
      } finally {
        setIsRunning(false);
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Run {agent.className}
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  onClick={runAgent}
                  disabled={isRunning}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {isRunning ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-gray-200 rounded-full animate-spin border-t-blue-600"></div>
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {executionResults && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {executionResults.alerts_generated || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Alerts Generated</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    €{executionResults.revenue_impact?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Revenue Impact</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {executionResults.confidence ? (executionResults.confidence * 100).toFixed(0) : 0}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Confidence</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Execution Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  <span className="text-gray-400">[{log.time}]</span>
                  <span className={`ml-2 ${
                    log.level === 'ERROR' ? 'text-red-400' :
                    log.level === 'WARN' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-white ml-2">{log.message}</span>
                </div>
              ))}
              {isRunning && (
                <div className="mb-1">
                  <span className="text-gray-400">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-blue-400 ml-2">INFO</span>
                  <span className="text-white ml-2">Agent execution in progress...</span>
                  <span className="animate-pulse">|</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Real Database Query Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Database Query Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-sm font-mono">
{agent.id === 'performance' && `-- Performance Agent Queries
SELECT route_id, load_factor, yield_per_pax, 
       revenue_per_flight, cost_per_flight
FROM route_performance 
WHERE performance_date >= CURRENT_DATE - INTERVAL '30 days'
AND route_id = ANY($1)
ORDER BY performance_date DESC;

SELECT route_id, flight_dt, load_factor, bookings_count,
       cancellation_rate, delay_minutes
FROM flight_performance 
WHERE flight_dt >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY route_id, flight_dt;`}

{agent.id === 'competitive' && `-- Competitive Agent Queries
SELECT route_id, competitor_code, price_difference_pct,
       market_share_change, price_position
FROM competitive_pricing 
WHERE analysis_date >= CURRENT_DATE - INTERVAL '14 days'
AND route_id = ANY($1)
ORDER BY analysis_date DESC;

SELECT route_id, competitor_code, 
       AVG(price_difference_pct) as avg_price_diff,
       COUNT(*) as monitoring_days
FROM competitive_pricing 
WHERE analysis_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY route_id, competitor_code;`}

{agent.id === 'network' && `-- Network Agent Queries  
SELECT route_id, capacity_utilization, profitability_score,
       expansion_potential, optimization_opportunities
FROM network_analysis 
WHERE analysis_date >= CURRENT_DATE - INTERVAL '14 days'
AND route_id = ANY($1)
ORDER BY analysis_date DESC;

SELECT route_id, total_capacity, utilized_capacity,
       frequency_per_week, demand_forecast
FROM capacity_utilization 
WHERE analysis_date >= CURRENT_DATE - INTERVAL '7 days'
AND route_id = ANY($1);`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    console.log('[ActionAgents] Rendering loading state...');
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-600 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400 mx-auto"></div>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading Action Agents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('[ActionAgents] Rendering error state:', error);
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Error Loading Action Agents</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={loadAgentData}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const currentAgent = actionAgentDefinitions[activeAgentTab];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Telos Action Agent Management</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Enterprise-grade AI agent control panel for EasyJet revenue optimization
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">System Active</span>
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
                <Select value={activeAgentTab} onValueChange={setActiveAgentTab}>
                  <SelectTrigger className="w-full sm:w-[350px] lg:w-[400px] h-12 sm:h-14 text-base sm:text-lg border-3 border-blue-400 dark:border-blue-500 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow" id="agent-select">
                  <SelectValue placeholder="Choose an Action Agent">
                    {activeAgentTab && actionAgentDefinitions[activeAgentTab] && (
                      <div className="flex items-center space-x-2">
                        <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        <span className="font-medium text-sm sm:text-base">{actionAgentDefinitions[activeAgentTab].name}</span>
                        <StatusBadge status={actionAgentDefinitions[activeAgentTab].status} />
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full sm:w-[350px] lg:w-[400px]">
                  {Object.values(actionAgentDefinitions).map((agent) => (
                    <SelectItem key={agent.id} value={agent.id} className="text-sm sm:text-base py-3 sm:py-4 hover:bg-blue-50 dark:hover:bg-blue-900">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-3">
                          <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                          <div>
                            <div className="font-medium text-sm sm:text-base">{agent.name}</div>
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{agent.description.substring(0, 60)}...</div>
                          </div>
                        </div>
                        <StatusBadge status={agent.status} />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>
              {activeAgentTab && actionAgentDefinitions[activeAgentTab] && (
                <div className="text-left lg:text-right">
                  <div className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">Current Status</div>
                  <StatusBadge status={actionAgentDefinitions[activeAgentTab].status} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Agent Display */}
      {currentAgent && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">{currentAgent.className}</h3>
            <p className="text-blue-800 dark:text-blue-200 text-sm">{currentAgent.description}</p>
          </div>
          
          <AgentSubTabs agent={currentAgent} />
        </div>
      )}
    </div>
  );
}