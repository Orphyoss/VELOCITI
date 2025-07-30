import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Database, Search, Loader2, History, Download, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LLMResponse } from '@/types';

interface QueryResult {
  id: string;
  query: string;
  result: LLMResponse;
  timestamp: string;
}

export default function DataInterrogation() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QueryResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<QueryResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get recent conversations for history
  const { data: conversations } = useQuery({
    queryKey: ['/api/conversations'],
    queryFn: () => api.getConversations(),
  });

  const queryMutation = useMutation({
    mutationFn: (queryText: string) => api.queryLLM(queryText, 'genie'),
    onSuccess: (result, queryText) => {
      const newResult: QueryResult = {
        id: Date.now().toString(),
        query: queryText,
        result,
        timestamp: new Date().toISOString(),
      };
      setResults(prev => [newResult, ...prev.slice(0, 9)]); // Keep last 10 results
      setSelectedResult(newResult);
      setQuery('');
      
      toast({
        title: "Query Executed",
        description: result.explanation || "Query processed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Query Failed",
        description: "Failed to execute query. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!query.trim()) return;
    queryMutation.mutate(query.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const exportResults = (result: QueryResult) => {
    const exportData = {
      query: result.query,
      timestamp: result.timestamp,
      results: result.result.results || [],
      sql: result.result.sql,
      explanation: result.result.explanation,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `velociti-query-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const suggestedQueries = [
    "Show LGW routes performance last 7 days",
    "Compare load factors for top 5 routes this month",
    "Find routes with highest competitive pressure",
    "Analyze booking trends for European destinations",
    "Show revenue impact of recent price changes",
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Query Interface */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-dark-900 border-dark-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-dark-50 flex items-center">
              <Database className="text-aviation-500 mr-2" />
              Databricks Genie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Textarea
                placeholder="Ask questions about your data in natural language..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                className="bg-dark-800 border-dark-700 text-dark-50 placeholder-dark-400 min-h-[100px] resize-none"
                disabled={queryMutation.isPending}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-dark-400">
                <span>Press Enter to execute •</span>
                <span>Shift+Enter for new line</span>
              </div>
              <Button 
                onClick={handleSubmit}
                disabled={queryMutation.isPending || !query.trim()}
                className="bg-aviation-600 hover:bg-aviation-700"
              >
                {queryMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Querying...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Execute Query
                  </>
                )}
              </Button>
            </div>

            {/* Suggested Queries */}
            <div>
              <h4 className="text-sm font-medium text-dark-300 mb-2">Suggested Queries:</h4>
              <div className="flex flex-wrap gap-2">
                {suggestedQueries.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(suggestion)}
                    className="text-xs bg-dark-800 hover:bg-dark-700 text-dark-300 border-dark-600"
                    disabled={queryMutation.isPending}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Query Results */}
        {selectedResult && (
          <Card className="bg-dark-900 border-dark-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-dark-50">Query Results</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportResults(selectedResult)}
                  className="bg-dark-800 hover:bg-dark-700 text-dark-50 border-dark-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h5 className="text-sm font-medium text-dark-300 mb-2">Query:</h5>
                <div className="bg-dark-800 rounded p-3 text-sm text-dark-100">
                  {selectedResult.query}
                </div>
              </div>

              {selectedResult.result.explanation && (
                <div>
                  <h5 className="text-sm font-medium text-dark-300 mb-2">Explanation:</h5>
                  <div className="bg-dark-800 rounded p-3 text-sm text-dark-100">
                    {selectedResult.result.explanation}
                  </div>
                </div>
              )}

              {selectedResult.result.sql && (
                <div>
                  <h5 className="text-sm font-medium text-dark-300 mb-2 flex items-center">
                    <Code className="w-4 h-4 mr-1" />
                    Generated SQL:
                  </h5>
                  <div className="bg-dark-800 rounded p-3 text-sm text-dark-100 font-mono overflow-x-auto">
                    <pre>{selectedResult.result.sql}</pre>
                  </div>
                </div>
              )}

              {selectedResult.result.results && selectedResult.result.results.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-dark-300 mb-2">Data Results:</h5>
                  <div className="bg-dark-800 rounded p-3 max-h-96 overflow-auto">
                    <pre className="text-sm text-dark-100">
                      {JSON.stringify(selectedResult.result.results, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Query History */}
      <div className="space-y-6">
        <Card className="bg-dark-900 border-dark-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-dark-50 flex items-center">
              <History className="text-aviation-500 mr-2" />
              Query History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className={`p-3 rounded cursor-pointer transition-colors border ${
                      selectedResult?.id === result.id
                        ? 'bg-aviation-600/20 border-aviation-600/40'
                        : 'bg-dark-800 hover:bg-dark-700 border-dark-700'
                    }`}
                    onClick={() => setSelectedResult(result)}
                  >
                    <p className="text-sm text-dark-50 line-clamp-2 mb-1">
                      {result.query}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-dark-400">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Genie
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                <p className="text-dark-400 text-sm">
                  Your query history will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card className="bg-dark-900 border-dark-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-dark-50">Databricks Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">Connected</span>
            </div>
            <p className="text-xs text-dark-400 mt-2">
              Real-time data access enabled
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
