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
    <div className="grid grid-cols-1 gap-6 mb-8">
      {/* Agent Feedback - Moved to Analyst Workbench */}
      <Card className="bg-dark-900 border-dark-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-dark-50 flex items-center">
            <ThumbsUp className="text-aviation-500 mr-2" />
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
