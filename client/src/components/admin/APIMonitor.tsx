import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Zap,
  Database,
  Globe
} from 'lucide-react';

interface APIHealthStatus {
  service: string;
  endpoint: string;
  status: 'online' | 'offline' | 'degraded';
  responseTime: number;
  lastChecked: string;
  uptime: number;
  errorCount: number;
  lastError?: string;
}

interface APIMetric {
  timestamp: string;
  service: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
}

interface ServiceStats {
  service: string;
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  lastError?: string;
  lastErrorTime?: string;
}

export default function APIMonitor() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch API health status
  const { data: healthResponse, isLoading: healthLoading, refetch: refetchHealth } = useQuery<{healthChecks: APIHealthStatus[]}>({
    queryKey: ['/api/admin/health'],
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch API metrics  
  const { data: metricsResponse, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<{stats: any, recentMetrics: APIMetric[]}>({
    queryKey: ['/api/admin/performance'],
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const healthStatus = healthResponse?.healthChecks || [];
  const metrics = metricsResponse?.recentMetrics || [];

  // Calculate service statistics
  const serviceStats: ServiceStats[] = healthStatus.map(service => {
    const serviceMetrics = metrics.filter(m => m.service === service.service);
    const errorCount = serviceMetrics.filter(m => m.statusCode >= 400).length;
    const totalRequests = serviceMetrics.length;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : service.errorCount || 0;
    
    const lastError = serviceMetrics
      .filter(m => m.statusCode >= 400)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    return {
      service: service.service,
      totalRequests,
      averageResponseTime: service.responseTime,
      errorRate,
      uptime: service.uptime,
      lastError: lastError ? `${lastError.statusCode} - ${lastError.endpoint}` : undefined,
      lastErrorTime: lastError?.timestamp,
    };
  });

  const handleRefresh = () => {
    refetchHealth();
    refetchMetrics();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'offline': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-dark-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'offline': return 'text-red-500';
      default: return 'text-dark-400';
    }
  };

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime < 200) return 'text-green-500';
    if (responseTime < 500) return 'text-yellow-500';
    if (responseTime < 1000) return 'text-orange-500';
    return 'text-red-500';
  };

  const getServiceIcon = (service: string) => {
    switch (service.toLowerCase()) {
      case 'openai': return <Zap className="w-5 h-5" />;
      case 'writer': return <Zap className="w-5 h-5" />;
      case 'pinecone': return <Database className="w-5 h-5" />;
      case 'internal': return <Globe className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleRefresh}
            disabled={healthLoading || metricsLoading}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(healthLoading || metricsLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-dark-300">Auto-refresh:</label>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>
        <div className="text-sm text-dark-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Health Status</TabsTrigger>
          <TabsTrigger value="metrics">Recent Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {serviceStats.map((stats) => (
              <Card key={stats.service} className="bg-dark-800 border-dark-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getServiceIcon(stats.service)}
                      <CardTitle className="text-sm font-medium text-dark-50">{stats.service}</CardTitle>
                    </div>
                    {getStatusIcon(healthStatus.find(h => h.service === stats.service)?.status || 'offline')}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-400">Uptime</span>
                    <span className="font-medium text-dark-50">{stats.uptime.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-400">Avg Response</span>
                    <div className={`font-medium ${getResponseTimeColor(stats.averageResponseTime)}`}>
                      {Math.round(stats.averageResponseTime)}ms
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-400">Error Rate</span>
                    <Badge 
                      variant={stats.errorRate < 5 ? 'default' : 'destructive'}
                    >
                      {stats.errorRate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-400">Requests</span>
                    <span className="font-medium text-dark-50">{stats.totalRequests}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Health Status Tab */}
        <TabsContent value="health" className="space-y-4">
          {healthStatus.map((service) => (
            <Card key={service.service} className="bg-dark-800 border-dark-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getServiceIcon(service.service)}
                    <div>
                      <CardTitle className="text-lg text-dark-50">{service.service}</CardTitle>
                      <CardDescription className="text-dark-400">
                        Last checked: {formatTimestamp(service.lastChecked)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(service.status)}
                    <span className={`font-medium ${getStatusColor(service.status)}`}>
                      {service.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-dark-400">Response Time</p>
                    <p className={`text-lg font-medium ${getResponseTimeColor(service.responseTime)}`}>
                      {service.responseTime}ms
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-dark-400">Uptime</p>
                    <p className="text-lg font-medium text-dark-50">
                      {service.uptime > 0 ? Math.min(100, (service.uptime / (service.uptime + service.errorCount)) * 100).toFixed(1) : 100}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-dark-400">Error Count</p>
                    <p className={`text-lg font-medium ${service.errorCount > 5 ? 'text-red-400' : 'text-green-400'}`}>
                      {service.errorCount}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-dark-400">Status</p>
                    <Badge variant={service.status === 'online' ? 'default' : 'destructive'}>
                      {service.status}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4">
                  <Progress 
                    value={service.uptime} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <Card className="bg-dark-800 border-dark-700">
            <CardHeader>
              <CardTitle className="text-dark-50">Recent API Calls</CardTitle>
              <CardDescription className="text-dark-400">
                Latest {metrics.length} API requests across all services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {metrics
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice(0, 50)
                  .map((metric, index) => (
                  <div key={index} className="flex items-center justify-between text-sm py-2 border-b border-dark-800 last:border-0">
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={metric.statusCode < 400 ? 'default' : 'destructive'}
                      >
                        {metric.method}
                      </Badge>
                      <span className="font-mono text-dark-300">{metric.service}</span>
                      <span className="text-dark-400 truncate max-w-xs">{metric.endpoint}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-dark-400 text-xs">
                        {formatTimestamp(metric.timestamp)}
                      </span>
                      <span className={getResponseTimeColor(metric.responseTime)}>
                        {metric.responseTime}ms
                      </span>
                      <Badge 
                        variant={metric.statusCode < 400 ? 'default' : 'destructive'}
                      >
                        {metric.statusCode}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-dark-800 border-dark-700">
              <CardHeader>
                <CardTitle className="text-dark-50">Error Analysis</CardTitle>
                <CardDescription className="text-dark-400">Recent errors by service</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {serviceStats
                    .filter(stats => stats.lastError)
                    .map((stats) => (
                    <div key={stats.service} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-dark-50">{stats.service}</span>
                        <Badge variant="destructive">
                          {stats.errorRate.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="text-sm text-dark-400">
                        <p>Last error: {stats.lastError}</p>
                        {stats.lastErrorTime && (
                          <p>Time: {formatTimestamp(stats.lastErrorTime)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {serviceStats.filter(stats => stats.lastError).length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <p className="text-green-400">No recent errors detected</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-800 border-dark-700">
              <CardHeader>
                <CardTitle className="text-dark-50">Performance Trends</CardTitle>
                <CardDescription className="text-dark-400">Response time trends by service</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthStatus.map((service) => (
                    <div key={service.service} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-dark-50">{service.service}</span>
                        <div className="flex items-center space-x-2">
                          <span className={getResponseTimeColor(service.responseTime)}>
                            {service.responseTime}ms
                          </span>
                          {service.responseTime < 500 ? 
                            <TrendingUp className="w-4 h-4 text-green-500" /> :
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          }
                        </div>
                      </div>
                      <Progress 
                        value={Math.min((service.responseTime / 1000) * 100, 100)} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}