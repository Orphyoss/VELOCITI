import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';

function TodaysPriorities() {
  const { data: alerts, isLoading, error } = useQuery({
    queryKey: ['/api/alerts'],
    queryFn: () => api.getAlerts(),
    refetchInterval: 30000,
  });

  console.log('TodaysPriorities API Response:', { alerts, isLoading, error });

  if (isLoading) {
    return (
      <Card className="bg-dark-900 border-dark-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-dark-50">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Today's Priorities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-dark-700 rounded mb-2"></div>
                <div className="h-3 bg-dark-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter critical alerts - limit to 5 for display
  const allAlerts = alerts || [];
  const criticalAlerts = allAlerts
    .filter((alert: any) => alert.priority === 'critical')
    .slice(0, 5);
  
  console.log('TodaysPriorities Debug:', {
    totalAlerts: allAlerts.length,
    criticalCount: allAlerts.filter((alert: any) => alert.priority === 'critical').length,
    criticalAlertsShown: criticalAlerts.length,
    firstAlert: allAlerts[0]
  });

  return (
    <Card className="bg-dark-900 border-dark-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-dark-50">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Today's Priorities
          <Badge variant="destructive" className="ml-auto">
            {criticalAlerts.length} Critical
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {criticalAlerts.length === 0 && allAlerts.length > 0 ? (
          <div className="text-center py-8 text-dark-400">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Critical Issues</p>
            <p className="text-sm">All systems operating within acceptable parameters</p>
          </div>
        ) : allAlerts.length === 0 ? (
          <div className="text-center py-8 text-dark-400">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Loading Alerts...</p>
            <p className="text-sm">Fetching latest intelligence data</p>
          </div>
        ) : (
          <div className="space-y-4">
            {criticalAlerts.map((alert: any) => (
              <div
                key={alert.id}
                className="border border-red-800 rounded-lg p-4 bg-red-950/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="destructive" className="text-xs">
                        CRITICAL
                      </Badge>
                      <Badge variant="outline" className="text-xs text-dark-300 border-dark-600">
                        {alert.agent_id || 'System'}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-dark-100 mb-1">
                      {alert.title}
                    </h4>
                    <p className="text-sm text-dark-400 mb-2">
                      {alert.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-dark-500 ml-4">
                    <Clock className="h-3 w-3" />
                    {new Date(alert.created_at).toLocaleTimeString('en-GB', {
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