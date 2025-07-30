import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sunrise } from 'lucide-react';
import AlertCard from '../alerts/AlertCard';

export default function MorningBriefing() {
  const { data: criticalAlerts, isLoading } = useQuery({
    queryKey: ['/api/alerts', 'critical'],
    queryFn: () => api.getAlerts('critical', 5),
  });

  const { data: highAlerts } = useQuery({
    queryKey: ['/api/alerts', 'high'],
    queryFn: () => api.getAlerts('high', 3),
  });

  if (isLoading) {
    return (
      <Card className="bg-dark-900 border-dark-800">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-dark-800 rounded w-1/4"></div>
            <div className="h-16 bg-dark-800 rounded"></div>
            <div className="h-16 bg-dark-800 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentTime = new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London'
  });

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-dark-50 flex items-center">
          <Sunrise className="text-yellow-500 mr-2" />
          Morning Briefing
        </h3>
        <span className="text-sm text-dark-400">
          Generated at {currentTime} GMT
        </span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Critical Alerts */}
        {criticalAlerts?.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
        
        {/* High Priority Alerts */}
        {highAlerts?.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
        
        {/* Empty State */}
        {(!criticalAlerts?.length && !highAlerts?.length) && (
          <Card className="col-span-2 bg-dark-900 border-dark-800">
            <CardContent className="p-8 text-center">
              <Sunrise className="w-12 h-12 text-dark-600 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-dark-300 mb-2">
                No Critical Alerts
              </h4>
              <p className="text-dark-400">
                All systems are running smoothly. Check back for updates throughout the day.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
