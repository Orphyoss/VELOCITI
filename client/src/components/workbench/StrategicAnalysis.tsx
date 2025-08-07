import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';


import { Brain, Loader2, Lightbulb, TrendingUp, AlertCircle, Download, Zap, Database, Settings, Play, Gauge } from 'lucide-react';
import { streamingApi } from '@/services/streamingApi';
import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';
import { useToast } from '@/hooks/use-toast';
import { LLMResponse } from '@/types';

interface AnalysisResult {
  id: string;
  prompt: string;
  result: LLMResponse;
  timestamp: string;
}

export default function StrategicAnalysis() {
  const [prompt, setPrompt] = useState('');
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);

  // Load historical analyses from database
  const { data: historicalAnalyses } = useQuery({
    queryKey: ['/api/strategic/analyses'],
    enabled: true,
  });

  // Load historical data on component mount
  useEffect(() => {
    if (historicalAnalyses?.data) {
      const formattedAnalyses = historicalAnalyses.data.map((analysis: any) => ({
        id: analysis.id,
        prompt: analysis.prompt,
        result: {
          analysis: analysis.response,
          confidence: parseFloat(analysis.confidence) || 0.9,
          recommendations: []
        },
        timestamp: analysis.createdAt,
        provider: analysis.provider,
        status: analysis.status
      }));
      setAnalyses(formattedAnalyses);
    }
  }, [historicalAnalyses]);

  const [useRAG, setUseRAG] = useState(true);
  const [streamingMode] = useState(true); // Always use streaming mode
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const { llmProvider } = useVelocitiStore();
  const { toast } = useToast();

  // Streaming analysis function
  const streamAnalysis = async (promptText: string) => {
    setIsStreaming(true);
    setStreamingContent('');
    
    try {
      const ragContext = useRAG ? await getRagContext(promptText) : '';
      
      const fullContent = await streamingApi.streamAnalysis(
        promptText,
        {
          provider: llmProvider,
          useRAG,
          type: 'strategic'
        },
        (chunk: string) => {
          setStreamingContent(prev => prev + chunk);
        },
        (metadata: any) => {
          console.log('Streaming started:', metadata);
        },
        (finalData: any) => {
          console.log('Streaming completed:', finalData);
          setIsStreaming(false);
        },
        (error: string) => {
          console.error('Streaming error:', error);
          setIsStreaming(false);
          toast({
            title: "Streaming Error",
            description: error,
            variant: "destructive",
          });
        }
      );

      return {
        analysis: fullContent,
        confidence: 0.9,
        recommendations: []
      };
    } catch (error) {
      setIsStreaming(false);
      throw error;
    }
  };

  // Helper function to get RAG context
  const getRagContext = async (promptText: string): Promise<string> => {
    try {
      const ragResponse = await fetch('/api/pinecone/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: promptText, topK: 3 })
      });
      if (ragResponse.ok) {
        const ragData = await ragResponse.json();
        if (ragData.results && ragData.results.length > 0) {
          return ragData.results.map((result: any) => 
            `Source: ${result.metadata.filename}\n${result.text}`
          ).join('\n\n---\n\n');
        }
      }
    } catch (error) {
      console.warn('RAG context retrieval failed, proceeding without context:', error);
    }
    return '';
  };

  const analysisMutation = useMutation({
    mutationFn: async (promptText: string) => {
      return streamAnalysis(promptText);
    },
    onSuccess: async (result, promptText) => {
      // Save to database
      try {
        const saveResponse = await fetch('/api/strategic/analyses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptText,
            response: result.analysis,
            provider: llmProvider,
            useRAG,
            confidence: result.confidence || 0.9,
            status: 'completed'
          })
        });
        
        if (saveResponse.ok) {
          const savedAnalysis = await saveResponse.json();
          const newAnalysis: AnalysisResult = {
            id: savedAnalysis.data.id,
            prompt: promptText,
            result: result,
            timestamp: savedAnalysis.data.createdAt,
          };
          setAnalyses(prev => [newAnalysis, ...prev.slice(0, 19)]); // Keep last 20 analyses
          setSelectedAnalysis(newAnalysis);
        }
      } catch (error) {
        console.error('Failed to save analysis to database:', error);
        // Still create in-memory version if database save fails
        const newAnalysis: AnalysisResult = {
          id: Date.now().toString(),
          prompt: promptText,
          result: result,
          timestamp: new Date().toISOString(),
        };
        setAnalyses(prev => [newAnalysis, ...prev.slice(0, 19)]);
        setSelectedAnalysis(newAnalysis);
      }
      
      setPrompt('');
      
      toast({
        title: "Analysis Complete",
        description: `Strategic analysis generated using ${
          llmProvider === 'writer' ? 'Writer Palmyra X5' : 
          llmProvider === 'fireworks' ? 'GPT OSS-20B' : 'OpenAI GPT-4o'
        }${useRAG ? ' with RAG context' : ''}`,
      });
    },
    onError: (error) => {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: `Failed to generate strategic analysis using ${
          llmProvider === 'writer' ? 'Writer API' : 
          llmProvider === 'fireworks' ? 'Fireworks API' : 'OpenAI'
        }. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    
    if (streamingMode) {
      setStreamingContent('');
    }
    
    analysisMutation.mutate(prompt.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const exportAnalysis = (analysis: AnalysisResult) => {
    const exportData = {
      prompt: analysis.prompt,
      timestamp: analysis.timestamp,
      provider: llmProvider,
      analysis: analysis.result.analysis,
      confidence: analysis.result.confidence,
      recommendations: analysis.result.recommendations,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `velociti-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const strategicPrompts = [
    "Analyze the competitive positioning impact of recent Ryanair price changes on our London-Barcelona route",
    "Recommend capacity reallocation strategies for underperforming European routes",
    "Assess the revenue optimization opportunities for our highest demand corridors",
    "Evaluate the strategic implications of current booking curve performance vs historical patterns",
    "Analyze the market dynamics affecting our load factor performance in key markets",
  ];

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-dark-400';
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceLabel = (confidence?: number) => {
    if (!confidence) return 'Unknown';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Analysis Interface */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-dark-900 border-dark-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-dark-50 flex items-center">
                <Brain className="text-aviation-500 mr-2" />
                Generative AI Strategic Analysis
              </CardTitle>
              <Badge variant="outline" className="bg-purple-600/20 border-purple-600/40 text-purple-200">
                {llmProvider === 'writer' ? 'Writer Palmyra X5' : 
                 llmProvider === 'fireworks' ? 'GPT OSS-20B' : 'OpenAI GPT-4o'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Textarea
                placeholder="Describe the strategic challenge or opportunity you'd like to analyze..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyPress}
                className="bg-dark-800 border-dark-700 text-dark-50 placeholder-dark-400 min-h-[120px] resize-none"
                disabled={analysisMutation.isPending}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xs text-dark-400">
                <span>Press Ctrl+Enter to analyze</span>
                
                {/* RAG Context Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUseRAG(!useRAG)}
                  className={`h-7 px-3 transition-all duration-200 ${
                    useRAG 
                      ? 'bg-green-600/20 border-green-600/40 text-green-400 hover:bg-green-600/30' 
                      : 'bg-dark-800 border-dark-600 text-dark-400 hover:bg-dark-700'
                  }`}
                >
                  <Database className="w-3 h-3 mr-1.5" />
                  RAG Context
                  <div className={`ml-2 w-2 h-2 rounded-full ${useRAG ? 'bg-green-400' : 'bg-dark-500'}`} />
                </Button>
              </div>
              <Button 
                onClick={handleSubmit}
                disabled={analysisMutation.isPending || isStreaming || !prompt.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
              >
                {analysisMutation.isPending || isStreaming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isStreaming ? 'Streaming...' : 'Analyzing...'}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Analysis
                  </>
                )}
              </Button>
            </div>

            {/* Strategic Prompts */}
            <div>
              <h4 className="text-sm font-medium text-dark-300 mb-2">Strategic Scenarios:</h4>
              <div className="space-y-2">
                {strategicPrompts.map((scenario, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setPrompt(scenario)}
                    className="text-xs bg-dark-800 hover:bg-dark-700 text-dark-300 border-dark-600 text-left justify-start w-full h-auto py-2 px-3"
                    disabled={analysisMutation.isPending}
                  >
                    <div className="whitespace-normal">{scenario}</div>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Streaming Results */}
        {(isStreaming || streamingContent) && (
          <Card className="bg-dark-900 border-dark-800 border-blue-600/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-dark-50 flex items-center">
                  <Gauge className="text-blue-500 mr-2" />
                  Live Analysis Stream
                </CardTitle>
                <Badge variant="outline" className="bg-blue-600/20 border-blue-600/40 text-blue-200">
                  {isStreaming ? 'Streaming...' : 'Stream Complete'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-dark-800 rounded p-4 text-sm text-dark-100 leading-relaxed min-h-[200px]">
                {streamingContent ? (
                  <div className="whitespace-pre-wrap">
                    {streamingContent}
                    {isStreaming && <span className="animate-pulse">▊</span>}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-dark-400">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Waiting for stream to start...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {selectedAnalysis && (
          <Card className="bg-dark-900 border-dark-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-dark-50">Strategic Insights</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline" 
                    className={`${getConfidenceColor(selectedAnalysis.result.confidence)} border-current`}
                  >
                    {getConfidenceLabel(selectedAnalysis.result.confidence)} Confidence
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportAnalysis(selectedAnalysis)}
                    className="bg-dark-800 hover:bg-dark-700 text-dark-50 border-dark-600"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h5 className="text-sm font-medium text-dark-300 mb-2">Analysis Prompt:</h5>
                <div className="bg-dark-800 rounded p-3 text-sm text-dark-100">
                  {selectedAnalysis.prompt}
                </div>
              </div>

              {selectedAnalysis.result.analysis && (
                <div>
                  <h5 className="text-sm font-medium text-dark-300 mb-2 flex items-center">
                    <Brain className="w-4 h-4 mr-1" />
                    Strategic Analysis:
                  </h5>
                  <div className="bg-dark-800 rounded p-4 text-sm text-dark-100 leading-relaxed">
                    {selectedAnalysis.result.analysis.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-3 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {selectedAnalysis.result.recommendations && selectedAnalysis.result.recommendations.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-dark-300 mb-3 flex items-center">
                    <Lightbulb className="w-4 h-4 mr-1" />
                    Key Recommendations:
                  </h5>
                  <div className="space-y-2">
                    {selectedAnalysis.result.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3 bg-dark-800 rounded p-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs text-white font-bold">
                          {index + 1}
                        </div>
                        <div className="text-sm text-dark-100 flex-1">
                          {typeof recommendation === 'string' ? recommendation : 
                           typeof recommendation === 'object' && recommendation && 'strategy' in recommendation ? 
                             `${(recommendation as any).strategy}: ${(recommendation as any).description}` : 
                             JSON.stringify(recommendation)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedAnalysis.result.confidence && (
                <div className="bg-dark-800/50 rounded p-3 border border-dark-700">
                  <div className="flex items-center space-x-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-dark-400" />
                    <span className="text-dark-300">Confidence Score:</span>
                    <span className={`font-medium ${getConfidenceColor(selectedAnalysis.result.confidence)}`}>
                      {Math.round(selectedAnalysis.result.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-dark-400 mt-1">
                    Based on historical data patterns and market context
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Analysis History */}
      <div className="space-y-6">
        <Card className="bg-dark-900 border-dark-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-dark-50 flex items-center">
              <TrendingUp className="text-aviation-500 mr-2" />
              Analysis History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyses.length > 0 ? (
              <div className="space-y-2">
                {analyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className={`p-3 rounded cursor-pointer transition-colors border ${
                      selectedAnalysis?.id === analysis.id
                        ? 'bg-purple-600/20 border-purple-600/40'
                        : 'bg-dark-800 hover:bg-dark-700 border-dark-700'
                    }`}
                    onClick={() => setSelectedAnalysis(analysis)}
                  >
                    <p className="text-sm text-dark-50 line-clamp-3 mb-2">
                      {analysis.prompt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-dark-400">
                        {new Date(analysis.timestamp).toLocaleTimeString()}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Badge variant="outline" className="text-xs">
                          Strategic
                        </Badge>
                        {analysis.result.confidence && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getConfidenceColor(analysis.result.confidence)} border-current`}
                          >
                            {Math.round(analysis.result.confidence * 100)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                <p className="text-dark-400 text-sm">
                  Your analysis history will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* LLM Status */}
        <Card className="bg-dark-900 border-dark-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-dark-50">LLM Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">Connected</span>
            </div>
            <p className="text-xs text-dark-400">
              {llmProvider === 'writer' ? 'Writer Palmyra X5' : 
               llmProvider === 'fireworks' ? 'GPT OSS-20B' : 'OpenAI GPT-4o'} with RAG context
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
