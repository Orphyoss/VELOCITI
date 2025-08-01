import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Moon, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  Users, 
  DollarSign,
  Zap,
  Brain,
  Database,
  BarChart3,
  RefreshCw,
  Timer,
  Gauge,
  Star,
  Calendar
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Comprehensive metrics interfaces based on Telos framework
interface NightShiftMetrics {
  processingTime: {
    current: number;
    target: number;
    trend: 'up' | 'down' | 'stable';
    status: 'healthy' | 'warning' | 'critical';
  };
  systemPerformance: {
    availability: number;
    dataFreshness: number;
    errorRate: number;
    throughput: number;
  };
  aiAccuracy: {
    insightAccuracy: number;
    competitiveAlertPrecision: number;
    predictionConfidence: number;
    falsePositiveRate: number;
  };
  businessImpact: {
    analystTimeSavings: number;
    revenueImpact: number;
    competitiveResponseSpeed: number;
    decisionAccuracy: number;
  };
  userAdoption: {
    dailyActiveUsers: number;
    satisfactionScore: number;
    insightActionRate: number;
    retentionRate: number;
  };
  dataQuality: {
    completenessRate: number;
    accuracyScore: number;
    consistencyIndex: number;
    timelinessScore: number;
  };
}

interface ProcessingJob {
  id: string;
  type: string;
  status: 'running' | 'completed' | 'failed' | 'queued';
  startTime: string;
  endTime?: string;
  duration?: number;
  recordsProcessed: number;
  insights: number;
  errors: number;
}

interface BusinessRecommendation {
  id: string;
  category: 'performance' | 'quality' | 'efficiency' | 'adoption';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  expectedBenefit: string;
  timeline: string;
}

