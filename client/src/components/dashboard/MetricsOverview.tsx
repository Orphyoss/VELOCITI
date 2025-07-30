import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, BarChart3, AlertTriangle, Bot } from 'lucide-react';

export default function MetricsOverview() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['/api/dashboard/summary'],
    queryFn: () => api.getDashboardSummary(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-dark-900 border-dark-800">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-dark-800 rounded w-1/2"></div>
                <div className="h-8 bg-dark-800 rounded w-3/4"></div>
                <div className="h-4 bg-dark-800 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: 'Network Yield',
      value: `£${summary?.metrics.networkYield || 127.45}`,
      change: '+2.3% vs yesterday',
      trend: 'up',
      icon: BarChart3,
    },
    {
      title: 'Load Factor',
      value: `${summary?.metrics.loadFactor || 87.2}%`,
      change: '+1.8% vs forecast',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Active Alerts',
      value: summary?.alerts.total || 0,
      change: `${summary?.alerts.critical || 0} Critical`,
      trend: summary && summary.alerts.critical > 0 ? 'down' : 'neutral',
      icon: AlertTriangle,
      highlight: summary && summary.alerts.critical > 0,
    },
    {
      title: 'Agent Performance',
      value: `${summary?.metrics.agentAccuracy || 94.7}%`,
      change: 'Accuracy score',
      trend: 'up',
      icon: Bot,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const isHighlight = metric.highlight;
        
        return (
          <Card 
            key={index} 
            className={`bg-dark-900 border-dark-800 transition-all duration-200 hover:shadow-lg ${
              isHighlight ? 'ring-2 ring-red-500/30' : ''
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-dark-400">{metric.title}</h4>
                <Icon className={`text-aviation-500 ${isHighlight ? 'text-red-500' : ''}`} />
              </div>
              
              <div className="text-2xl font-bold text-dark-50 mb-2">
                {metric.value}
              </div>
              
              <div className="flex items-center">
                {metric.trend === 'up' && <TrendingUp className="text-green-500 text-sm mr-1" />}
                {metric.trend === 'down' && <TrendingDown className="text-red-500 text-sm mr-1" />}
                <span className={`text-sm ${
                  metric.trend === 'up' ? 'text-green-500' :
                  metric.trend === 'down' ? 'text-red-500' :
                  'text-dark-400'
                }`}>
                  {metric.change}
                </span>
              </div>
              
              {isHighlight && (
                <div className="mt-2 flex space-x-1">
                  <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                    {summary?.alerts.critical} Critical
                  </span>
                  <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded">
                    7 High
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
