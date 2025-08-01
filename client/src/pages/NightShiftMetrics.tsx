import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Timer, 
  Activity, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Users,
  DollarSign,
  Star,
  Gauge
} from 'lucide-react';

// Metrics Categories from Telos Framework
export const METRIC_CATEGORIES = {
  SYSTEM_PERFORMANCE: "System Performance",
  AI_ACCURACY: "AI Accuracy & Quality", 
  BUSINESS_IMPACT: "Business Impact & ROI",
  USER_ADOPTION: "User Adoption & Satisfaction",
  DATA_QUALITY: "Data Quality & Reliability",
  OPERATIONAL_EFFICIENCY: "Operational Efficiency"
};

// Core Metrics Registry based on specification
export const TELOS_METRICS_REGISTRY = {
  // System Performance Metrics
  nightshift_processing_time: {
    name: "NightShift Processing Time",
    category: METRIC_CATEGORIES.SYSTEM_PERFORMANCE,
    description: "Total time for overnight intelligence processing to complete",
    target: "< 45 minutes",
    warning: "60 minutes", 
    critical: "90 minutes",
    impact: "Longer processing delays morning briefings and reduces analyst productivity",
    unit: "minutes"
  },
  
  system_availability: {
    name: "System Availability",
    category: METRIC_CATEGORIES.SYSTEM_PERFORMANCE,
    description: "Percentage of time system is operational and accessible",
    target: "> 99.9%",
    warning: "99.5%",
    critical: "99.0%",
    impact: "System downtime directly impacts analyst productivity and decision-making capability",
    unit: "percentage"
  },
  
  data_freshness: {
    name: "Data Freshness",
    category: METRIC_CATEGORIES.DATA_QUALITY,
    description: "Time elapsed since last successful data update from external sources",
    target: "< 2 hours",
    warning: "4 hours",
    critical: "8 hours",
    impact: "Stale data leads to outdated insights and poor decision-making",
    unit: "hours"
  },
  
  // AI Accuracy Metrics
  insight_accuracy_rate: {
    name: "AI Insight Accuracy Rate",
    category: METRIC_CATEGORIES.AI_ACCURACY,
    description: "Percentage of AI-generated insights validated as accurate by analysts",
    target: "> 85%",
    warning: "80%",
    critical: "75%",
    impact: "Low accuracy erodes analyst trust and reduces system adoption",
    unit: "percentage"
  },
  
  competitive_alert_precision: {
    name: "Competitive Alert Precision",
    category: METRIC_CATEGORIES.AI_ACCURACY,
    description: "Percentage of competitive alerts that are actionable and accurate",
    target: "> 80%",
    warning: "70%",
    critical: "60%",
    impact: "False competitive alerts waste analyst time and create alert fatigue",
    unit: "percentage"
  },
  
  // Business Impact Metrics
  analyst_time_savings: {
    name: "Analyst Time Savings per Day",
    category: METRIC_CATEGORIES.BUSINESS_IMPACT,
    description: "Minutes saved per analyst through automated intelligence vs manual analysis",
    target: "> 60 minutes/day",
    warning: "< 45 minutes/day",
    critical: "< 30 minutes/day",
    impact: "Time savings directly correlate to productivity gains and ROI",
    unit: "minutes"
  },
  
  revenue_impact_tracking: {
    name: "Revenue Impact from AI Decisions",
    category: METRIC_CATEGORIES.BUSINESS_IMPACT,
    description: "Estimated revenue impact from decisions driven by AI insights",
    target: "> €500K/month",
    warning: "< €300K/month", 
    critical: "< €200K/month",
    impact: "Revenue impact validates ROI and justifies platform investment",
    unit: "currency"
  },
  
  competitive_response_speed: {
    name: "Competitive Response Speed",
    category: METRIC_CATEGORIES.BUSINESS_IMPACT,
    description: "Average time from competitor price change to EasyJet response action",
    target: "< 4 hours",
    warning: "> 8 hours",
    critical: "> 24 hours",
    impact: "Faster competitive response protects market share and revenue",
    unit: "hours"
  },
  
  // User Adoption Metrics
  daily_active_users: {
    name: "Daily Active Users",
    category: METRIC_CATEGORIES.USER_ADOPTION,
    description: "Number of unique analysts using the system daily",
    target: "> 90% of target analysts",
    warning: "< 80%",
    critical: "< 70%",
    impact: "Low adoption reduces ROI and indicates user experience issues",
    unit: "count"
  },
  
  user_satisfaction_score: {
    name: "User Satisfaction Score (NPS)",
    category: METRIC_CATEGORIES.USER_ADOPTION,
    description: "Net Promoter Score based on analyst feedback surveys",
    target: "> 50 NPS",
    warning: "< 30 NPS",
    critical: "< 10 NPS",
    impact: "User satisfaction drives adoption and long-term success",
    unit: "score"
  },
  
  insight_action_rate: {
    name: "Insight Action Rate",
    category: METRIC_CATEGORIES.USER_ADOPTION,
    description: "Percentage of AI insights that result in analyst action",
    target: "> 60%",
    warning: "< 50%",
    critical: "< 40%",
    impact: "Low action rate indicates insights are not valuable or actionable",
    unit: "percentage"
  },
  
  // Data Quality Metrics
  data_completeness_rate: {
    name: "Data Completeness Rate",
    category: METRIC_CATEGORIES.DATA_QUALITY,
    description: "Percentage of expected data records received from external sources",
    target: "> 95%",
    warning: "< 90%",
    critical: "< 85%",
    impact: "Incomplete data leads to biased insights and missed opportunities",
    unit: "percentage"
  },
  
  data_accuracy_score: {
    name: "External Data Accuracy Score",
    category: METRIC_CATEGORIES.DATA_QUALITY,
    description: "Accuracy of external data validated against known benchmarks",
    target: "> 98%",
    warning: "< 95%",
    critical: "< 92%",
    impact: "Inaccurate source data propagates errors through all AI insights",
    unit: "percentage"
  },
  
  // Operational Efficiency Metrics
  alert_fatigue_index: {
    name: "Alert Fatigue Index",
    category: METRIC_CATEGORIES.OPERATIONAL_EFFICIENCY,
    description: "Ratio of actionable alerts to total alerts generated",
    target: "< 1.5",
    warning: "> 2.0",
    critical: "> 3.0",
    impact: "Too many alerts create fatigue and reduce analyst responsiveness",
    unit: "ratio"
  },
  
  insight_generation_cost: {
    name: "Cost per Insight Generated",
    category: METRIC_CATEGORIES.OPERATIONAL_EFFICIENCY,
    description: "Total system cost divided by number of insights generated",
    target: "< €5 per insight",
    warning: "> €8 per insight",
    critical: "> €12 per insight",
    impact: "High cost per insight reduces platform profitability and scalability",
    unit: "currency"
  }
};

