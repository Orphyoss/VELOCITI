import { useState } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { ThumbsUp, ThumbsDown, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeedbackSystemProps {
  alertId: string;
  agentId: string;
  onSubmitted?: () => void;
}

export default function FeedbackSystem({ alertId, agentId, onSubmitted }: FeedbackSystemProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [actionTaken, setActionTaken] = useState(false);
  const [impactRealized, setImpactRealized] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleQuickFeedback = async (quickRating: number) => {
    setLoading(true);
    try {
      await api.submitFeedback(agentId, {
        alertId,
        rating: quickRating,
        actionTaken: false,
      });
      
      toast({
        title: "Feedback Submitted",
        description: "Thank you for helping our agents learn!",
      });
      
      if (onSubmitted) onSubmitted();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleDetailedFeedback = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await api.submitFeedback(agentId, {
        alertId,
        rating,
        comment: comment || undefined,
        actionTaken,
        impactRealized: impactRealized ? parseFloat(impactRealized) : undefined,
      });
      
      toast({
        title: "Detailed Feedback Submitted",
        description: "Your feedback will help improve agent accuracy.",
      });
      
      // Reset form
      setRating(0);
      setComment('');
      setActionTaken(false);
      setImpactRealized('');
      
      if (onSubmitted) onSubmitted();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <Card className="bg-dark-900 border-dark-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-dark-50 flex items-center">
          <Brain className="text-aviation-500 mr-2" />
          Agent Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Feedback */}
        <div>
          <Label className="text-sm text-dark-300 mb-2 block">
            Quick Feedback
          </Label>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFeedback(5)}
              disabled={loading}
              className="flex items-center space-x-1 bg-green-600/20 border-green-600/40 hover:bg-green-600/30"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Accurate</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFeedback(1)}
              disabled={loading}
              className="flex items-center space-x-1 bg-red-600/20 border-red-600/40 hover:bg-red-600/30"
            >
              <ThumbsDown className="w-4 h-4" />
              <span>Inaccurate</span>
            </Button>
          </div>
        </div>

        {/* Detailed Feedback */}
        <div className="border-t border-dark-800 pt-4">
          <Label className="text-sm text-dark-300 mb-3 block">
            Detailed Feedback
          </Label>
          
          <div className="space-y-4">
            {/* Rating */}
            <div>
              <Label className="text-xs text-dark-400 mb-2 block">
                Alert Accuracy (1-5 stars)
              </Label>
              <RadioGroup
                value={rating.toString()}
                onValueChange={(value) => setRating(parseInt(value))}
                className="flex space-x-2"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <div key={star} className="flex items-center space-x-1">
                    <RadioGroupItem value={star.toString()} id={`star-${star}`} />
                    <Label htmlFor={`star-${star}`} className="text-xs">
                      {star}★
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Action Taken */}
            <div className="flex items-center space-x-2">
              <Switch
                id="action-taken"
                checked={actionTaken}
                onCheckedChange={setActionTaken}
              />
              <Label htmlFor="action-taken" className="text-xs text-dark-300">
                I took action based on this alert
              </Label>
            </div>

            {/* Impact Realized */}
            {actionTaken && (
              <div>
                <Label htmlFor="impact" className="text-xs text-dark-400 mb-1 block">
                  Revenue Impact Realized (£)
                </Label>
                <input
                  id="impact"
                  type="number"
                  value={impactRealized}
                  onChange={(e) => setImpactRealized(e.target.value)}
                  placeholder="e.g., 25000"
                  className="w-full bg-dark-800 border border-dark-700 rounded px-3 py-2 text-sm text-dark-50 placeholder-dark-400"
                />
              </div>
            )}

            {/* Comment */}
            <div>
              <Label htmlFor="comment" className="text-xs text-dark-400 mb-1 block">
                Additional Comments (Optional)
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What could be improved about this alert?"
                className="bg-dark-800 border-dark-700 text-dark-50 placeholder-dark-400 resize-none"
                rows={3}
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleDetailedFeedback}
              disabled={loading || rating === 0}
              className="w-full bg-aviation-600 hover:bg-aviation-700"
            >
              {loading ? 'Submitting...' : 'Submit Detailed Feedback'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
