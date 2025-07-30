import { useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, Brain, ThumbsUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FeedbackSystem from '../agents/FeedbackSystem';

export default function QuickActions() {
  const [dataQuery, setDataQuery] = useState('');
  const [strategicQuery, setStrategicQuery] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const [strategicLoading, setStrategicLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
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
      {/* Agent Feedback */}
      <Card className="bg-dark-900 border-dark-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-dark-50 flex items-center">
            <ThumbsUp className="text-aviation-500 mr-2" />
            Agent Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-dark-300">Help agents learn from your decisions</p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-dark-400">Last alert accuracy:</span>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-8 h-8 p-0 bg-green-600/20 border-green-600/40 hover:bg-green-600/30"
                >
                  <ThumbsUp className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline" 
                  className="w-8 h-8 p-0 bg-red-600/20 border-red-600/40 hover:bg-red-600/30"
                >
                  <span className="text-lg">👎</span>
                </Button>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowFeedback(!showFeedback)}
            variant="outline"
            className="w-full bg-dark-800 hover:bg-dark-700 text-dark-50 border-dark-600"
          >
            Detailed Feedback
          </Button>
          
          {showFeedback && (
            <div className="mt-4">
              <FeedbackSystem
                alertId="sample-alert-id"
                agentId="competitive"
                onSubmitted={() => setShowFeedback(false)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
