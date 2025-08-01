import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plane, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  Users, 
  DollarSign,
  Calendar,
  BarChart3,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CompetitivePosition {
  routeId: string;
  pricingDate: string;
  easyjetAvgPrice: number;
  ryanairAvgPrice: number;
  priceGapPercent: number;
  marketPosition: string;
}

interface RoutePerformance {
  routeId: string;
  flightDate: string;
  loadFactor: number;
  revenueTotal: number;
  yieldPerPax: number;
  bookingsCount: number;
  performanceVsForecast: string;
}

interface IntelligenceAlert {
  id: string;
  alertType: string;
  priority: string;
  title: string;
  description: string;
  recommendation: string;
  routeId?: string;
  airlineCode?: string;
  confidenceScore: number;
  agentSource: string;
  insertDate: string;
}

interface IntelligenceSummary {
  totalRoutes: number;
  competitivePositions: number;
  performanceMetrics: number;
  demandSignals: number;
  insights: IntelligenceAlert[];
  marketEvents: any[];
}

export default function TelosIntelligence() {
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch intelligence summary
  const { data: summary, isLoading: summaryLoading } = useQuery<IntelligenceSummary>({
    queryKey: ['/api/telos/summary'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Fetch competitive positions
  const { data: competitive, isLoading: competitiveLoading } = useQuery<CompetitivePosition[]>({
    queryKey: ['/api/telos/competitive', { days: 7 }],
    enabled: true,
  });

  // Fetch route performance
  const { data: performance, isLoading: performanceLoading } = useQuery<RoutePerformance[]>({
    queryKey: ['/api/telos/performance', { days: 14 }],
    enabled: true,
  });

  // Fetch intelligence alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery<IntelligenceAlert[]>({
    queryKey: ['/api/telos/alerts'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch available routes
  const { data: routes } = useQuery<string[]>({
    queryKey: ['/api/telos/routes'],
  });

  // Run intelligence analysis
  const runAnalysisMutation = useMutation({
    mutationFn: () => fetch('/api/telos/run-analysis', { method: 'POST' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/telos'] });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case 'Above Forecast': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'Below Forecast': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Target className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Telos Intelligence Platform</h1>
          <p className="text-muted-foreground">
            AI-powered competitive intelligence and market analysis for EasyJet
          </p>
        </div>
        <Button
          onClick={() => runAnalysisMutation.mutate()}
          disabled={runAnalysisMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {runAnalysisMutation.isPending ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Activity className="h-4 w-4 mr-2" />
          )}
          Run Analysis
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Routes Monitored</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalRoutes || 0}</div>
            <p className="text-xs text-muted-foreground">Across European network</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Competitive Positions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.competitivePositions || 0}</div>
            <p className="text-xs text-muted-foreground">Price comparisons available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intelligence Insights</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.insights?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Generated today</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">Intelligence Alerts</TabsTrigger>
          <TabsTrigger value="competitive">Competitive Analysis</TabsTrigger>
          <TabsTrigger value="performance">Route Performance</TabsTrigger>
          <TabsTrigger value="insights">Strategic Insights</TabsTrigger>
        </TabsList>

        {/* Intelligence Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Intelligence Alerts</CardTitle>
              <CardDescription>
                Real-time alerts from Telos AI agents monitoring competitive dynamics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : alerts && alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <Alert key={alert.id} className="border-l-4 border-l-blue-500">
                      <AlertTriangle className="h-4 w-4" />
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{alert.title}</h4>
                            <Badge variant={getPriorityColor(alert.priority)}>
                              {alert.priority}
                            </Badge>
                            <Badge variant="outline">{alert.alertType}</Badge>
                          </div>
                          <AlertDescription className="text-sm">
                            {alert.description}
                          </AlertDescription>
                          <div className="text-xs text-muted-foreground flex items-center gap-4">
                            <span>Agent: {alert.agentSource}</span>
                            <span>Confidence: {(alert.confidenceScore * 100).toFixed(0)}%</span>
                            <span>Route: {alert.routeId || 'Network-wide'}</span>
                          </div>
                          {alert.recommendation && (
                            <div className="text-sm bg-blue-50 dark:bg-blue-950/20 p-2 rounded mt-2">
                              <strong>Recommendation:</strong> {alert.recommendation}
                            </div>
                          )}
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No active alerts at this time
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitive Analysis Tab */}
        <TabsContent value="competitive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Position Analysis</CardTitle>
              <CardDescription>
                Price comparison vs. major competitors across the EasyJet network
              </CardDescription>
            </CardHeader>
            <CardContent>
              {competitiveLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : competitive && competitive.length > 0 ? (
                <div className="space-y-4">
                  {competitive.slice(0, 15).map((position, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-semibold">{position.routeId}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(position.pricingDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-4">
                          <span className="text-sm">EasyJet: {formatCurrency(position.easyjetAvgPrice)}</span>
                          <span className="text-sm">Ryanair: {formatCurrency(position.ryanairAvgPrice)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={position.priceGapPercent > 10 ? 'destructive' : 
                                    position.priceGapPercent < -10 ? 'default' : 'secondary'}
                          >
                            {formatPercentage(position.priceGapPercent)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{position.marketPosition}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No competitive data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Route Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Route Performance Metrics</CardTitle>
              <CardDescription>
                Load factors, revenue, and yield performance across the network
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : performance && performance.length > 0 ? (
                <div className="space-y-4">
                  {performance.slice(0, 15).map((perf, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-semibold flex items-center gap-2">
                          {perf.routeId}
                          {getPerformanceIcon(perf.performanceVsForecast)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(perf.flightDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-4 text-sm">
                          <span>LF: {(perf.loadFactor * 100).toFixed(1)}%</span>
                          <span>Revenue: {formatCurrency(perf.revenueTotal)}</span>
                          <span>Yield: {formatCurrency(perf.yieldPerPax)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {perf.bookingsCount} bookings • {perf.performanceVsForecast}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No performance data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategic Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Strategic Intelligence Summary</CardTitle>
              <CardDescription>
                AI-generated insights and recommendations from the Telos platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : summary?.insights && summary.insights.length > 0 ? (
                <div className="space-y-6">
                  {summary.insights.map((insight) => (
                    <div key={insight.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{insight.title}</h3>
                        <div className="flex gap-2">
                          <Badge variant={getPriorityColor(insight.priority)}>
                            {insight.priority}
                          </Badge>
                          <Badge variant="outline">
                            {(insight.confidenceScore * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                      {insight.recommendation && (
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded text-sm">
                          <strong>Strategic Recommendation:</strong> {insight.recommendation}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>Generated by: {insight.agentSource}</span>
                        <span>{new Date(insight.insertDate).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No strategic insights available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}