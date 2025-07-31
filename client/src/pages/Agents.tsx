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
      <div className="space-y-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">AI Agents</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Manage and monitor your intelligent revenue management agents</p>
        </div>
        
        {/* Agent Overview Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {agents.map((agent: Agent) => {
            const Icon = getAgentIcon(agent.id);
            const iconColor = getAgentColor(agent.id);
            
            return (
              <Card key={agent.id} className="bg-slate-900/90 border-slate-700 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-500/50 transition-all duration-300 h-full backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-white flex items-center">
                      <Icon className={`mr-3 w-5 h-5 ${iconColor}`} />
                      {agent.name}
                    </CardTitle>
                    <Badge className={getStatusColor(agent.status)}>
                      {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {/* Accuracy Display */}
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <span className="text-slate-400 text-sm font-medium block mb-3">Accuracy</span>
                    <div className="flex items-center space-x-4">
                      <Progress 
                        value={parseFloat(agent.accuracy)} 
                        className="flex-1 h-3"
                      />
                      <span className="text-white font-bold text-2xl">{agent.accuracy}%</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/30 rounded-lg p-4 text-center">
                      <span className="text-slate-400 text-xs uppercase tracking-wide block mb-1">Total Analyses</span>
                      <p className="text-white font-bold text-xl">{agent.totalAnalyses}</p>
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-4 text-center">
                      <span className="text-slate-400 text-xs uppercase tracking-wide block mb-1">Success Rate</span>
                      <p className="text-white font-bold text-xl">
                        {agent.totalAnalyses > 0 
                          ? Math.round((agent.successfulPredictions / agent.totalAnalyses) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Last Active */}
                  <div className="text-center">
                    <span className="text-slate-400 text-sm">Last Active: </span>
                    <span className="text-white font-medium">{formatLastActive(agent.lastActive)}</span>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => runAgentMutation.mutate(agent.id)}
                      disabled={runAgentMutation.isPending || agent.status === 'maintenance'}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Run Agent
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedAgent(agent.id)}
                      className="bg-slate-800 hover:bg-slate-700 border-slate-600 text-white"
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
        <Tabs value={selectedAgent} onValueChange={setSelectedAgent} className="space-y-10">
          <div className="flex justify-center">
            <TabsList className="bg-slate-900/80 border border-slate-700 p-2 rounded-xl backdrop-blur-sm">
              <TabsTrigger 
                value="competitive" 
                className="data-[state=active]:bg-orange-600 data-[state=active]:text-white px-8 py-3 text-sm font-medium rounded-lg transition-all"
              >
                Competitive Intelligence
              </TabsTrigger>
              <TabsTrigger 
                value="performance" 
                className="data-[state=active]:bg-orange-600 data-[state=active]:text-white px-8 py-3 text-sm font-medium rounded-lg transition-all"
              >
                Performance Attribution
              </TabsTrigger>
              <TabsTrigger 
                value="network" 
                className="data-[state=active]:bg-orange-600 data-[state=active]:text-white px-8 py-3 text-sm font-medium rounded-lg transition-all"
              >
                Network Analysis
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="competitive" className="space-y-8 mt-10">
            <Card className="bg-slate-900/80 border-slate-700 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-white flex items-center justify-center">
                  <AlertTriangle className="text-red-500 mr-4 w-8 h-8" />
                  Competitive Intelligence Agent
                </CardTitle>
                <p className="text-slate-300 text-center text-lg leading-relaxed max-w-3xl mx-auto mt-4">
                  Monitors competitor pricing changes and market dynamics across key European routes.
                  Tracks Ryanair, Wizz Air, and Vueling pricing strategies in real-time.
                </p>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-8 border border-slate-700/50">
                    <h4 className="font-bold text-white mb-6 text-lg flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                      Key Capabilities
                    </h4>
                    <ul className="text-slate-300 space-y-3">
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        Real-time competitor price monitoring
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        Revenue impact assessment
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        Pattern recognition for unusual behavior
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        Response scenario modeling
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-8 border border-slate-700/50">
                    <h4 className="font-bold text-white mb-6 text-lg flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Configuration
                    </h4>
                    <div className="text-slate-300 space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                        <span>Price change threshold</span>
                        <span className="font-semibold text-white">10%</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                        <span>Impact threshold</span>
                        <span className="font-semibold text-white">£5,000</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                        <span>Monitoring frequency</span>
                        <span className="font-semibold text-white">15 minutes</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span>Competitors tracked</span>
                        <span className="font-semibold text-white">3 airlines</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-8 mt-10">
            <Card className="bg-slate-900/80 border-slate-700 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-white flex items-center justify-center">
                  <BarChart3 className="text-blue-500 mr-4 w-8 h-8" />
                  Performance Attribution Agent
                </CardTitle>
                <p className="text-slate-300 text-center text-lg leading-relaxed max-w-3xl mx-auto mt-4">
                  Analyzes route performance variances and identifies root causes for deviations
                  from forecasts. Provides detailed attribution analysis for revenue optimization.
                </p>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-8 border border-slate-700/50">
                    <h4 className="font-bold text-white mb-6 text-lg flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                      Key Capabilities
                    </h4>
                    <ul className="text-slate-300 space-y-3">
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        Performance variance detection
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        Root cause attribution
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        Booking curve analysis
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        Forecast accuracy assessment
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-8 border border-slate-700/50">
                    <h4 className="font-bold text-white mb-6 text-lg flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Configuration
                    </h4>
                    <div className="text-slate-300 space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                        <span>Variance threshold</span>
                        <span className="font-semibold text-white">5%</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                        <span>Alert threshold</span>
                        <span className="font-semibold text-white">£20,000</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                        <span>Analysis frequency</span>
                        <span className="font-semibold text-white">Hourly</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span>Forecast accuracy</span>
                        <span className="font-semibold text-white">85%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-8 mt-10">
            <Card className="bg-slate-900/80 border-slate-700 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-white flex items-center justify-center">
                  <TrendingUp className="text-green-500 mr-4 w-8 h-8" />
                  Network Analysis Agent
                </CardTitle>
                <p className="text-slate-300 text-center text-lg leading-relaxed max-w-3xl mx-auto mt-4">
                  Provides network-wide optimization insights and identifies capacity reallocation
                  opportunities. Analyzes cross-route performance and strategic positioning.
                </p>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-8 border border-slate-700/50">
                    <h4 className="font-bold text-white mb-6 text-lg flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                      Key Capabilities
                    </h4>
                    <ul className="text-slate-300 space-y-3">
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        Network optimization analysis
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        Capacity reallocation recommendations
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        Cross-route performance comparison
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        Strategic positioning insights
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-8 border border-slate-700/50">
                    <h4 className="font-bold text-white mb-6 text-lg flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Configuration
                    </h4>
                    <div className="text-slate-300 space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                        <span>Optimization period</span>
                        <span className="font-semibold text-white">30 days</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                        <span>Capacity threshold</span>
                        <span className="font-semibold text-white">80%</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                        <span>Yield threshold</span>
                        <span className="font-semibold text-white">15%</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span>Analysis frequency</span>
                        <span className="font-semibold text-white">Daily</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Feedback Section */}
        <Card className="bg-slate-900/80 border-slate-700 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-white">Agent Learning System</CardTitle>
              <Button
                onClick={() => setShowFeedback(!showFeedback)}
                variant="outline"
                className="bg-orange-600/10 hover:bg-orange-600/20 border-orange-500/50 text-orange-400 hover:text-orange-300 px-6 py-2"
              >
                {showFeedback ? 'Hide' : 'Show'} Feedback Panel
              </Button>
            </div>
          </CardHeader>
          {showFeedback && (
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-xl p-8 border border-slate-700/50">
                  <h4 className="font-bold text-white mb-6 text-lg flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                    Provide Feedback
                  </h4>
                  <FeedbackSystem
                    alertId="sample-alert-id"
                    agentId={selectedAgent}
                    onSubmitted={() => setShowFeedback(false)}
                  />
                </div>
                <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-xl p-8 border border-slate-700/50">
                  <h4 className="font-bold text-white mb-6 text-lg flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Learning Progress
                  </h4>
                  <div className="space-y-6">
                    {agents.map((agent: Agent) => (
                      <div key={agent.id} className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-white font-bold capitalize text-lg">{agent.id}</span>
                          <Badge variant="outline" className="border-slate-600 text-slate-300 bg-slate-800/50">
                            {agent.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mb-3">
                          <Progress value={parseFloat(agent.accuracy)} className="flex-1 h-3" />
                          <span className="text-white font-bold text-xl">{agent.accuracy}%</span>
                        </div>
                        <p className="text-slate-400 text-sm">
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
