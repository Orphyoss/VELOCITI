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
  
  // Get real Telos Intelligence data for authentic metrics
  const { data: rmMetrics } = useQuery({
    queryKey: ['/api/telos/rm-metrics'],
    enabled: true,
    staleTime: 0, // Force fresh data
  });

  const { data: routePerformance } = useQuery({
    queryKey: ['/api/routes/performance'],
    enabled: true,
    staleTime: 0, // Force fresh data
  });

  const { data: competitiveData } = useQuery({
    queryKey: ['/api/telos/competitive-pricing'],
    enabled: true,
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

  // Extract only real data from API responses - NO FALLBACKS
  const networkYield = (rmMetrics as any)?.yieldOptimization?.currentYield;
  const loadFactor = parseFloat((routePerformance as any)?.[0]?.avgLoadFactor) || null;
  const routesCount = (routePerformance as any)?.length || 0;

  // Calculate real metrics from authenticated database sources
  const totalAlerts = summary?.alerts?.total || 0;
  const criticalAlerts = summary?.alerts?.critical || 0;
  const activeAgents = summary?.agents?.length || 0;
  const dailyRevenue = (rmMetrics as any)?.revenueImpact?.daily || 0;

  // Always show core metrics with real data
  const metrics = [
    {
      title: 'Active Alerts',
      value: totalAlerts,
      change: `${criticalAlerts} Critical`,
      trend: criticalAlerts > 0 ? 'down' : 'neutral',
      icon: AlertTriangle,
      highlight: criticalAlerts > 0,
    },
    {
      title: 'AI Agents',
      value: activeAgents,
      change: 'Active monitoring',
      trend: 'up',
      icon: Bot,
    },
    {
      title: 'Network Yield',
      value: networkYield ? `£${Math.round(networkYield)}` : 'No Data',
      change: 'Per passenger',
      trend: networkYield ? 'up' : 'neutral',
      icon: BarChart3,
    },
    {
      title: 'Load Factor',
      value: loadFactor ? `${Math.round(loadFactor)}%` : 'No Data',
      change: 'Current average',
      trend: loadFactor ? 'up' : 'neutral',
      icon: Users,
    },
    {
      title: 'Routes Monitored',
      value: routesCount,
      change: 'European network',
      trend: 'neutral',
      icon: Plane,
    },
    {
      title: 'Daily Revenue',
      value: dailyRevenue ? `£${Math.round(dailyRevenue / 1000)}K` : 'No Data',
      change: 'Today',
      trend: dailyRevenue ? 'up' : 'neutral',
      icon: Target,
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
                  {((summary?.alerts?.total || 0) - (summary?.alerts?.critical || 0)) > 0 && (
                    <span className="text-xs bg-orange-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                      {(summary?.alerts?.total || 0) - (summary?.alerts?.critical || 0)} High
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
