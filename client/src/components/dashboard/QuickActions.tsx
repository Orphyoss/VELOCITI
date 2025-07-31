import { useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, Brain, ThumbsUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// FeedbackSystem moved to Analyst Workbench

export default function QuickActions() {
  const [dataQuery, setDataQuery] = useState('');
  const [strategicQuery, setStrategicQuery] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const [strategicLoading, setStrategicLoading] = useState(false);
  // showFeedback state removed - feedback moved to Analyst Workbench
  const { toast } = useToast();

  const handleDataQuery = async () => {
    if (!dataQuery.trim()) return;
    
    setDataLoading(true);
    try {
      const result = await api.queryLLM(dataQuery, 'genie');
      toast({
        title: "Query Executed",
        description: result.explanation || "Query processed successfully",
      });
      // Here you would typically show results in a modal or new section
    } catch (error) {
      toast({
        title: "Query Failed",
        description: "Failed to execute data query. Please try again.",
        variant: "destructive",
      });
    }
    setDataLoading(false);
  };

  const handleStrategicAnalysis = async () => {
    if (!strategicQuery.trim()) return;
    
    setStrategicLoading(true);
    try {
      const result = await api.queryLLM(strategicQuery, 'strategic');
      toast({
        title: "Analysis Complete",
        description: "Strategic analysis generated successfully",
      });
      // Here you would typically show results in a modal or new section
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to generate strategic analysis. Please try again.",
        variant: "destructive",
      });
    }
    setStrategicLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {/* Quick Data Query */}
      <Card className="bg-dark-900 border-dark-800">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg font-semibold text-dark-50 flex items-center">
            <Search className="text-aviation-500 w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Quick Data Query
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <Input
            placeholder="Ask about network performance, pricing, or any metric..."
            value={dataQuery}
            onChange={(e) => setDataQuery(e.target.value)}
            className="bg-dark-800 border-dark-700 text-dark-50 text-sm sm:text-base"
          />
          <Button 
            onClick={handleDataQuery}
            disabled={dataLoading || !dataQuery.trim()}
            className="w-full bg-aviation-600 hover:bg-aviation-700 text-white"
          >
            {dataLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Querying...
              </>
            ) : (
              'Execute Query'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Strategic Analysis */}
      <Card className="bg-dark-900 border-dark-800">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg font-semibold text-dark-50 flex items-center">
            <Brain className="text-aviation-500 w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Strategic Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <Textarea
            placeholder="Request strategic insights, competitive analysis, or market recommendations..."
            value={strategicQuery}
            onChange={(e) => setStrategicQuery(e.target.value)}
            className="bg-dark-800 border-dark-700 text-dark-50 text-sm sm:text-base min-h-[80px] sm:min-h-[100px]"
          />
          <Button 
            onClick={handleStrategicAnalysis}
            disabled={strategicLoading || !strategicQuery.trim()}
            className="w-full bg-aviation-600 hover:bg-aviation-700 text-white"
          >
            {strategicLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Generate Analysis'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Agent Feedback - Moved to Analyst Workbench */}
      <Card className="bg-dark-900 border-dark-800 lg:col-span-2">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg font-semibold text-dark-50 flex items-center">
            <ThumbsUp className="text-aviation-500 w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Agent Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-dark-300">
            Agent feedback has been moved to the Analyst Workbench for better workflow integration.
          </p>
          
          <Button 
            onClick={() => window.location.href = '/workbench'}
            className="w-full bg-aviation-600 hover:bg-aviation-700 text-white"
          >
            Go to Agent Feedback
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
