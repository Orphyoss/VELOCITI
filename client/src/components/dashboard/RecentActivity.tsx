import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, BarChart3, Bot, TrendingUp } from 'lucide-react';
import { Activity } from '@/types';

export default function RecentActivity() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['/api/activities'],
    queryFn: () => api.getActivities(10),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'alert': return AlertTriangle;
      case 'analysis': return BarChart3;
      case 'feedback': return Bot;
      default: return Clock;
    }
  };

  const getActivityColor = (type: string, agentId?: string) => {
    if (type === 'alert') return 'border-red-500';
    if (type === 'analysis') return 'border-blue-500';
    if (type === 'feedback') return 'border-green-500';
    return 'border-dark-600';
  };

  const getActivityBadgeColor = (agentId?: string) => {
    switch (agentId) {
      case 'competitive': return 'bg-red-600 text-white';
      case 'performance': return 'bg-blue-600 text-white';
      case 'network': return 'bg-green-600 text-white';
      default: return 'bg-dark-600 text-white';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card className="bg-dark-900 border-dark-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-dark-50 flex items-center">
            <Clock className="text-aviation-500 mr-2" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4 border-l-2 border-dark-700 pl-4">
                <div className="w-8 h-8 bg-dark-800 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-dark-800 rounded w-3/4"></div>
                  <div className="h-3 bg-dark-800 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dark-900 border-dark-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-dark-50 flex items-center">
          <Clock className="text-aviation-500 mr-2" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity: Activity) => {
              const Icon = getActivityIcon(activity.type);
              const borderColor = getActivityColor(activity.type, activity.agentId);
              
              return (
                <div key={activity.id} className={`flex items-start space-x-4 border-l-2 ${borderColor} pl-4`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'alert' ? 'bg-red-600' :
                    activity.type === 'analysis' ? 'bg-blue-600' :
                    activity.type === 'feedback' ? 'bg-green-600' :
                    'bg-dark-600'
                  }`}>
                    <Icon className="text-white text-sm" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h6 className="font-medium text-dark-50">{activity.title}</h6>
                      <span className="text-xs text-dark-400">
                        {formatTimestamp(activity.createdAt)}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-dark-300 mb-2">{activity.description}</p>
                    )}
                    <div className="flex items-center space-x-2">
                      {activity.agentId && (
                        <Badge className={`text-xs px-2 py-1 ${getActivityBadgeColor(activity.agentId)}`}>
                          {activity.agentId.charAt(0).toUpperCase() + activity.agentId.slice(1)} Agent
                        </Badge>
                      )}
                      {activity.metadata?.confidence && (
                        <span className="text-xs text-dark-400">
                          {Math.round(activity.metadata.confidence * 100)}% confidence
                        </span>
                      )}
                      {activity.metadata?.accuracy && (
                        <span className="text-xs text-dark-400">
                          Accuracy: {activity.metadata.accuracy}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-dark-300 mb-2">No Recent Activity</h4>
            <p className="text-dark-400">
              System activity will appear here as agents process data and generate insights.
            </p>
          </div>
        )}
        
        {activities && activities.length > 0 && (
          <div className="mt-6 pt-4 border-t border-dark-800">
            <Button 
              variant="ghost"
              className="text-aviation-400 hover:text-aviation-300 font-medium"
            >
              View All Activity →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
