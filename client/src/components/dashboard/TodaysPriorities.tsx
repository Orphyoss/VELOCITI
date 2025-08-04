import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, TrendingUp, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { Alert } from '@/types';

function TodaysPriorities() {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['/api/alerts'],
    queryFn: () => api.getAlerts(),
    refetchInterval: 30000,
  });

  // Filter only critical alerts - limit to first 5 for dashboard display
  const criticalAlerts = alerts?.filter((alert: Alert) => alert.priority === 'critical').slice(0, 5) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Today's Priorities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Today's Priorities
          <Badge variant="destructive" className="ml-auto">
            {criticalAlerts.length} Critical
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {criticalAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Critical Issues</p>
            <p className="text-sm">All systems operating within acceptable parameters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {criticalAlerts.map((alert: Alert) => (
              <div
                key={alert.id}
                className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-950/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="destructive" className="text-xs">
                        CRITICAL
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {(alert as any).agent_id || alert.agentId || 'System'}
                      </Badge>
                      {((alert as any).route || alert.route) && (
                        <Badge variant="secondary" className="text-xs">
                          {(alert as any).route || alert.route}
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {alert.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {alert.description}
                    </p>
                    {((alert as any).impact_score || alert.impact || (alert as any).revenue_impact) && (
                      <div className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400">
                        <TrendingUp className="h-4 w-4" />
                        Impact: {(alert as any).impact_score ? `${(alert as any).impact_score}%` : 
                                alert.impact ? (typeof alert.impact === 'number' ? `${alert.impact}%` : alert.impact) :
                                `£${Math.round((alert as any).revenue_impact / 1000)}K`}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 ml-4">
                    <Clock className="h-3 w-3" />
                    {new Date((alert as any).created_at || alert.createdAt).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TodaysPriorities;