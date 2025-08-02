import { useState } from 'react';
import { Alert } from '@/types';
import { api } from '@/services/api';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, ExternalLink, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
// AlertFeedback moved to Analyst Workbench

interface AlertCardProps {
  alert: Alert;
  showDetails?: boolean;
}

export default function AlertCard({ alert, showDetails = false }: AlertCardProps) {
  const [expanded, setExpanded] = useState(showDetails);
  const [loading, setLoading] = useState(false);
  // showFeedback removed - feedback moved to Analyst Workbench
  const [showAnalysis, setShowAnalysis] = useState(false);
  const { updateAlertStatus } = useVelocitiStore();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-600';
      case 'high': return 'text-orange-400 bg-orange-600';
      case 'medium': return 'text-yellow-400 bg-yellow-600';
      case 'low': return 'text-green-400 bg-green-600';
      default: return 'text-gray-400 bg-gray-600';
    }
  };

  const getAlertIcon = () => {
    switch (alert.priority) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚫';
    }
  };

  const handleStatusChange = async (status: string) => {
    setLoading(true);
    try {
      await api.updateAlertStatus(alert.id, status);
      updateAlertStatus(alert.id, status);
    } catch (error) {
      console.error('Failed to update alert status:', error);
    }
    setLoading(false);
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} mins ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const generateNaturalLanguageAnalysis = () => {
    const analysisTexts: { [key: string]: string } = {
      competitive: `Our analysis indicates that ${alert.route || 'this route'} is experiencing competitive pressure. Based on market data, competitor pricing has shifted significantly, potentially impacting our revenue by ${formatCurrency(alert.impact)}. We recommend monitoring competitor moves closely and consider dynamic pricing adjustments to maintain market position.`,
      performance: `Route ${alert.route || 'performance'} is underperforming against forecasts. The current variance suggests operational challenges that could affect profitability. Revenue impact is estimated at ${formatCurrency(alert.impact)}. Consider reviewing capacity allocation and demand patterns for this route.`,
      network: `Network optimization analysis reveals opportunities for improvement across multiple routes. The data suggests reallocating resources could enhance overall network efficiency. Potential revenue uplift of ${formatCurrency(alert.impact)} is achievable through strategic adjustments.`
    };

    return analysisTexts[alert.category] || alert.description;
  };

  return (
    <Card className={cn(
      'border rounded-lg transition-all duration-200 hover:shadow-lg',
      `alert-${alert.priority}`
    )}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm">{getAlertIcon()}</span>
            <Badge className={cn('text-xs font-medium px-1.5 py-0.5', getPriorityColor(alert.priority))}>
              {alert.priority.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              {alert.category}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(alert.createdAt)}
          </span>
        </div>

        <h4 className="font-medium text-foreground mb-1 text-sm">{alert.title}</h4>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{alert.description}</p>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3 text-xs">
            {alert.route && (
              <span className="text-muted-foreground">
                <span className="text-foreground font-medium">{alert.route}</span>
              </span>
            )}
            {alert.impact && (
              <span className="text-foreground font-medium">{formatCurrency(alert.impact)}</span>
            )}
            {alert.confidence && (
              <span className="text-foreground font-medium">
                {(() => {
                  const conf = typeof alert.confidence === 'string' ? parseFloat(alert.confidence) : alert.confidence;
                  // If confidence is already a percentage (>1), display as-is, otherwise multiply by 100
                  return conf > 1 ? Math.round(conf) : Math.round(conf * 100);
                })()}%
              </span>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-aviation-400 hover:text-aviation-300 h-6 px-2 text-xs"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 mr-1" />
                More
              </>
            )}
          </Button>
        </div>

        {expanded && (
          <div className="border-t border-border pt-2 space-y-2">
            {/* Natural Language Analysis */}
            {showAnalysis && (
              <div className="bg-dark-800/30 rounded-lg p-3 space-y-2">
                <h4 className="font-medium text-dark-50 mb-1 text-sm">Insights & Recommendations</h4>
                <p className="text-dark-300 leading-relaxed text-xs">
                  {generateNaturalLanguageAnalysis()}
                </p>
                <div className="flex items-center justify-between text-xs text-dark-400">
                  <span>Generated by {alert.agentId} Agent</span>
                  <span>{Math.round((alert.confidence || 0.8) * 100)}% confidence</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex space-x-1">
                {alert.status === 'active' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange('dismissed')}
                      disabled={loading}
                      className="text-xs"
                    >
                      Dismiss
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange('escalated')}
                      disabled={loading}
                      className="text-xs"
                    >
                      Escalate
                    </Button>
                  </>
                )}
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                className="text-aviation-400 hover:text-aviation-300 text-xs"
                onClick={() => setShowAnalysis(!showAnalysis)}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                {showAnalysis ? 'Hide Analysis' : 'View Analysis'}
              </Button>
            </div>

            {/* Feedback Section - Moved to Analyst Workbench */}
            <div className="bg-dark-800/50 rounded-lg p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-dark-200">Provide feedback via Analyst Workbench</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs px-2 py-1 bg-aviation-600/20 border-aviation-600/40 hover:bg-aviation-600/30 h-6"
                  onClick={() => window.location.href = '/workbench'}
                >
                  Feedback
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