interface MetricCardProps {
  metric: any;
  value: number;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

export function MetricCard({ metric, value, trend, className }: MetricCardProps) {
  const getStatusColor = (value: number, metric: any) => {
    const target = parseFloat(metric.target.replace(/[^\d.]/g, ''));
    const warning = parseFloat(metric.warning.replace(/[^\d.]/g, ''));
    const critical = parseFloat(metric.critical.replace(/[^\d.]/g, ''));
    
    if (metric.target.includes('>')) {
      if (value >= target) return 'text-green-600 bg-green-50';
      if (value >= warning) return 'text-yellow-600 bg-yellow-50';
      return 'text-red-600 bg-red-50';
    } else {
      if (value <= target) return 'text-green-600 bg-green-50';
      if (value <= warning) return 'text-yellow-600 bg-yellow-50';
      return 'text-red-600 bg-red-50';
    }
  };
  
  const getIcon = (category: string) => {
    switch (category) {
      case METRIC_CATEGORIES.SYSTEM_PERFORMANCE: return <Activity className="h-4 w-4" />;
      case METRIC_CATEGORIES.AI_ACCURACY: return <Target className="h-4 w-4" />;
      case METRIC_CATEGORIES.BUSINESS_IMPACT: return <DollarSign className="h-4 w-4" />;
      case METRIC_CATEGORIES.USER_ADOPTION: return <Users className="h-4 w-4" />;
      case METRIC_CATEGORIES.DATA_QUALITY: return <Database className="h-4 w-4" />;
      default: return <Gauge className="h-4 w-4" />;
    }
  };
  
  const formatValue = (value: number, unit: string) => {
    switch (unit) {
      case 'percentage': return `${value.toFixed(1)}%`;
      case 'currency': return `€${(value / 1000).toFixed(0)}K`;
      case 'hours': return `${value.toFixed(1)}h`;
      case 'minutes': return `${value.toFixed(0)}m`;
      case 'score': return value.toFixed(0);
      case 'ratio': return value.toFixed(2);
      default: return value.toLocaleString();
    }
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
        {getIcon(metric.category)}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            {formatValue(value, metric.unit)}
          </div>
          {trend && getTrendIcon(trend)}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge className={getStatusColor(value, metric)} variant="outline">
            Target: {metric.target}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {metric.description}
        </p>
      </CardContent>
    </Card>
  );
}

interface MetricDetailProps {
  metric: any;
  value: number;
  historical?: number[];
  className?: string;
}

export function MetricDetail({ metric, value, historical, className }: MetricDetailProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {metric.name}
          <Badge variant="outline">{metric.category}</Badge>
        </CardTitle>
        <CardDescription>{metric.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Current Value</span>
            <span className="font-semibold">
              {metric.unit === 'percentage' ? `${value.toFixed(1)}%` :
               metric.unit === 'currency' ? `€${(value / 1000).toFixed(0)}K` :
               metric.unit === 'hours' ? `${value.toFixed(1)}h` :
               metric.unit === 'minutes' ? `${value.toFixed(0)}m` :
               value.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Target</span>
            <span className="text-green-600">{metric.target}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Warning</span>
            <span className="text-yellow-600">{metric.warning}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Critical</span>
            <span className="text-red-600">{metric.critical}</span>
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <h4 className="text-sm font-medium mb-2">Business Impact</h4>
          <p className="text-sm text-muted-foreground">{metric.impact}</p>
        </div>
        
        {historical && historical.length > 0 && (
          <div className="pt-2 border-t">
            <h4 className="text-sm font-medium mb-2">7-Day Trend</h4>
            <div className="h-8 flex items-end gap-1">
              {historical.slice(-7).map((val, idx) => (
                <div 
                  key={idx}
                  className="bg-blue-200 dark:bg-blue-800 flex-1 rounded-sm"
                  style={{ height: `${(val / Math.max(...historical)) * 100}%` }}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function NightShiftMetrics() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const categories = Object.values(METRIC_CATEGORIES);
  
  const filteredMetrics = selectedCategory === 'all' 
    ? Object.entries(TELOS_METRICS_REGISTRY)
    : Object.entries(TELOS_METRICS_REGISTRY).filter(([_, metric]) => 
        metric.category === selectedCategory
      );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Telos Metrics Registry</h2>
          <p className="text-muted-foreground">
            Comprehensive metrics framework for monitoring AI-driven airline intelligence
          </p>
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">All Metrics</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category} value={category} className="text-xs">
              {category.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          <div className="grid gap-4">
            {filteredMetrics.map(([key, metric]) => (
              <MetricDetail
                key={key}
                metric={metric}
                value={85} // Sample value
                historical={[82, 84, 83, 85, 87, 86, 85]}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}