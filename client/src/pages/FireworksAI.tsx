import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Cpu, CheckCircle, AlertCircle, Brain, Zap, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';

interface FireworksModel {
  id: string;
  name: string;
  description: string;
}

interface FireworksResponse {
  success: boolean;
  analysis?: string;
  summary?: string;
  optimization?: string;
  completion?: string;
  model?: string;
  timestamp?: string;
  provider?: string;
  error?: string;
}

export default function FireworksAI() {
  const [selectedModel, setSelectedModel] = useState('accounts/fireworks/models/llama-v3p1-70b-instruct');
  const [inputText, setInputText] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const queryClient = useQueryClient();

  // Test Fireworks connection
  const { data: connectionTest, isLoading: testLoading } = useQuery({
    queryKey: ['/api/fireworks/test'],
    refetchInterval: 5 * 60 * 1000, // Test every 5 minutes
  });

  // Get available models
  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ['/api/fireworks/models'],
    refetchOnWindowFocus: false,
  });

  // Get current alerts for analysis
  const { data: alertsData } = useQuery({
    queryKey: ['/api/metrics/alerts'],
  });

  // Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async (data: { data: any; analysisType: string }) => {
      const response = await fetch('/api/fireworks/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fireworks'] });
    },
  });

  // Alert summary mutation
  const summaryMutation = useMutation({
    mutationFn: async (alerts: any[]) => {
      const response = await fetch('/api/fireworks/alert-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alerts }),
      });
      return response.json();
    },
  });

  // Custom completion mutation
  const completionMutation = useMutation({
    mutationFn: async (data: { messages: any[]; model?: string; temperature?: number; maxTokens?: number }) => {
      const response = await fetch('/api/fireworks/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });

  const handleAnalyzeAlerts = () => {
    if (alertsData?.data?.activeAlerts) {
      analysisMutation.mutate({
        data: alertsData.data.activeAlerts.slice(0, 10),
        analysisType: 'competitive_alerts'
      });
    }
  };

  const handleSummarizeAlerts = () => {
    if (alertsData?.data?.activeAlerts) {
      summaryMutation.mutate(alertsData.data.activeAlerts.slice(0, 15));
    }
  };

  const handleCustomCompletion = () => {
    if (!customPrompt.trim()) return;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert airline revenue management and competitive intelligence analyst. Provide actionable insights based on the user query.'
      },
      {
        role: 'user',
        content: customPrompt
      }
    ];

    completionMutation.mutate({
      messages,
      model: selectedModel,
      temperature: 0.7,
      maxTokens: 2000
    });
  };

  const models = modelsData?.models || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fireworks AI Integration</h1>
          <p className="text-muted-foreground mt-2">
            Access open source models like Llama, Mixtral, and Yi Large for competitive intelligence analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          {testLoading ? (
            <Badge variant="outline">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Testing...
            </Badge>
          ) : connectionTest?.success ? (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              Disconnected
            </Badge>
          )}
        </div>
      </div>

      {/* Connection Status */}
      {!testLoading && !connectionTest?.success && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Failed</AlertTitle>
          <AlertDescription>
            Unable to connect to Fireworks AI. Please check your API key configuration.
          </AlertDescription>
        </Alert>
      )}

      {/* Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            Model Selection
          </CardTitle>
          <CardDescription>
            Choose from high-performance open source models optimized for different tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Available Models</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model: FireworksModel) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Model Details</label>
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                {models.find((m: FireworksModel) => m.id === selectedModel)?.description || 
                 'Select a model to see details'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Tabs */}
      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Alert Analysis
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Executive Summary
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Custom Query
          </TabsTrigger>
        </TabsList>

        {/* Alert Analysis Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Intelligence Analysis</CardTitle>
              <CardDescription>
                Use Fireworks AI to analyze current alerts and identify patterns, threats, and opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {alertsData?.data?.activeAlerts?.length || 0} alerts available
                </Badge>
                <Button 
                  onClick={handleAnalyzeAlerts}
                  disabled={analysisMutation.isPending || !alertsData?.data?.activeAlerts?.length}
                  size="sm"
                >
                  {analysisMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Analyze Alerts
                </Button>
              </div>

              {analysisMutation.data && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">AI Analysis Results:</h4>
                  <pre className="whitespace-pre-wrap text-sm">{analysisMutation.data.analysis}</pre>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t text-xs text-muted-foreground">
                    <span>Provider: {analysisMutation.data.provider}</span>
                    <span>•</span>
                    <span>Model: {analysisMutation.data.model?.split('/').pop()}</span>
                  </div>
                </div>
              )}

              {analysisMutation.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Analysis Failed</AlertTitle>
                  <AlertDescription>
                    {(analysisMutation.error as any)?.message || 'Unknown error occurred'}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Executive Summary Tab */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Executive Briefing</CardTitle>
              <CardDescription>
                Generate concise executive summaries of multiple alerts for leadership review
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Summarizing up to 15 alerts
                </Badge>
                <Button 
                  onClick={handleSummarizeAlerts}
                  disabled={summaryMutation.isPending || !alertsData?.data?.activeAlerts?.length}
                  size="sm"
                >
                  {summaryMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Generate Summary
                </Button>
              </div>

              {summaryMutation.data && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Executive Summary:</h4>
                  <pre className="whitespace-pre-wrap text-sm">{summaryMutation.data.summary}</pre>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t text-xs text-muted-foreground">
                    <span>Provider: {summaryMutation.data.provider}</span>
                    <span>•</span>
                    <span>{summaryMutation.data.alertCount} alerts processed</span>
                  </div>
                </div>
              )}

              {summaryMutation.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Summary Generation Failed</AlertTitle>
                  <AlertDescription>
                    {(summaryMutation.error as any)?.message || 'Unknown error occurred'}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Query Tab */}
        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Custom AI Query</CardTitle>
              <CardDescription>
                Ask custom questions or request specific analysis using the selected Fireworks AI model
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Query</label>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ask a question about airline operations, competitive analysis, or request specific insights..."
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Using: {models.find((m: FireworksModel) => m.id === selectedModel)?.name || 'Default model'}
                </div>
                <Button 
                  onClick={handleCustomCompletion}
                  disabled={completionMutation.isPending || !customPrompt.trim()}
                >
                  {completionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Generate Response
                </Button>
              </div>

              {completionMutation.data && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">AI Response:</h4>
                  <pre className="whitespace-pre-wrap text-sm">{completionMutation.data.completion}</pre>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t text-xs text-muted-foreground">
                    <span>Provider: {completionMutation.data.provider}</span>
                    <span>•</span>
                    <span>Model: {completionMutation.data.model?.split('/').pop()}</span>
                  </div>
                </div>
              )}

              {completionMutation.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Query Failed</AlertTitle>
                  <AlertDescription>
                    {(completionMutation.error as any)?.message || 'Unknown error occurred'}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}