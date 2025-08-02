import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, BarChart3, AlertTriangle, Bot, Clock, Plane, Target, Zap } from 'lucide-react';

export default function MetricsOverview() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['/api/dashboard/summary'],
    queryFn: () => api.getDashboardSummary(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="bg-dark-900 border-dark-800">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="animate-pulse space-y-2 sm:space-y-4">
                <div className="h-3 sm:h-4 bg-dark-800 rounded w-1/2"></div>
                <div className="h-6 sm:h-8 bg-dark-800 rounded w-3/4"></div>
                <div className="h-3 sm:h-4 bg-dark-800 rounded w-1/3"></div>
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
      value: summary?.metrics.networkYield ? `£${summary.metrics.networkYield.toFixed(2)}` : 'No data',
      change: (summary?.metrics as any)?.yieldImprovement ? `+${(summary.metrics as any).yieldImprovement}% vs forecast` : 'Calculating...',
      trend: 'up',
      icon: BarChart3,
    },
    {
      title: 'Load Factor',
      value: summary?.metrics.loadFactor ? `${summary.metrics.loadFactor.toFixed(1)}%` : 'No data',
      change: 'vs forecast',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Revenue Impact',
      value: (summary?.metrics as any)?.revenueImpact ? `£${((summary.metrics as any).revenueImpact / 1000000).toFixed(1)}M` : '£0.0M',
      change: 'Daily AI impact',
      trend: (summary?.metrics as any)?.revenueImpact > 0 ? 'up' : 'neutral',
      icon: Target,
    },
    {
      title: 'Response Time',
      value: (summary?.metrics as any)?.responseTime ? `${(summary.metrics as any).responseTime}min` : 'No alerts',
      change: 'Avg. alert response',
      trend: (summary?.metrics as any)?.responseTime <= 15 ? 'up' : 'down',
      icon: Zap,
    },
    {
      title: 'Briefing Efficiency', 
      value: (summary?.metrics as any)?.briefingTime ? `${(summary.metrics as any).briefingTime}min` : 'No data',
      change: 'Morning briefing',
      trend: 'up',
      icon: Clock,
    },
    {
      title: 'Routes Monitored',
      value: (summary?.metrics as any)?.routesMonitored || 0,
      change: 'Active monitoring',
      trend: 'neutral',
      icon: Plane,
    },
    {
      title: 'Decision Accuracy',
      value: (summary?.metrics as any)?.decisionAccuracy ? `${(summary.metrics as any).decisionAccuracy}%` : '0.0%',
      change: 'Critical decisions',
      trend: parseFloat((summary?.metrics as any)?.decisionAccuracy || '0') > 80 ? 'up' : 'neutral',
      icon: Target,
    },
    {
      title: 'Active Alerts',
      value: summary?.alerts.total || 0,
      change: `${summary?.alerts.critical || 0} Critical`,
      trend: summary && summary.alerts.critical > 0 ? 'down' : 'neutral',
      icon: AlertTriangle,
      highlight: summary && summary.alerts.critical > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
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
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="text-xs sm:text-sm font-medium text-dark-400 leading-tight">{metric.title}</h4>
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 text-aviation-500 ${isHighlight ? 'text-red-500' : ''}`} />
              </div>
              
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-dark-50 mb-1 sm:mb-2">
                {metric.value}
              </div>
              
              <div className="flex items-center">
                {metric.trend === 'up' && <TrendingUp className="text-green-500 w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                {metric.trend === 'down' && <TrendingDown className="text-red-500 w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                <span className={`text-xs sm:text-sm leading-tight ${
                  metric.trend === 'up' ? 'text-green-500' :
                  metric.trend === 'down' ? 'text-red-500' :
                  'text-dark-400'
                }`}>
                  {metric.change}
                </span>
              </div>
              
              {isHighlight && (
                <div className="mt-1 sm:mt-2 flex flex-wrap gap-1">
                  <span className="text-xs bg-red-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                    {summary?.alerts.critical} Critical
                  </span>
                  <span className="text-xs bg-orange-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
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
