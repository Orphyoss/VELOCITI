import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Clock, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, 
  Zap, BarChart3, Globe, Calendar, ArrowRight, RefreshCw, MessageSquare, 
  Download, Share2, Sunrise, X, Brain, Sparkles 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppShell from '@/components/layout/AppShell';
import { useVelocitiStore } from '@/stores/useVelocitiStore';

interface MorningBriefingData {
  date: string;
  generatedAt: string;
  analyst: {
    name: string;
    role: string;
    focus: string;
  };
  executiveSummary: {
    status: 'CRITICAL' | 'ATTENTION_REQUIRED' | 'NORMAL' | 'OPTIMAL';
    aiGeneratedSummary: string;
    keyInsights: string[];
    confidence: number;
  };
  priorityActions: Array<{
    id: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    title: string;
    aiAnalysis: string;
    recommendation: string;
    estimatedImpact: string;
    timeframe: string;
    confidence: number;
    dataSource: string;
  }>;
  marketIntelligence: {
    aiGeneratedInsight: string;
    competitiveThreats: Array<{
      competitor: string;
      threat: string;
      severity: string;
      recommendation: string;
    }>;
    opportunities: Array<{
      area: string;
      description: string;
      potential: string;
    }>;
  };
  performanceMetrics: {
    networkYield: number;
    loadFactor: number;
    revenueImpact: number;
    alertsProcessed: number;
    systemHealth: string;
    aiAccuracy: number;
  };
}

