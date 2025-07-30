import { useState } from 'react';
import { Alert } from '@/types';
import { api } from '@/services/api';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertCardProps {
  alert: Alert;
  showDetails?: boolean;
}

export default function AlertCard({ alert, showDetails = false }: AlertCardProps) {
  const [expanded, setExpanded] = useState(showDetails);
  const [loading, setLoading] = useState(false);
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

  return (
    <Card className={cn(
      'border rounded-lg transition-all duration-200 hover:shadow-lg',
      `alert-${alert.priority}`
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getAlertIcon()}</span>
            <Badge className={cn('text-xs font-medium px-2 py-1', getPriorityColor(alert.priority))}>
              {alert.priority.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {alert.category}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(alert.createdAt)}
          </span>
        </div>

        <h4 className="font-medium text-foreground mb-2">{alert.title}</h4>
        <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4 text-xs">
            {alert.route && (
              <span className="text-muted-foreground">
                Route: <span className="text-foreground font-medium">{alert.route}</span>
              </span>
            )}
            {alert.impact && (
              <span className="text-muted-foreground">
                Impact: <span className="text-foreground font-medium">{formatCurrency(alert.impact)}</span>
              </span>
            )}
            {alert.confidence && (
              <span className="text-muted-foreground">
                Confidence: <span className="text-foreground font-medium">{Math.round(alert.confidence * 100)}%</span>
              </span>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-aviation-400 hover:text-aviation-300"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Details
              </>
            )}
          </Button>
        </div>

        {expanded && (
          <div className="border-t border-border pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Agent:</span>
                <span className="ml-2 text-foreground font-medium">{alert.agentId}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className="ml-2 text-foreground font-medium">{alert.status}</span>
              </div>
            </div>

            {alert.metadata && (
              <div className="bg-secondary/20 rounded p-2">
                <h6 className="text-xs font-medium text-foreground mb-1">Additional Details:</h6>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {JSON.stringify(alert.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex space-x-2">
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
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Open Analysis
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