export default function NightShift() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const queryClient = useQueryClient();

  // Fetch comprehensive NightShift metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<NightShiftMetrics>({
    queryKey: ['/api/nightshift/metrics', selectedTimeRange],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch recent processing jobs
  const { data: processingJobs, isLoading: jobsLoading } = useQuery<ProcessingJob[]>({
    queryKey: ['/api/nightshift/jobs', selectedTimeRange],
    refetchInterval: 30000,
  });

  // Fetch business recommendations
  const { data: recommendations, isLoading: recsLoading } = useQuery<BusinessRecommendation[]>({
    queryKey: ['/api/nightshift/recommendations'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Manual refresh mutation
  const refreshMutation = useMutation({
    mutationFn: () => fetch('/api/nightshift/refresh', { method: 'POST' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nightshift'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getMetricStatus = (value: number, target: number, isHigherBetter = true) => {
    const ratio = value / target;
    if (isHigherBetter) {
      if (ratio >= 0.95) return 'healthy';
      if (ratio >= 0.85) return 'warning';
      return 'critical';
    } else {
      if (ratio <= 1.05) return 'healthy';
      if (ratio <= 1.15) return 'warning';
      return 'critical';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Moon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">NightShift Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive overnight processing metrics and business impact analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="border rounded px-3 py-2 bg-background"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            variant="outline"
          >
            {refreshMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {metrics ? formatDuration(metrics.processingTime.current) : '--'}
              </div>
              {metrics && getTrendIcon(metrics.processingTime.trend)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(metrics?.processingTime.status || 'unknown')}`} />
              <p className="text-xs text-muted-foreground">
                Target: {metrics ? formatDuration(metrics.processingTime.target) : '--'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? `${metrics.aiAccuracy.insightAccuracy.toFixed(1)}%` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Insight accuracy rate
            </p>
            <Progress 
              value={metrics?.aiAccuracy.insightAccuracy || 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatCurrency(metrics.businessImpact.revenueImpact) : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly impact from AI decisions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? `${metrics.userAdoption.satisfactionScore}` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Net Promoter Score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="impact">Business Impact</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* System Health Overview */}
            <Card>
              <CardHeader>
                <CardTitle>System Health Overview</CardTitle>
                <CardDescription>Real-time system performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">System Availability</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{metrics?.systemPerformance.availability.toFixed(2)}%</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                <Progress value={metrics?.systemPerformance.availability || 0} />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Data Freshness</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{metrics?.systemPerformance.dataFreshness.toFixed(1)}h</span>
                    <div className={`w-2 h-2 rounded-full ${
                      (metrics?.systemPerformance.dataFreshness || 0) < 2 ? 'bg-green-500' : 
                      (metrics?.systemPerformance.dataFreshness || 0) < 4 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Error Rate</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{metrics?.systemPerformance.errorRate.toFixed(2)}%</span>
                    <div className={`w-2 h-2 rounded-full ${
                      (metrics?.systemPerformance.errorRate || 0) < 1 ? 'bg-green-500' : 
                      (metrics?.systemPerformance.errorRate || 0) < 3 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Processing Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Processing Jobs</CardTitle>
                <CardDescription>Latest overnight processing activities</CardDescription>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : processingJobs && processingJobs.length > 0 ? (
                  <div className="space-y-3">
                    {processingJobs.slice(0, 6).map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{job.type}</div>
                          <div className="text-xs text-muted-foreground">
                            {job.recordsProcessed.toLocaleString()} records • {job.insights} insights
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant={
                            job.status === 'completed' ? 'default' :
                            job.status === 'running' ? 'secondary' :
                            job.status === 'failed' ? 'destructive' : 'outline'
                          }>
                            {job.status}
                          </Badge>
                          {job.duration && (
                            <div className="text-xs text-muted-foreground">
                              {formatDuration(job.duration)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent processing jobs
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Processing Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Average Processing Time</span>
                    <span>{metrics ? formatDuration(metrics.processingTime.current) : '--'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Target Time</span>
                    <span>{metrics ? formatDuration(metrics.processingTime.target) : '--'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Throughput</span>
                    <span>{metrics ? `${metrics.systemPerformance.throughput.toLocaleString()}/hr` : '--'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Competitive Response</span>
                    <span>{metrics ? `${metrics.businessImpact.competitiveResponseSpeed.toFixed(1)}h` : '--'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Target Response</span>
                    <span>4h</span>
                  </div>
                  <Progress 
                    value={metrics ? Math.max(0, 100 - (metrics.businessImpact.competitiveResponseSpeed / 4 * 100)) : 0} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Efficiency Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Time Savings</span>
                    <span>{metrics ? `${metrics.businessImpact.analystTimeSavings}min/day` : '--'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Decision Accuracy</span>
                    <span>{metrics ? `${metrics.businessImpact.decisionAccuracy.toFixed(1)}%` : '--'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Action Rate</span>
                    <span>{metrics ? `${metrics.userAdoption.insightActionRate.toFixed(1)}%` : '--'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Quality Metrics</CardTitle>
                <CardDescription>Accuracy and reliability of AI-generated insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Insight Accuracy</span>
                      <span>{metrics ? `${metrics.aiAccuracy.insightAccuracy.toFixed(1)}%` : '--'}</span>
                    </div>
                    <Progress value={metrics?.aiAccuracy.insightAccuracy || 0} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Alert Precision</span>
                      <span>{metrics ? `${metrics.aiAccuracy.competitiveAlertPrecision.toFixed(1)}%` : '--'}</span>
                    </div>
                    <Progress value={metrics?.aiAccuracy.competitiveAlertPrecision || 0} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Prediction Confidence</span>
                      <span>{metrics ? `${metrics.aiAccuracy.predictionConfidence.toFixed(1)}%` : '--'}</span>
                    </div>
                    <Progress value={metrics?.aiAccuracy.predictionConfidence || 0} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Quality Metrics</CardTitle>
                <CardDescription>Completeness and reliability of source data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Completeness Rate</span>
                      <span>{metrics ? `${metrics.dataQuality.completenessRate.toFixed(1)}%` : '--'}</span>
                    </div>
                    <Progress value={metrics?.dataQuality.completenessRate || 0} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Accuracy Score</span>
                      <span>{metrics ? `${metrics.dataQuality.accuracyScore.toFixed(1)}%` : '--'}</span>
                    </div>
                    <Progress value={metrics?.dataQuality.accuracyScore || 0} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Timeliness Score</span>
                      <span>{metrics ? `${metrics.dataQuality.timelinessScore.toFixed(1)}%` : '--'}</span>
                    </div>
                    <Progress value={metrics?.dataQuality.timelinessScore || 0} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Business Impact Tab */}
        <TabsContent value="impact" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Monthly Revenue Impact</span>
                    <span className="font-semibold text-green-600">
                      {metrics ? formatCurrency(metrics.businessImpact.revenueImpact) : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Target</span>
                    <span>£500K</span>
                  </div>
                  <Progress 
                    value={metrics ? Math.min(100, (metrics.businessImpact.revenueImpact / 500000) * 100) : 0} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Productivity Gains</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Daily Time Savings</span>
                    <span>{metrics ? `${metrics.businessImpact.analystTimeSavings}min` : '--'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Target</span>
                    <span>60min</span>
                  </div>
                  <Progress 
                    value={metrics ? Math.min(100, (metrics.businessImpact.analystTimeSavings / 60) * 100) : 0} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Daily Active Users</span>
                    <span>{metrics ? metrics.userAdoption.dailyActiveUsers : '--'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Retention Rate</span>
                    <span>{metrics ? `${metrics.userAdoption.retentionRate.toFixed(1)}%` : '--'}</span>
                  </div>
                  <Progress value={metrics?.userAdoption.retentionRate || 0} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Strategic Recommendations</CardTitle>
              <CardDescription>
                AI-generated recommendations for improving system performance and business impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : recommendations && recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{rec.title}</h3>
                        <div className="flex gap-2">
                          <Badge variant={
                            rec.priority === 'high' ? 'destructive' :
                            rec.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {rec.priority} priority
                          </Badge>
                          <Badge variant="outline">{rec.category}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="font-medium">Impact:</span> {rec.impact}
                        </div>
                        <div>
                          <span className="font-medium">Effort:</span> {rec.effort}
                        </div>
                        <div>
                          <span className="font-medium">Timeline:</span> {rec.timeline}
                        </div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded text-sm">
                        <strong>Expected Benefit:</strong> {rec.expectedBenefit}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recommendations available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}