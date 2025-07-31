import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FeedbackSystem from '@/components/agents/FeedbackSystem';
import AlertCard from '@/components/alerts/AlertCard';
import { 
  MessageSquare, 
  Brain, 
  TrendingUp, 
  Users, 
  Star,
  Bot,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Target
} from 'lucide-react';
import { Alert, Agent } from '@/types';

interface AgentFeedbackTabProps {
  alerts: Alert[];
}

export default function AgentFeedbackTab({ alerts }: AgentFeedbackTabProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [feedbackFilter, setFeedbackFilter] = useState<string>('pending');

  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/agents'],
    queryFn: () => api.getAgents(),
    refetchInterval: 30000,
  });

  // Filter alerts for feedback
  const feedbackAlerts = alerts.filter((alert: Alert) => {
    if (selectedAgent !== 'all' && alert.agentId !== selectedAgent) return false;
    if (feedbackFilter === 'pending') {
      // Show alerts that don't have recent feedback
      return alert.status === 'active' || alert.status === 'dismissed';
    }
    return true;
  });

  // Get agent performance metrics
  const getAgentMetrics = (agentId: string) => {
    const agent = agents?.find((a: Agent) => a.id === agentId);
    return agent || {
      id: agentId,
      name: agentId.charAt(0).toUpperCase() + agentId.slice(1),
      accuracy: '0.00',
      totalAnalyses: 0,
      successfulPredictions: 0
    };
  };

  const handleFeedbackSubmitted = (alertId: string) => {
    if (selectedAlert === alertId) {
      setSelectedAlert(null);
    }
  };

  if (agentsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-dark-800 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-dark-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-dark-50 mb-2 flex items-center">
          <MessageSquare className="text-aviation-500 mr-3" />
          Agent Learning & Feedback System
        </h3>
        <p className="text-dark-400">
          Help improve our AI agents by providing feedback on their alerts and recommendations
        </p>
      </div>

      {/* Agent Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {agents?.map((agent: Agent) => (
          <Card key={agent.id} className="bg-dark-900 border-dark-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-aviation-500" />
                  <h4 className="font-semibold text-dark-50">{agent.name}</h4>
                </div>
                <Badge 
                  variant={agent.status === 'active' ? 'default' : 'secondary'}
                  className={agent.status === 'active' ? 'bg-green-600/20 text-green-400' : ''}
                >
                  {agent.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dark-400">Accuracy</span>
                  <span className="text-dark-200 font-medium">{agent.accuracy}%</span>
                </div>
                <Progress value={parseFloat(agent.accuracy)} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-center p-2 bg-dark-800 rounded">
                  <div className="text-lg font-bold text-dark-50">{agent.totalAnalyses}</div>
                  <div className="text-dark-400">Total</div>
                </div>
                <div className="text-center p-2 bg-dark-800 rounded">
                  <div className="text-lg font-bold text-green-400">{agent.successfulPredictions}</div>
                  <div className="text-dark-400">Successful</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-dark-900 border-dark-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-dark-50">Feedback Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-dark-300 mb-2 block">Agent</label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="bg-dark-800 border-dark-700 text-dark-50">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {agents?.map((agent: Agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm text-dark-300 mb-2 block">Feedback Status</label>
              <Select value={feedbackFilter} onValueChange={setFeedbackFilter}>
                <SelectTrigger className="bg-dark-800 border-dark-700 text-dark-50">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending Feedback</SelectItem>
                  <SelectItem value="all">All Alerts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedAgent('all');
                  setFeedbackFilter('pending');
                  setSelectedAlert(null);
                }}
                className="bg-dark-800 hover:bg-dark-700 text-dark-50 border-dark-600"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Interface */}
      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList className="bg-dark-900 border border-dark-800">
          <TabsTrigger value="alerts" className="data-[state=active]:bg-aviation-600">
            Alert Feedback ({feedbackAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="quick" className="data-[state=active]:bg-aviation-600">
            Quick Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-dark-50 mb-2">Provide Detailed Feedback</h4>
            <p className="text-dark-400">
              Select alerts below to provide detailed feedback that helps our agents improve
            </p>
          </div>
          
          {feedbackAlerts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {feedbackAlerts.map((alert: Alert) => (
                <div key={alert.id} className="relative">
                  <AlertCard alert={alert} showDetails={false} />
                  
                  {/* Feedback Button */}
                  <div className="absolute top-2 right-2">
                    <Button
                      size="sm"
                      variant={selectedAlert === alert.id ? "default" : "outline"}
                      onClick={() => setSelectedAlert(selectedAlert === alert.id ? null : alert.id)}
                      className={selectedAlert === alert.id 
                        ? "bg-aviation-600 hover:bg-aviation-700 text-white" 
                        : "bg-dark-800 hover:bg-dark-700 text-dark-50 border-dark-600"
                      }
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      {selectedAlert === alert.id ? 'Hide' : 'Feedback'}
                    </Button>
                  </div>
                  
                  {/* Feedback Form */}
                  {selectedAlert === alert.id && (
                    <div className="mt-4 p-4 bg-dark-800/50 rounded-lg border border-dark-700">
                      <FeedbackSystem
                        alertId={alert.id}
                        agentId={alert.agentId}
                        onSubmitted={() => handleFeedbackSubmitted(alert.id)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Card className="bg-dark-900 border-dark-800">
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-dark-300 mb-2">
                  No Alerts Available for Feedback
                </h4>
                <p className="text-dark-400">
                  {selectedAgent !== 'all' 
                    ? `No alerts from ${getAgentMetrics(selectedAgent).name} agent need feedback.`
                    : 'All current alerts have been reviewed or no new alerts are available.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quick" className="space-y-4">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-dark-50 mb-2">Quick Agent Evaluation</h4>
            <p className="text-dark-400">
              Provide quick feedback on overall agent performance to help with continuous learning
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agents?.map((agent: Agent) => (
              <Card key={agent.id} className="bg-dark-900 border-dark-800">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-dark-50 flex items-center">
                    <Bot className="text-aviation-500 mr-2" />
                    {agent.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-dark-50 mb-1">{agent.accuracy}%</div>
                    <div className="text-sm text-dark-400">Current Accuracy</div>
                  </div>
                  
                  <div className="flex justify-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center space-x-1 bg-green-600/20 border-green-600/40 hover:bg-green-600/30"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Good</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center space-x-1 bg-red-600/20 border-red-600/40 hover:bg-red-600/30"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>Needs Work</span>
                    </Button>
                  </div>
                  
                  <div className="text-xs text-dark-400 text-center">
                    Last active: {new Date(agent.lastActive).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}