export default function MorningBriefing() {
  const { setCurrentModule } = useVelocitiStore();
  const [selectedAction, setSelectedAction] = useState<any>(null);

  useEffect(() => {
    setCurrentModule('dashboard');
  }, [setCurrentModule]);

  // Fetch AI-generated briefing data
  const { data: briefingData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/morning-briefing/ai-generated'],
    queryFn: async (): Promise<MorningBriefingData> => {
      const response = await fetch('/api/morning-briefing/ai-generated');
      if (!response.ok) {
        throw new Error(`Failed to generate AI briefing: ${response.statusText}`);
      }
      return response.json();
    },
    refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes
    retry: 3,
    staleTime: 10 * 60 * 1000, // Consider data stale after 10 minutes
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'CRITICAL': return 'bg-red-900 text-red-200 border-red-700';
      case 'ATTENTION_REQUIRED': return 'bg-orange-900 text-orange-200 border-orange-700';
      case 'NORMAL': return 'bg-blue-900 text-blue-200 border-blue-700';
      case 'OPTIMAL': return 'bg-green-900 text-green-200 border-green-700';
      default: return 'bg-gray-700 text-gray-200 border-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'CRITICAL': return 'bg-red-900 text-red-200';
      case 'HIGH': return 'bg-orange-900 text-orange-200';
      case 'MEDIUM': return 'bg-yellow-900 text-yellow-200';
      case 'LOW': return 'bg-gray-700 text-gray-200';
      default: return 'bg-gray-700 text-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'CRITICAL': return <AlertTriangle className="w-4 h-4" />;
      case 'HIGH': return <TrendingUp className="w-4 h-4" />;
      case 'MEDIUM': return <Target className="w-4 h-4" />;
      case 'LOW': return <CheckCircle className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (error) {
    return (
      <AppShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-dark-50">AI Briefing Generation Failed</h2>
            <p className="text-dark-400 mb-4">Unable to generate intelligent briefing. Please try again.</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate Briefing
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-aviation-500 mr-3" />
              <Sparkles className="w-6 h-6 animate-pulse text-yellow-400" />
            </div>
            <h2 className="text-xl font-semibold text-dark-50">AI Generating Your Briefing</h2>
            <p className="text-dark-400">Analyzing real-time data and generating intelligent insights...</p>
            <div className="mt-4 text-sm text-dark-500">
              Processing competitive intelligence, performance metrics, and market conditions
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!briefingData) {
    return (
      <AppShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-dark-50">No Briefing Available</h2>
            <p className="text-dark-400">AI briefing data is not available at this time.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-dark-900 border border-dark-800 rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center">
                <Brain className="w-8 h-8 text-aviation-500 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-dark-50">AI Morning Briefing</h1>
                  <p className="text-sm text-dark-400">Intelligent Revenue Management Analysis</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-dark-400">Generated at</p>
                <p className="font-medium text-dark-100">{briefingData.generatedAt}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <Card className="bg-dark-900 border-dark-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Sparkles className="w-5 h-5 text-yellow-400 mr-2" />
                AI Executive Summary
              </CardTitle>
              <Badge className={getStatusColor(briefingData.executiveSummary.status)}>
                {briefingData.executiveSummary.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
                <div className="prose prose-invert max-w-none">
                  <p className="text-dark-100 leading-relaxed whitespace-pre-wrap">
                    {briefingData.executiveSummary.aiGeneratedSummary}
                  </p>
                </div>
              </div>
              
              {briefingData.executiveSummary.keyInsights.length > 0 && (
                <div>
                  <h4 className="font-medium text-dark-100 mb-2">Key AI Insights</h4>
                  <ul className="space-y-2">
                    {briefingData.executiveSummary.keyInsights.map((insight, index) => (
                      <li key={index} className="flex items-start">
                        <ArrowRight className="w-4 h-4 text-aviation-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-dark-200 text-sm">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm text-dark-400">
                <span>AI Confidence: {Math.round(briefingData.executiveSummary.confidence * 100)}%</span>
                <span>Analyst: {briefingData.analyst.name}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Actions */}
        <Card className="bg-dark-900 border-dark-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 text-red-400 mr-2" />
              Priority Actions ({briefingData.priorityActions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {briefingData.priorityActions.map((action) => (
                <div
                  key={action.id}
                  className="bg-dark-800 border border-dark-700 rounded-lg p-4 cursor-pointer hover:bg-dark-750 transition-colors"
                  onClick={() => setSelectedAction(action)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        {getPriorityIcon(action.priority)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-dark-100">{action.title}</h4>
                          <Badge className={getPriorityColor(action.priority)}>
                            {action.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {action.category}
                          </Badge>
                        </div>
                        <p className="text-dark-300 text-sm mb-3">{action.recommendation}</p>
                        <div className="flex items-center space-x-4 text-xs text-dark-400">
                          <span>Impact: {action.estimatedImpact}</span>
                          <span>Timeframe: {action.timeframe}</span>
                          <span>Confidence: {Math.round(action.confidence * 100)}%</span>
                          <span>Source: {action.dataSource}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-dark-500 ml-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-dark-900 border-dark-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 text-blue-400 mr-2" />
                AI Market Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
                  <p className="text-dark-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {briefingData.marketIntelligence.aiGeneratedInsight}
                  </p>
                </div>
                
                {briefingData.marketIntelligence.competitiveThreats.length > 0 && (
                  <div>
                    <h4 className="font-medium text-dark-100 mb-2">Competitive Threats</h4>
                    <div className="space-y-2">
                      {briefingData.marketIntelligence.competitiveThreats.map((threat, index) => (
                        <div key={index} className="bg-red-900/20 border border-red-800 rounded p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-red-200">{threat.competitor}</span>
                            <Badge className="bg-red-900 text-red-200">{threat.severity}</Badge>
                          </div>
                          <p className="text-dark-300 text-xs mb-2">{threat.threat}</p>
                          <p className="text-dark-400 text-xs">{threat.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-900 border-dark-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 text-green-400 mr-2" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-800 rounded-lg p-3">
                  <div className="text-2xl font-bold text-aviation-400">
                    £{(parseFloat(briefingData.performanceMetrics.networkYield) || 0).toFixed(0)}
                  </div>
                  <div className="text-xs text-dark-400">Network Yield</div>
                </div>
                <div className="bg-dark-800 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-400">
                    {(parseFloat(briefingData.performanceMetrics.loadFactor) || 0).toFixed(1)}%
                  </div>
                  <div className="text-xs text-dark-400">Load Factor</div>
                </div>
                <div className="bg-dark-800 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-400">
                    £{((parseFloat(briefingData.performanceMetrics.revenueImpact) || 0) / 1000).toFixed(0)}K
                  </div>
                  <div className="text-xs text-dark-400">Revenue Impact</div>
                </div>
                <div className="bg-dark-800 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-400">
                    {(parseFloat(briefingData.performanceMetrics.aiAccuracy) || 0).toFixed(1)}%
                  </div>
                  <div className="text-xs text-dark-400">AI Accuracy</div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-dark-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dark-400">System Health</span>
                  <Badge className={
                    briefingData.performanceMetrics.systemHealth === 'OPTIMAL' ? 'bg-green-900 text-green-200' :
                    briefingData.performanceMetrics.systemHealth === 'GOOD' ? 'bg-blue-900 text-blue-200' :
                    'bg-yellow-900 text-yellow-200'
                  }>
                    {briefingData.performanceMetrics.systemHealth}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-dark-400">Alerts Processed</span>
                  <span className="text-dark-200">{briefingData.performanceMetrics.alertsProcessed}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Detail Modal */}
        {selectedAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-900 border border-dark-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getPriorityIcon(selectedAction.priority)}
                    <h2 className="text-xl font-bold text-dark-50">{selectedAction.title}</h2>
                    <Badge className={getPriorityColor(selectedAction.priority)}>
                      {selectedAction.priority}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAction(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-dark-100 mb-2">AI Analysis</h3>
                    <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
                      <p className="text-dark-200 leading-relaxed whitespace-pre-wrap">
                        {selectedAction.aiAnalysis}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-dark-100 mb-2">Recommendation</h3>
                    <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
                      <p className="text-dark-200">{selectedAction.recommendation}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-dark-100 mb-1">Estimated Impact</h4>
                      <p className="text-aviation-400 font-bold">{selectedAction.estimatedImpact}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-dark-100 mb-1">Timeframe</h4>
                      <p className="text-dark-200">{selectedAction.timeframe}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-dark-100 mb-1">Confidence</h4>
                      <p className="text-dark-200">{Math.round(selectedAction.confidence * 100)}%</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-dark-100 mb-1">Data Source</h4>
                      <p className="text-dark-200">{selectedAction.dataSource}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}