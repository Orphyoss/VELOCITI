import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { Activity, Zap, Clock, Database, Trash2, RefreshCw } from 'lucide-react';
import { streamingApi } from '@/services/streamingApi';

interface PerformanceStats {
  responseTime: number;
  cacheHitRate: number;
  activeSessions: number;
  apiHealth: Record<string, { status: string; responseTime: number }>;
}

interface CacheStats {
  size: number;
  keys: string[];
}

export function PerformanceMonitor() {
  const [cacheStats, setCacheStats] = useState<CacheStats>({ size: 0, keys: [] });
  
  const { data: performanceData, refetch } = useQuery({
    queryKey: ['/api/monitor/performance'],
    queryFn: async () => {
      const response = await fetch('/api/monitor/performance');
      if (!response.ok) throw new Error('Failed to fetch performance data');
      return response.json();
    },
    refetchInterval: 5000 // Update every 5 seconds
  });

  useEffect(() => {
    const fetchCacheStats = async () => {
      try {
        const stats = await streamingApi.getCacheStats();
        setCacheStats(stats);
      } catch (error) {
        console.error('Failed to fetch cache stats:', error);
      }
    };

    fetchCacheStats();
    const interval = setInterval(fetchCacheStats, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = async () => {
    try {
      await streamingApi.invalidateCache();
      setCacheStats({ size: 0, keys: [] });
      refetch();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const getHealthColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ok': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'down': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getHealthBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ok': return 'outline' as const;
      case 'degraded': return 'secondary' as const;
      case 'down': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-dark-50">Performance Monitor</h2>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Response Time */}
        <Card className="bg-dark-900 border-dark-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-dark-400 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-50">
              {performanceData?.responseTime ? `${performanceData.responseTime}ms` : '--'}
            </div>
            <Progress 
              value={performanceData?.responseTime ? Math.min(100, (performanceData.responseTime / 10000) * 100) : 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        {/* Cache Hit Rate */}
        <Card className="bg-dark-900 border-dark-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-dark-400 flex items-center">
              <Database className="w-4 h-4 mr-2" />
              Cache Hit Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-50">
              {performanceData?.cacheHitRate ? `${performanceData.cacheHitRate}%` : '--'}
            </div>
            <Progress 
              value={performanceData?.cacheHitRate || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="bg-dark-900 border-dark-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-dark-400 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-50">
              {performanceData?.activeSessions || 0}
            </div>
            <div className="text-xs text-dark-400 mt-2">
              Current connections
            </div>
          </CardContent>
        </Card>

        {/* Cache Size */}
        <Card className="bg-dark-900 border-dark-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-dark-400 flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Cache Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-50">
              {cacheStats.size}
            </div>
            <Button 
              onClick={handleClearCache}
              variant="outline" 
              size="sm" 
              className="mt-2 text-xs h-6"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear Cache
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* API Health Status */}
      <Card className="bg-dark-900 border-dark-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-dark-50">API Health Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceData?.apiHealth ? Object.entries(performanceData.apiHealth).map(([service, health]) => {
              const healthData = health as { status: string; responseTime: number };
              return (
                <div key={service} className="flex items-center justify-between p-3 bg-dark-800 rounded">
                  <div>
                    <div className="font-medium text-dark-100 capitalize">{service}</div>
                    <div className="text-xs text-dark-400">{healthData.responseTime}ms</div>
                  </div>
                  <Badge 
                    variant={getHealthBadgeVariant(healthData.status)}
                    className={getHealthColor(healthData.status)}
                  >
                    {healthData.status}
                  </Badge>
                </div>
              );
            }) : (
              <div className="col-span-4 text-center text-dark-400 py-8">
                No health data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cache Details */}
      {cacheStats.keys.length > 0 && (
        <Card className="bg-dark-900 border-dark-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-dark-50">Cache Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cacheStats.keys.slice(0, 10).map((key, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-dark-800 rounded text-sm">
                  <code className="text-green-400">{key}</code>
                  <Badge variant="outline" className="text-xs">
                    Cached
                  </Badge>
                </div>
              ))}
              {cacheStats.keys.length > 10 && (
                <div className="text-center text-dark-400 text-xs pt-2">
                  +{cacheStats.keys.length - 10} more entries
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}