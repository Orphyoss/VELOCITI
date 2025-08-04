import AppShell from '@/components/layout/AppShell';
import MetricsOverview from '@/components/dashboard/MetricsOverview';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, TrendingUp, AlertTriangle, Bot, Activity } from 'lucide-react';

export default function Dashboard() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['/api/dashboard/summary'],
    refetchInterval: 30000,
  });

  const recentAlerts = summary?.alerts?.recent?.slice(0, 3) || [];

  return (
    <AppShell currentPage="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Velociti Intelligence Platform</h1>
            <p className="text-gray-400 mt-2">
              AI-powered revenue management and analytics for EasyJet
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Metrics Overview */}
        <MetricsOverview />

        {/* Today's Priorities Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Critical Alerts */}
          <Card className="bg-dark-900 border-dark-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>Today's Priorities</span>
                <Badge variant="destructive" className="ml-auto">
                  {summary?.alerts?.critical || 0} Critical
                </Badge>
              </CardTitle>
              <CardDescription>
                High-priority alerts requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-dark-800 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-dark-800 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentAlerts.length > 0 ? (
                recentAlerts.map((alert: any, index) => (
                  <Alert key={index} className="bg-dark-800 border-dark-700">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-white mb-1">
                            {alert.title}
                          </div>
                          <div className="text-sm text-gray-400 line-clamp-2">
                            {alert.description}
                          </div>
                        </div>
                        <Badge 
                          variant={alert.priority === 'critical' ? 'destructive' : 'secondary'}
                          className="ml-2 text-xs"
                        >
                          {alert.priority}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No critical alerts at this time</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Network Performance */}
          <Card className="bg-dark-900 border-dark-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Activity className="w-5 h-5 text-blue-500" />
                <span>Network Performance</span>
                <Badge variant="secondary" className="ml-auto">
                  {summary?.metrics?.routesMonitored || 0} Routes
                </Badge>
              </CardTitle>
              <CardDescription>
                Real-time network and route performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    £{Math.round(summary?.metrics?.networkYield || 0)}
                  </div>
                  <div className="text-sm text-gray-400">Network Yield</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white flex items-center justify-center">
                    {summary?.metrics?.loadFactor ? Math.round(summary.metrics.loadFactor) : 0}%
                  </div>
                  <div className="text-sm text-gray-400">Load Factor</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white flex items-center justify-center">
                    {summary?.metrics?.yieldImprovement || 0}%
                    <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
                  </div>
                  <div className="text-sm text-gray-400">Yield Improvement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {summary?.metrics?.analysisSpeed || 0}s
                  </div>
                  <div className="text-sm text-gray-400">Analysis Speed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}