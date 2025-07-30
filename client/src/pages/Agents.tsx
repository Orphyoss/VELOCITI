import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { api } from '@/services/api';
import AppShell from '@/components/layout/AppShell';
import FeedbackSystem from '@/components/agents/FeedbackSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Bot, Play, Pause, Settings, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Agent } from '@/types';

export default function Agents() {
  const { setCurrentModule, agents, setAgents } = useVelocitiStore();
  const [selectedAgent, setSelectedAgent] = useState<string>('competitive');
  const [showFeedback, setShowFeedback] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setCurrentModule('agents');
  }, [setCurrentModule]);

  const { data: agentsData, isLoading } = useQuery({
    queryKey: ['/api/agents'],
    queryFn: () => api.getAgents(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (agentsData) {
      setAgents(agentsData);
    }
  }, [agentsData, setAgents]);

  const runAgentMutation = useMutation({
    mutationFn: (agentId: string) => api.runAgent(agentId),
    onSuccess: (_, agentId) => {
      toast({
        title: "Agent Executed",
        description: `${agentId.charAt(0).toUpperCase() + agentId.slice(1)} agent has been executed successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
    onError: (error, agentId) => {
      toast({
        title: "Execution Failed",
        description: `Failed to execute ${agentId} agent. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'competitive': return AlertTriangle;
      case 'performance': return BarChart3;
      case 'network': return TrendingUp;
      default: return Bot;
    }
  };

  const getAgentColor = (agentId: string) => {
    switch (agentId) {
      case 'competitive': return 'text-red-500';
      case 'performance': return 'text-blue-500';
      case 'network': return 'text-green-500';
      default: return 'text-aviation-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600 text-white';
      case 'learning': return 'bg-yellow-600 text-white';
      case 'maintenance': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const formatLastActive = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-dark-800 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-dark-800 rounded"></div>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Agent Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {agents.map((agent: Agent) => {
            const Icon = getAgentIcon(agent.id);
            const iconColor = getAgentColor(agent.id);
            
            return (
              <Card key={agent.id} className="bg-dark-900 border-dark-800 hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-dark-50 flex items-center">
                      <Icon className={`mr-2 ${iconColor}`} />
                      {agent.name}
                    </CardTitle>
                    <Badge className={getStatusColor(agent.status)}>
                      {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-dark-400">Accuracy:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <Progress 
                          value={parseFloat(agent.accuracy)} 
                          className="flex-1"
                        />
                        <span className="text-dark-50 font-medium">{agent.accuracy}%</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-dark-400">Total Analyses:</span>
                      <p className="text-dark-50 font-medium">{agent.totalAnalyses}</p>
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="text-dark-400">Last Active:</span>
                    <p className="text-dark-50">{formatLastActive(agent.lastActive)}</p>
                  </div>

                  <div className="text-sm">
                    <span className="text-dark-400">Success Rate:</span>
                    <p className="text-dark-50">
                      {agent.totalAnalyses > 0 
                        ? Math.round((agent.successfulPredictions / agent.totalAnalyses) * 100)
                        : 0}% 
                      ({agent.successfulPredictions}/{agent.totalAnalyses})
                    </p>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => runAgentMutation.mutate(agent.id)}
                      disabled={runAgentMutation.isPending || agent.status === 'maintenance'}
                      className="flex-1 bg-aviation-600 hover:bg-aviation-700"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Run Agent
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedAgent(agent.id)}
                      className="bg-dark-800 hover:bg-dark-700 border-dark-600"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Agent Details Tabs */}
        <Tabs value={selectedAgent} onValueChange={setSelectedAgent} className="space-y-6">
          <TabsList className="bg-dark-900 border border-dark-800">
            <TabsTrigger value="competitive" className="data-[state=active]:bg-aviation-600">
              Competitive Intelligence
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-aviation-600">
              Performance Attribution
            </TabsTrigger>
            <TabsTrigger value="network" className="data-[state=active]:bg-aviation-600">
              Network Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="competitive" className="space-y-6">
            <Card className="bg-dark-900 border-dark-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-dark-50 flex items-center">
                  <AlertTriangle className="text-red-500 mr-2" />
                  Competitive Intelligence Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-dark-300">
                  Monitors competitor pricing changes and market dynamics across key European routes.
                  Tracks Ryanair, Wizz Air, and Vueling pricing strategies in real-time.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-dark-800 rounded p-4">
                    <h4 className="font-medium text-dark-50 mb-2">Key Capabilities</h4>
                    <ul className="text-sm text-dark-300 space-y-1">
                      <li>• Real-time competitor price monitoring</li>
                      <li>• Revenue impact assessment</li>
                      <li>• Pattern recognition for unusual behavior</li>
                      <li>• Response scenario modeling</li>
                    </ul>
                  </div>
                  
                  <div className="bg-dark-800 rounded p-4">
                    <h4 className="font-medium text-dark-50 mb-2">Configuration</h4>
                    <div className="text-sm text-dark-300 space-y-1">
                      <p>• Price change threshold: 10%</p>
                      <p>• Impact threshold: £5,000</p>
                      <p>• Monitoring frequency: 15 minutes</p>
                      <p>• Competitors: 3 airlines</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="bg-dark-900 border-dark-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-dark-50 flex items-center">
                  <BarChart3 className="text-blue-500 mr-2" />
                  Performance Attribution Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-dark-300">
                  Analyzes route performance variances and identifies root causes for deviations
                  from forecasts. Provides detailed attribution analysis for revenue optimization.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-dark-800 rounded p-4">
                    <h4 className="font-medium text-dark-50 mb-2">Key Capabilities</h4>
                    <ul className="text-sm text-dark-300 space-y-1">
                      <li>• Performance variance detection</li>
                      <li>• Root cause attribution</li>
                      <li>• Booking curve analysis</li>
                      <li>• Forecast accuracy assessment</li>
                    </ul>
                  </div>
                  
                  <div className="bg-dark-800 rounded p-4">
                    <h4 className="font-medium text-dark-50 mb-2">Configuration</h4>
                    <div className="text-sm text-dark-300 space-y-1">
                      <p>• Variance threshold: 5%</p>
                      <p>• Alert threshold: £20,000</p>
                      <p>• Analysis frequency: Hourly</p>
                      <p>• Forecast accuracy: 85%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <Card className="bg-dark-900 border-dark-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-dark-50 flex items-center">
                  <TrendingUp className="text-green-500 mr-2" />
                  Network Analysis Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-dark-300">
                  Provides network-wide optimization insights and identifies capacity reallocation
                  opportunities. Analyzes cross-route performance and strategic positioning.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-dark-800 rounded p-4">
                    <h4 className="font-medium text-dark-50 mb-2">Key Capabilities</h4>
                    <ul className="text-sm text-dark-300 space-y-1">
                      <li>• Network optimization analysis</li>
                      <li>• Capacity reallocation recommendations</li>
                      <li>• Cross-route performance comparison</li>
                      <li>• Strategic positioning insights</li>
                    </ul>
                  </div>
                  
                  <div className="bg-dark-800 rounded p-4">
                    <h4 className="font-medium text-dark-50 mb-2">Configuration</h4>
                    <div className="text-sm text-dark-300 space-y-1">
                      <p>• Optimization period: 30 days</p>
                      <p>• Capacity threshold: 80%</p>
                      <p>• Yield threshold: 15%</p>
                      <p>• Analysis frequency: Daily</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Feedback Section */}
        <Card className="bg-dark-900 border-dark-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-dark-50">Agent Learning System</CardTitle>
              <Button
                onClick={() => setShowFeedback(!showFeedback)}
                variant="outline"
                className="bg-dark-800 hover:bg-dark-700 border-dark-600"
              >
                {showFeedback ? 'Hide' : 'Show'} Feedback Panel
              </Button>
            </div>
          </CardHeader>
          {showFeedback && (
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-dark-50 mb-4">Provide Feedback</h4>
                  <FeedbackSystem
                    alertId="sample-alert-id"
                    agentId={selectedAgent}
                    onSubmitted={() => setShowFeedback(false)}
                  />
                </div>
                <div>
                  <h4 className="font-medium text-dark-50 mb-4">Learning Progress</h4>
                  <div className="space-y-4">
                    {agents.map((agent: Agent) => (
                      <div key={agent.id} className="bg-dark-800 rounded p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-dark-50 font-medium capitalize">{agent.id}</span>
                          <Badge variant="outline" className="text-xs">
                            {agent.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress value={parseFloat(agent.accuracy)} className="flex-1" />
                          <span className="text-sm text-dark-300">{agent.accuracy}%</span>
                        </div>
                        <p className="text-xs text-dark-400 mt-1">
                          {agent.successfulPredictions} successful predictions from {agent.totalAnalyses} analyses
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
