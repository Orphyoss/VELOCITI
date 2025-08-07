import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function FireworksAI() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [maxTokens, setMaxTokens] = useState(256);
  const [temperature, setTemperature] = useState(0.7);

  // Completion mutation
  const completionMutation = useMutation({
    mutationFn: async (data: { prompt: string; options?: any }) => {
      const response = await fetch('/api/fireworks/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.text || 'No response received');
    },
    onError: (error) => {
      console.error('Fireworks completion error:', error);
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const handleSubmit = () => {
    if (!prompt.trim()) return;

    completionMutation.mutate({
      prompt,
      options: {
        max_tokens: maxTokens,
        temperature: temperature,
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fireworks AI - GPT OSS 20B</h1>
          <p className="text-muted-foreground mt-2">
            Simple text completion using the gpt-oss-20b open source model
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm text-muted-foreground">Connected</span>
        </div>
      </div>

      {/* Main Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Text Completion
          </CardTitle>
          <CardDescription>
            Enter a prompt and get completions from the gpt-oss-20b model
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <input
                id="maxTokens"
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 256)}
                className="w-full px-3 py-2 border border-input rounded-md"
                min="1"
                max="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <input
                id="temperature"
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value) || 0.7)}
                className="w-full px-3 py-2 border border-input rounded-md"
                min="0"
                max="2"
                step="0.1"
              />
            </div>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={completionMutation.isPending || !prompt.trim()}
            className="w-full"
          >
            {completionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Generate Completion
          </Button>

          {result && (
            <div className="mt-4">
              <Label>Response</Label>
              <div className="mt-2 p-4 bg-muted rounded-lg">
                <pre className="whitespace-pre-wrap text-sm">{result}</pre>
              </div>
            </div>
          )}

          {completionMutation.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {completionMutation.error instanceof Error ? completionMutation.error.message : 'Unknown error occurred'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}