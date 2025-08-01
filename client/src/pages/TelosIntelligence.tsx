import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
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
  RefreshCw,
  Timer,
  Zap,
  Eye,
  Shield,
  Clock,
  PoundSterling,
  Gauge
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import AppShell from '@/components/layout/AppShell';
import { useVelocitiStore } from '@/stores/useVelocitiStore';

interface CompetitivePosition {
  routeId: string;
  pricingDate: string;
  observationDate: string;
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

interface RMMetrics {
  revenueImpact: {
    daily: number;
    weekly: number;
    monthly: number;
    trend: number;
  };
  yieldOptimization: {
    currentYield: number;
    targetYield: number;
    improvement: number;
    topRoutes: Array<{route: string; yield: number; change: number}>;
  };
  competitiveIntelligence: {
    priceAdvantageRoutes: number;
    priceDisadvantageRoutes: number;
    responseTime: number;
    marketShare: number;
  };
  operationalEfficiency: {
    loadFactorVariance: number;
    demandPredictionAccuracy: number;
    bookingPaceVariance: number;
    capacityUtilization: number;
  };
  riskMetrics: {
    routesAtRisk: number;
    volatilityIndex: number;
    competitorThreats: number;
    seasonalRisks: number;
  };
}

export default function TelosIntelligence() {
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('24h');
  const queryClient = useQueryClient();
  const { setCurrentModule } = useVelocitiStore();

  useEffect(() => {
    setCurrentModule('telos');
  }, [setCurrentModule]);

  // Mock RM metrics data based on the comprehensive framework
  const rmMetrics: RMMetrics = {
    revenueImpact: {
      daily: 2847500,
      weekly: 19532500,
      monthly: 82450000,
      trend: 8.3
    },
    yieldOptimization: {
      currentYield: 127.45,
      targetYield: 135.20,
      improvement: 6.1,
      topRoutes: [
        { route: 'LGW→BCN', yield: 142.30, change: 12.4 },
        { route: 'LTN→AMS', yield: 138.75, change: 9.8 },
        { route: 'STN→DUB', yield: 135.90, change: 7.2 },
        { route: 'LGW→MAD', yield: 133.45, change: 5.6 },
        { route: 'LTN→FCO', yield: 131.20, change: 4.3 }
      ]
    },
    competitiveIntelligence: {
      priceAdvantageRoutes: 142,
      priceDisadvantageRoutes: 89,
      responseTime: 3.2,
      marketShare: 24.7
    },
    operationalEfficiency: {
      loadFactorVariance: 4.2,
      demandPredictionAccuracy: 91.3,
      bookingPaceVariance: 12.8,
      capacityUtilization: 87.9
    },
    riskMetrics: {
      routesAtRisk: 23,
      volatilityIndex: 15.7,
      competitorThreats: 7,
      seasonalRisks: 12
    }
  };

  // Fetch intelligence insights
  const { data: insights, isLoading: insightsLoading } = useQuery<IntelligenceAlert[]>({
    queryKey: ['/api/telos/insights'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Fetch competitive pricing
  const { data: competitive, isLoading: competitiveLoading } = useQuery({
    queryKey: ['/api/telos/competitive-pricing'],
    enabled: true,
  });

  // Fetch route dashboard
  const { data: routeDashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/telos/route-dashboard'],
    enabled: true,
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

  const getStatusColor = (value: number, target: number, warning: number) => {
    if (value >= target) return 'text-green-500';
    if (value >= warning) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRiskLevel = (value: number) => {
    if (value <= 10) return { level: 'Low', color: 'text-green-500' };
    if (value <= 20) return { level: 'Medium', color: 'text-yellow-500' };
    return { level: 'High', color: 'text-red-500' };
  };

  return (
    <AppShell>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Telos Intelligence Platform</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            AI-powered competitive intelligence and market analysis for EasyJet
          </p>
        </div>
        <Button
          onClick={() => runAnalysisMutation.mutate()}
          disabled={runAnalysisMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          size="sm"
        >
          {runAnalysisMutation.isPending ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Activity className="h-4 w-4 mr-2" />
          )}
          <span className="sm:inline">Run Analysis</span>
        </Button>
      </div>

      {/* Revenue Management KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <Card className="sm:col-span-2 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Daily Revenue Impact</CardTitle>
            <PoundSterling className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(rmMetrics.revenueImpact.daily)}</div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs text-muted-foreground">
              <span className="mb-1 sm:mb-0">Monthly: {formatCurrency(rmMetrics.revenueImpact.monthly)}</span>
              <Badge variant="default" className="bg-green-100 text-green-800 w-fit">
                {formatPercentage(rmMetrics.revenueImpact.trend)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Network Yield</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">£{rmMetrics.yieldOptimization.currentYield}</div>
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-muted-foreground">Target: £{rmMetrics.yieldOptimization.targetYield}</span>
              <TrendingUp className="h-3 w-3 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Competitive Edge</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{rmMetrics.competitiveIntelligence.priceAdvantageRoutes}</div>
            <div className="text-xs text-muted-foreground">
              vs {rmMetrics.competitiveIntelligence.priceDisadvantageRoutes} disadvantaged
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{rmMetrics.competitiveIntelligence.responseTime}h</div>
            <div className="text-xs text-muted-foreground">Average to competitor moves</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Prediction Accuracy</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{rmMetrics.operationalEfficiency.demandPredictionAccuracy}%</div>
            <div className="text-xs text-muted-foreground">Demand forecasting</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1">
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm">RM Dashboard</TabsTrigger>
          <TabsTrigger value="yield" className="text-xs sm:text-sm">Yield Opt.</TabsTrigger>
          <TabsTrigger value="competitive" className="text-xs sm:text-sm">Competitive</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs sm:text-sm">Performance</TabsTrigger>
          <TabsTrigger value="risk" className="text-xs sm:text-sm">Risk Mgmt</TabsTrigger>
        </TabsList>

        {/* RM Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            {/* Revenue Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PoundSterling className="h-5 w-5" />
                  Revenue Performance
                </CardTitle>
                <CardDescription>Real-time revenue and yield metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Current Yield</div>
                    <div className="text-xl sm:text-2xl font-bold">£{rmMetrics.yieldOptimization.currentYield}</div>
                    <Progress value={(rmMetrics.yieldOptimization.currentYield / rmMetrics.yieldOptimization.targetYield) * 100} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {((rmMetrics.yieldOptimization.currentYield / rmMetrics.yieldOptimization.targetYield) * 100).toFixed(1)}% of target
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Load Factor</div>
                    <div className="text-xl sm:text-2xl font-bold">{rmMetrics.operationalEfficiency.capacityUtilization}%</div>
                    <Progress value={rmMetrics.operationalEfficiency.capacityUtilization} className="h-2" />
                    <div className="text-xs text-muted-foreground">Network average</div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Top Performing Routes</h4>
                  <div className="space-y-2">
                    {rmMetrics.yieldOptimization.topRoutes.slice(0, 3).map((route, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                        <span className="font-medium">{route.route}</span>
                        <div className="text-right">
                          <div className="font-bold">£{route.yield}</div>
                          <div className="text-xs text-green-600">{formatPercentage(route.change)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Competitive Intelligence Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Competitive Position
                </CardTitle>
                <CardDescription>Market positioning and competitive dynamics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{rmMetrics.competitiveIntelligence.priceAdvantageRoutes}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Price Advantage Routes</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-red-600">{rmMetrics.competitiveIntelligence.priceDisadvantageRoutes}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Price Disadvantage Routes</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Market Share</span>
                    <span className="text-lg font-bold">{rmMetrics.competitiveIntelligence.marketShare}%</span>
                  </div>
                  <Progress value={rmMetrics.competitiveIntelligence.marketShare} className="h-2" />
                  
                  <div className="flex items-center justify-between mt-4 mb-2">
                    <span className="text-sm font-medium">Avg Response Time</span>
                    <span className="text-lg font-bold text-blue-600">{rmMetrics.competitiveIntelligence.responseTime}h</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Target: &lt; 4 hours | Excellent performance
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Management Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Risk Management
                </CardTitle>
                <CardDescription>Route risk assessment and mitigation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm">Routes at Risk</span>
                        <span className="font-bold text-red-600">{rmMetrics.riskMetrics.routesAtRisk}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm">Volatility Index</span>
                        <span className={`font-bold ${getRiskLevel(rmMetrics.riskMetrics.volatilityIndex).color}`}>
                          {rmMetrics.riskMetrics.volatilityIndex}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm">Competitor Threats</span>
                        <span className="font-bold text-orange-600">{rmMetrics.riskMetrics.competitorThreats}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm">Seasonal Risks</span>
                        <span className="font-bold text-yellow-600">{rmMetrics.riskMetrics.seasonalRisks}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-2">Risk Level Distribution</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">High Risk</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={15} className="w-20 h-2" />
                        <span className="text-xs font-medium">15%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Medium Risk</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={35} className="w-20 h-2" />
                        <span className="text-xs font-medium">35%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Low Risk</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={50} className="w-20 h-2" />
                        <span className="text-xs font-medium">50%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Operational Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Operational Efficiency
                </CardTitle>
                <CardDescription>System performance and prediction accuracy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm">Demand Prediction Accuracy</span>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{rmMetrics.operationalEfficiency.demandPredictionAccuracy}%</div>
                      <div className="text-xs text-muted-foreground">Target: &gt;90%</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm">Load Factor Variance</span>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">{rmMetrics.operationalEfficiency.loadFactorVariance}%</div>
                      <div className="text-xs text-muted-foreground">Lower is better</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm">Booking Pace Variance</span>
                    <div className="text-right">
                      <div className="font-bold text-yellow-600">{rmMetrics.operationalEfficiency.bookingPaceVariance}%</div>
                      <div className="text-xs text-muted-foreground">Weekly average</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Capacity Utilization</span>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{rmMetrics.operationalEfficiency.capacityUtilization}%</div>
                      <div className="text-xs text-muted-foreground">Network wide</div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-2">Efficiency Score</div>
                  <Progress value={88} className="h-3 mb-2" />
                  <div className="text-xs text-muted-foreground">
                    88/100 - Excellent performance across all metrics
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Yield Optimization Tab */}
        <TabsContent value="yield" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Route Yield Performance</CardTitle>
                <CardDescription>Yield optimization across top-performing routes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rmMetrics.yieldOptimization.topRoutes.map((route, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-semibold">{route.route}</div>
                        <div className="text-sm text-muted-foreground">Current yield performance</div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-xl font-bold">£{route.yield}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant={route.change > 10 ? 'default' : route.change > 5 ? 'secondary' : 'outline'}>
                            {formatPercentage(route.change)}
                          </Badge>
                          {route.change > 5 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Yield Targets</CardTitle>
                <CardDescription>Progress toward revenue targets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">£{rmMetrics.yieldOptimization.currentYield}</div>
                  <div className="text-muted-foreground">Current Network Yield</div>
                  <div className="mt-2">
                    <Progress 
                      value={(rmMetrics.yieldOptimization.currentYield / rmMetrics.yieldOptimization.targetYield) * 100} 
                      className="h-3" 
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {((rmMetrics.yieldOptimization.currentYield / rmMetrics.yieldOptimization.targetYield) * 100).toFixed(1)}% of £{rmMetrics.yieldOptimization.targetYield} target
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-3">Optimization Opportunities</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Price optimization</span>
                      <span className="text-green-600">+£2.3M</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Capacity reallocation</span>
                      <span className="text-green-600">+£1.8M</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dynamic pricing</span>
                      <span className="text-green-600">+£1.2M</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Competitive Intelligence Tab */}
        <TabsContent value="competitive" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Competitive Positioning Analysis</CardTitle>
                <CardDescription>EasyJet vs competitors across key routes</CardDescription>
              </CardHeader>
              <CardContent>
                {competitiveLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="animate-pulse bg-muted h-16 rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {competitive?.slice(0, 6).map((comp, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{comp.routeId}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(comp.observationDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-bold">
                            EasyJet: £{comp.easyjetAvgPrice?.toFixed(0) || 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            vs Ryanair: £{comp.ryanairAvgPrice?.toFixed(0) || 'N/A'}
                          </div>
                          <Badge variant={comp.marketPosition === 'Competitive' ? 'default' : 
                                       comp.marketPosition === 'Premium' ? 'secondary' : 'destructive'}>
                            {comp.marketPosition}
                          </Badge>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-muted-foreground">
                        No competitive data available
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Response Metrics</CardTitle>
                <CardDescription>Speed and effectiveness of competitive responses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Response Time</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">{rmMetrics.competitiveIntelligence.responseTime}h</div>
                      <div className="text-xs text-muted-foreground">Industry leader</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Market Share</span>
                    <div className="text-right">
                      <div className="text-xl font-bold">{rmMetrics.competitiveIntelligence.marketShare}%</div>
                      <Progress value={rmMetrics.competitiveIntelligence.marketShare} className="w-20 h-2 mt-1" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Price Optimization Rate</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">94.2%</div>
                      <div className="text-xs text-muted-foreground">Successfully optimized</div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-3">Competitive Threats</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Ryanair aggressive pricing</span>
                      <Badge variant="destructive">High</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Wizz Air capacity expansion</span>
                      <Badge variant="secondary">Medium</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>New LCC entrants</span>
                      <Badge variant="outline">Low</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Route Performance Analysis</CardTitle>
                <CardDescription>Load factor and revenue performance vs forecast</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="animate-pulse bg-muted h-16 rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {performance?.slice(0, 8).map((perf, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{perf.routeId}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(perf.flightDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Load Factor</div>
                            <div className="font-bold">{(perf.loadFactor * 100).toFixed(1)}%</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Revenue</div>
                            <div className="font-bold">{formatCurrency(perf.revenueTotal)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">vs Forecast</div>
                            <div className="flex items-center gap-1">
                              {getPerformanceIcon(perf.performanceVsForecast)}
                              <span className="text-sm">{perf.performanceVsForecast}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-muted-foreground">
                        No performance data available
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>Network-wide performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Network Load Factor</span>
                      <span className="font-bold">{rmMetrics.operationalEfficiency.capacityUtilization}%</span>
                    </div>
                    <Progress value={rmMetrics.operationalEfficiency.capacityUtilization} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Revenue vs Target</span>
                      <span className="font-bold text-green-600">103.2%</span>
                    </div>
                    <Progress value={103.2} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">On-time Performance</span>
                      <span className="font-bold">89.7%</span>
                    </div>
                    <Progress value={89.7} className="h-2" />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-3">Route Categories</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Above Forecast</span>
                      <span className="text-green-600 font-medium">127 routes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>On Target</span>
                      <span className="text-blue-600 font-medium">89 routes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Below Forecast</span>
                      <span className="text-red-600 font-medium">32 routes</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Risk Management Tab */}
        <TabsContent value="risk" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Route Risk Assessment</CardTitle>
                <CardDescription>Routes requiring immediate attention and monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { route: 'LGW→AGP', risk: 'High', reason: 'Competitor capacity increase', impact: '€2.3M' },
                    { route: 'STN→BVA', risk: 'High', reason: 'Demand volatility', impact: '€1.8M' },
                    { route: 'LTN→PMI', risk: 'Medium', reason: 'Seasonal demand shift', impact: '€1.2M' },
                    { route: 'LGW→FCO', risk: 'Medium', reason: 'Price pressure', impact: '€0.9M' },
                    { route: 'STN→BCN', risk: 'Medium', reason: 'Yield optimization needed', impact: '€0.7M' },
                    { route: 'LTN→MAD', risk: 'Low', reason: 'Monitoring required', impact: '€0.3M' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{item.route}</div>
                        <div className="text-sm text-muted-foreground">{item.reason}</div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={item.risk === 'High' ? 'destructive' : 
                                     item.risk === 'Medium' ? 'secondary' : 'outline'}>
                          {item.risk} Risk
                        </Badge>
                        <div className="text-sm font-medium">{item.impact}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Mitigation Dashboard</CardTitle>
                <CardDescription>Proactive risk management tools and insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{rmMetrics.riskMetrics.routesAtRisk}</div>
                    <div className="text-sm text-muted-foreground">High Risk Routes</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-lg font-bold text-orange-600">{rmMetrics.riskMetrics.competitorThreats}</div>
                      <div className="text-xs text-muted-foreground">Competitor Threats</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-lg font-bold text-yellow-600">{rmMetrics.riskMetrics.seasonalRisks}</div>
                      <div className="text-xs text-muted-foreground">Seasonal Risks</div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-3">Risk Mitigation Actions</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Price adjustments</span>
                      <Badge variant="outline">12 routes</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Capacity reallocation</span>
                      <Badge variant="outline">8 routes</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Enhanced monitoring</span>
                      <Badge variant="outline">23 routes</Badge>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-2">Overall Risk Score</div>
                  <Progress value={72} className="h-3 mb-2" />
                  <div className="text-xs text-muted-foreground">
                    72/100 - Moderate risk level, actively managed
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
    </AppShell>
  );
}