import { useState } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AlertFeedbackProps {
  alertId: string;
  agentId: string;
  onSubmitted?: () => void;
}

export default function AlertFeedback({ alertId, agentId, onSubmitted }: AlertFeedbackProps) {
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleQuickFeedback = async (quickRating: number, feedbackType: 'positive' | 'negative') => {
    setLoading(true);
    try {
      await api.submitFeedback(agentId, {
        alertId,
        rating: quickRating,
        comment: feedbackType === 'positive' ? 'Accurate alert' : 'Inaccurate alert',
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

  const handleManualFeedback = async () => {
    if (!comment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please provide a comment before submitting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await api.submitFeedback(agentId, {
        alertId,
        rating: rating || 3, // Default to neutral if no rating selected
        comment: comment.trim(),
        actionTaken: false,
      });
      
      toast({
        title: "Feedback Submitted",
        description: "Your detailed feedback will help improve agent accuracy.",
      });
      
      // Reset form
      setComment('');
      setRating(null);
      
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
    <div className="space-y-3">
      {/* Quick Feedback Buttons */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFeedback(5, 'positive')}
          disabled={loading}
          className="flex items-center space-x-1 bg-green-600/20 border-green-600/40 hover:bg-green-600/30 text-xs"
        >
          <ThumbsUp className="w-3 h-3" />
          <span>Accurate</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFeedback(1, 'negative')}
          disabled={loading}
          className="flex items-center space-x-1 bg-red-600/20 border-red-600/40 hover:bg-red-600/30 text-xs"
        >
          <ThumbsDown className="w-3 h-3" />
          <span>Inaccurate</span>
        </Button>
      </div>

      {/* Manual Feedback Section */}
      <div className="border-t border-dark-700 pt-3">
        <Label className="text-xs text-dark-400 mb-2 block">
          <MessageCircle className="w-3 h-3 inline mr-1" />
          Add detailed feedback (optional)
        </Label>
        
        <div className="space-y-2">
          {/* Rating Selection */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-dark-400">Rating:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-xs px-1 py-0.5 rounded ${
                  rating === star
                    ? 'bg-aviation-600 text-white'
                    : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
                }`}
              >
                {star}★
              </button>
            ))}
          </div>

          {/* Comment Input */}
          <Textarea
            placeholder="Share your thoughts on this alert's accuracy, usefulness, or suggest improvements..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="bg-dark-800 border-dark-700 text-dark-50 placeholder-dark-400 text-xs min-h-[60px]"
            rows={3}
          />
          
          <Button
            onClick={handleManualFeedback}
            disabled={loading || !comment.trim()}
            size="sm"
            className="w-full bg-aviation-600 hover:bg-aviation-700 text-xs"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      </div>
    </div>
  );
}