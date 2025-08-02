import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Clock, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, 
  Zap, BarChart3, Globe, Calendar, ArrowRight, RefreshCw, MessageSquare, 
  Download, Share2, Sunrise, X 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/services/api';
import { useVelocitiStore } from '@/stores/useVelocitiStore';

interface PriorityAction {
  id: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  title: string;
  description: string;
  recommendation: string;
  confidence: number;
  timeToAct: string;
  impact: string;
  routes: string[];
  competitor?: string;
}

interface BriefingData {
  date: string;
  processingTime: string;
  analyst: {
    name: string;
    role: string;
    routes: string[];
    focus: string;
  };
  executiveSummary: {
    status: 'ATTENTION_REQUIRED' | 'NORMAL';
    keyMessage: string;
    confidence: number;
  };
  priorityActions: PriorityAction[];
  competitiveIntelligence: {
    ryanairActivity: {
      priceChanges: number;
      routesAffected: string[];
      avgPriceChange: number;
      trend: string;
    };
    britishAirways: {
      priceChanges: number;
      routesAffected: string[];
      avgPriceChange: number;
      trend: string;
    };
    marketContext: string;
  };
  demandSignals: {
    searchGrowth: number;
    bookingGrowth: number;
    conversionRate: number;
    topPerformers: string[];
    concerns: string[];
  };
  rmActivity: {
    pricingActions: number;
    systemActions: number;
    manualActions: number;
    segmentFinderChanges: number;
    avgResponseTime: string;
  };
  routeInsights: Array<{
    route: string;
    status: 'ATTENTION' | 'OPPORTUNITY' | 'OPTIMAL';
    loadFactor: number;
    yield: number;
    competitorPressure: string;
    demandTrend: string;
    lastAction: string;
    recommendation: string;
  }>;
}

export default function MorningBriefing() {
  const { setCurrentModule } = useVelocitiStore();
  const [selectedInsight, setSelectedInsight] = useState<PriorityAction | null>(null);
  const [aiNarrative, setAiNarrative] = useState('');
  const [narrativeLoading, setNarrativeLoading] = useState(false);

  useEffect(() => {
    setCurrentModule('dashboard'); // Use existing module type
  }, [setCurrentModule]);

  // Fetch briefing data
  const { data: briefingData, isLoading } = useQuery({
    queryKey: ['/api/morning-briefing'],
    queryFn: async () => {
      // Since we don't have the backend implementation yet, generate realistic data
      // using our existing data sources
      const [alerts, activities] = await Promise.all([
        api.getAlerts('all', 10),
        api.getActivities()
      ]);

      return generateBriefingData(alerts, activities, {});
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const generateBriefingData = (alerts: any[], activities: any[], rmMetrics: any): BriefingData => {
    const today = new Date();
    
    // Convert alerts to priority actions
    const priorityActions: PriorityAction[] = alerts.slice(0, 3).map((alert, index) => ({
      id: alert.id,
      priority: alert.priority.toUpperCase() as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
      category: getActionCategory(alert.category),
      title: alert.title,
      description: alert.description,
      recommendation: generateRecommendation(alert),
      confidence: typeof alert.confidence === 'string' ? 
        parseFloat(alert.confidence) / 100 : alert.confidence || 0.85,
      timeToAct: getTimeToAct(alert.priority),
      impact: generateImpact(alert.priority),
      routes: alert.route ? [alert.route] : (index < 2 ? [['LGW-BCN', 'LGW-MAD'][index]] : ['Multiple']),
      competitor: alert.category === 'competitive' ? 'Ryanair' : undefined
    }));

    return {
      date: today.toISOString().split('T')[0],
      processingTime: today.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      analyst: {
        name: "Sarah Mitchell",
        role: "Revenue Management Analyst",
        routes: ["LGW-BCN", "LGW-MAD", "LGW-CDG", "LGW-FCO", "LGW-AMS"],
        focus: "European Short-haul Network"
      },
      executiveSummary: {
        status: priorityActions.some(a => a.priority === 'CRITICAL') ? 'ATTENTION_REQUIRED' : 'NORMAL',
        keyMessage: generateExecutiveSummary(priorityActions, rmMetrics),
        confidence: 0.89
      },
      priorityActions,
      competitiveIntelligence: {
        ryanairActivity: {
          priceChanges: 8,
          routesAffected: ["LGW-BCN", "STN-BCN", "LGW-MAD"],
          avgPriceChange: -18.5,
          trend: "AGGRESSIVE_PRICING"
        },
        britishAirways: {
          priceChanges: 3,
          routesAffected: ["LGW-CDG"],
          avgPriceChange: 5.2,
          trend: "STABLE"
        },
        marketContext: "Ryanair exhibiting unusual aggressive pricing pattern. 3x normal price change frequency."
      },
      demandSignals: {
        searchGrowth: 18.2,
        bookingGrowth: 14.7,
        conversionRate: 12.3,
        topPerformers: ["LGW-MAD", "LGW-CDG", "LGW-AMS"],
        concerns: ["LGW-FCO"]
      },
      rmActivity: {
        pricingActions: 23,
        systemActions: 18,
        manualActions: 5,
        segmentFinderChanges: 12,
        avgResponseTime: "3.2 hours"
      },
      routeInsights: [
        {
          route: "LGW-BCN",
          status: "ATTENTION",
          loadFactor: 78.5,
          yield: 89.2,
          competitorPressure: "HIGH",
          demandTrend: "STABLE",
          lastAction: "No pricing change in 48h",
          recommendation: "Immediate competitive review required"
        },
        {
          route: "LGW-MAD",
          status: "OPPORTUNITY",
          loadFactor: 85.3,
          yield: 94.1,
          competitorPressure: "LOW",
          demandTrend: "STRONG",
          lastAction: "Price increase +5% yesterday",
          recommendation: "Continue premium strategy"
        },
        {
          route: "LGW-CDG",
          status: "OPTIMAL",
          loadFactor: 81.7,
          yield: 91.8,
          competitorPressure: "MEDIUM",
          demandTrend: "STABLE",
          lastAction: "Segment Finder auto-adjust",
          recommendation: "Monitor and maintain"
        }
      ]
    };
  };

  const getActionCategory = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      'competitive': 'Competitive Response',
      'performance': 'Demand Optimization',
      'network': 'System Performance',
      'user_adoption': 'Revenue Optimization',
      'business_impact': 'Revenue Optimization'
    };
    return categoryMap[category] || 'System Performance';
  };

  const generateRecommendation = (alert: any): string => {
    const recommendations: { [key: string]: string } = {
      'competitive': 'Consider price matching on weekend flights. Maintain premium on weekday business travel.',
      'performance': 'Increase prices 8-12% for flights departing in next 2 weeks. Demand strength supports premium positioning.',
      'network': 'Review Segment Finder parameters and booking curve forecasts.',
      'user_adoption': 'Focus on user engagement improvements and training initiatives.',
      'business_impact': 'Implement immediate revenue protection measures and monitoring.'
    };
    return recommendations[alert.category] || 'Monitor situation and implement appropriate response measures.';
  };

  const getTimeToAct = (priority: string): string => {
    const timeMap: { [key: string]: string } = {
      'critical': '2 hours',
      'high': 'Today',
      'medium': 'This week',
      'low': 'Next week'
    };
    return timeMap[priority] || 'This week';
  };

  const generateImpact = (priority: string): string => {
    const impactMap: { [key: string]: string } = {
      'critical': '£75,000',
      'high': '£45,000',
      'medium': '£25,000',
      'low': '£10,000'
    };
    return impactMap[priority] || '£25,000';
  };

  const generateExecutiveSummary = (actions: PriorityAction[], rmMetrics: any): string => {
    const criticalCount = actions.filter(a => a.priority === 'CRITICAL').length;
    const competitiveActions = actions.filter(a => a.category === 'Competitive Response').length;
    
    if (criticalCount > 0) {
      return `${competitiveActions > 0 ? 'Competitive pressure detected' : 'Critical alerts identified'} requiring immediate attention. Strong demand signals (+18% YoY) present revenue optimization opportunities.`;
    }
    
    return "Standard market conditions with revenue optimization opportunities identified. All systems operating within normal parameters.";
  };

  const generateAINarrative = async (insight: PriorityAction) => {
    setNarrativeLoading(true);
    setSelectedInsight(insight);
    
    try {
      // Simulate Writer AI analysis with context-aware narrative
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const narrative = await generateContextualNarrative(insight);
      setAiNarrative(narrative);
    } catch (error) {
      setAiNarrative("Analysis service temporarily unavailable. Please try again.");
    } finally {
      setNarrativeLoading(false);
    }
  };

  const generateContextualNarrative = async (insight: PriorityAction): Promise<string> => {
    const narratives: { [key: string]: string } = {
      'Competitive Response': `**Competitive Intelligence Analysis - ${insight.competitor} Pricing Action**

Based on overnight monitoring, ${insight.competitor || 'competitor'} has executed a significant move on the ${insight.routes.join(', ')} route(s). This represents an unusual competitive action requiring immediate strategic response.

**Strategic Context**: ${insight.competitor || 'Competitor'} typically maintains predictable pricing patterns on these routes. The current action suggests either demand pressure or tactical market positioning.

**Revenue Impact Assessment**: 
- **Immediate Risk**: ${insight.impact} potential revenue loss if no response within ${insight.timeToAct}
- **Market Position**: EasyJet's premium LCC positioning allows selective response rather than full price matching
- **Route Characteristics**: These routes show strong business travel demand which is less price-sensitive

**Recommended Strategy**: ${insight.recommendation}

**Risk Assessment**: 
- **High**: Revenue loss if no action taken
- **Medium**: Margin compression if aggressive response implemented
- **Low**: Long-term competitive escalation given EasyJet's network strength

**Implementation**: Coordinate with Pricing team for immediate review. Monitor competitor response within 24 hours for tactical adjustments.`,

      'Demand Optimization': `**Demand Intelligence Analysis - ${insight.routes.join(', ')} Growth Opportunity**

Strong positive demand signals detected presenting clear revenue optimization opportunity. Market conditions support yield enhancement strategy.

**Demand Analysis**:
- **Route Performance**: ${insight.routes.join(', ')} showing exceptional demand strength
- **Market Context**: European demand recovering with business travel resilience
- **Competitive Environment**: Limited competitive pressure allows premium positioning

**Revenue Optimization Strategy**: ${insight.recommendation}

**Implementation Approach**:
1. **Immediate Pricing**: Implement recommended increases for departures within 2-week window
2. **Segment Strategy**: Higher increases for leisure segments, moderate for business travel
3. **Monitoring Protocol**: Track booking pace and conversion rates for demand response

**Expected Impact**: ${insight.impact} incremental revenue with minimal volume risk. Success validates expansion to similar routes.

**Risk Mitigation**: Gradual implementation allows for real-time demand monitoring and adjustment capability.`,

      'System Performance': `**Revenue Management System Analysis - Optimization Opportunity**

System performance analysis reveals calibration opportunity to enhance yield management effectiveness across monitored routes.

**Technical Analysis**: ${insight.description}

**System Recommendations**: ${insight.recommendation}

**Implementation Benefits**:
- Enhanced system automation reducing manual intervention requirements
- Improved forecast accuracy for better pricing decisions
- Optimized booking curve management for revenue maximization

**Expected Outcome**: ${insight.impact} revenue enhancement through improved system performance and reduced manual workload.

**Next Steps**: Collaborate with RM Systems team for parameter optimization and performance monitoring setup.`
    };

    return narratives[insight.category] || `**Strategic Analysis - ${insight.title}**

${insight.description}

**Recommendation**: ${insight.recommendation}

**Expected Impact**: ${insight.impact} with ${Math.round(insight.confidence * 100)}% confidence level.

**Implementation Timeline**: Action required within ${insight.timeToAct} for optimal results.`;
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'CRITICAL': return 'bg-red-50 border-red-200 text-red-800';
      case 'HIGH': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'CRITICAL': return <AlertTriangle className="w-4 h-4" />;
      case 'HIGH': return <TrendingUp className="w-4 h-4" />;
      case 'MEDIUM': return <Target className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getRouteStatusColor = (status: string) => {
    switch(status) {
      case 'ATTENTION': return 'bg-red-100 text-red-800';
      case 'OPPORTUNITY': return 'bg-green-100 text-green-800';
      case 'OPTIMAL': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-aviation-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-dark-50">Generating Your Morning Briefing</h2>
            <p className="text-dark-400">Processing overnight intelligence...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-dark-900 border border-dark-800 rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center">
                <Sunrise className="w-8 h-8 text-yellow-500 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-dark-50">Morning Briefing</h1>
                  <p className="text-sm text-dark-400">AI-Powered Revenue Intelligence</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-dark-50">
                  {new Date().toLocaleDateString('en-GB', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-xs text-dark-400">
                  Generated at {briefingData?.processingTime || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} GMT
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Analyst Context */}
        <Card className="bg-dark-900 border-dark-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-dark-50">
                  Good morning, {briefingData?.analyst.name}
                </h2>
                <p className="text-dark-300">{briefingData?.analyst.role} • {briefingData?.analyst.focus}</p>
                <p className="text-sm text-dark-400 mt-1">
                  Managing {briefingData?.analyst.routes.length} core routes: {briefingData?.analyst.routes.join(', ')}
                </p>
              </div>
              <div className="text-right">
                <Badge 
                  className={`${
                    briefingData?.executiveSummary.status === 'ATTENTION_REQUIRED' 
                      ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' 
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {briefingData?.executiveSummary.status === 'ATTENTION_REQUIRED' ? (
                    <AlertTriangle className="w-4 h-4 mr-1" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  )}
                  {briefingData?.executiveSummary.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Executive Summary */}
        <Card className="bg-gradient-to-r from-aviation-950 to-dark-900 border-aviation-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-dark-50 mb-3">Executive Summary</h3>
                <p className="text-dark-200 text-lg leading-relaxed">
                  {briefingData?.executiveSummary.keyMessage}
                </p>
                <div className="mt-4 flex items-center text-sm text-dark-400">
                  <Target className="w-4 h-4 mr-2" />
                  Confidence Score: {Math.round((briefingData?.executiveSummary.confidence || 0.89) * 100)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Priority Actions */}
          <div className="lg:col-span-2">
            <Card className="bg-dark-900 border-dark-800">
              <CardHeader className="border-b border-dark-800">
                <CardTitle className="text-dark-50">Priority Actions</CardTitle>
                <p className="text-sm text-dark-400 mt-1">Ranked by revenue impact and urgency</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-dark-800">
                  {briefingData?.priorityActions.map((action) => (
                    <div 
                      key={action.id} 
                      className="p-6 hover:bg-dark-800/50 transition-colors cursor-pointer"
                      onClick={() => generateAINarrative(action)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <Badge className={`mr-3 ${getPriorityColor(action.priority)}`}>
                            {getPriorityIcon(action.priority)}
                            <span className="ml-1">{action.priority}</span>
                          </Badge>
                          <span className="text-xs font-medium text-dark-400 uppercase tracking-wide">
                            {action.category}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-dark-50">{action.impact}</div>
                          <div className="text-xs text-dark-400">Potential Impact</div>
                        </div>
                      </div>
                      
                      <h4 className="text-base font-semibold text-dark-50 mb-2">{action.title}</h4>
                      <p className="text-dark-300 mb-3">{action.description}</p>
                      
                      <div className="bg-aviation-950/50 border-l-4 border-aviation-500 p-3 mb-4 rounded-r">
                        <p className="text-sm text-aviation-200">
                          <strong>Recommendation:</strong> {action.recommendation}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <span className="text-dark-400">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Act within: <strong className="text-dark-300">{action.timeToAct}</strong>
                          </span>
                          <span className="text-dark-400">
                            Confidence: <strong className="text-dark-300">{Math.round(action.confidence * 100)}%</strong>
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-aviation-400 hover:text-aviation-300">
                          Analyze with AI <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Intelligence Summary */}
          <div className="space-y-6">
            {/* Competitive Intelligence */}
            <Card className="bg-dark-900 border-dark-800">
              <CardHeader>
                <CardTitle className="text-dark-50">Competitive Intelligence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-red-400 pl-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-dark-50">Ryanair Activity</span>
                    <span className="text-red-400 font-semibold">
                      {briefingData?.competitiveIntelligence.ryanairActivity.priceChanges} changes
                    </span>
                  </div>
                  <p className="text-xs text-dark-400 mt-1">
                    Avg price change: {briefingData?.competitiveIntelligence.ryanairActivity.avgPriceChange}%
                  </p>
                </div>
                
                <div className="border-l-4 border-blue-400 pl-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-dark-50">British Airways</span>
                    <span className="text-blue-400 font-semibold">
                      {briefingData?.competitiveIntelligence.britishAirways.priceChanges} changes
                    </span>
                  </div>
                  <p className="text-xs text-dark-400 mt-1">
                    Avg price change: +{briefingData?.competitiveIntelligence.britishAirways.avgPriceChange}%
                  </p>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-800/50 rounded-lg">
                  <p className="text-sm text-yellow-200">
                    {briefingData?.competitiveIntelligence.marketContext}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Demand Signals */}
            <Card className="bg-dark-900 border-dark-800">
              <CardHeader>
                <CardTitle className="text-dark-50">Demand Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      +{briefingData?.demandSignals.searchGrowth}%
                    </div>
                    <div className="text-xs text-dark-400">Search Growth YoY</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      +{briefingData?.demandSignals.bookingGrowth}%
                    </div>
                    <div className="text-xs text-dark-400">Booking Growth YoY</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-dark-50">Top Performers:</span>
                    <div className="mt-1">
                      {briefingData?.demandSignals.topPerformers.map((route) => (
                        <Badge key={route} className="bg-green-900/30 text-green-300 mr-1 mb-1">
                          {route}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-dark-50">Watch List:</span>
                    <div className="mt-1">
                      {briefingData?.demandSignals.concerns.map((route) => (
                        <Badge key={route} className="bg-orange-900/30 text-orange-300 mr-1 mb-1">
                          {route}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RM Activity */}
            <Card className="bg-dark-900 border-dark-800">
              <CardHeader>
                <CardTitle className="text-dark-50">RM System Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-dark-400">Total Pricing Actions</span>
                  <span className="font-semibold text-dark-50">{briefingData?.rmActivity.pricingActions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-dark-400">System Automated</span>
                  <span className="font-semibold text-blue-400">{briefingData?.rmActivity.systemActions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-dark-400">Manual Actions</span>
                  <span className="font-semibold text-orange-400">{briefingData?.rmActivity.manualActions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-dark-400">Avg Response Time</span>
                  <span className="font-semibold text-dark-50">{briefingData?.rmActivity.avgResponseTime}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Narrative Panel */}
        {selectedInsight && (
          <Card className="bg-dark-900 border-dark-800">
            <CardHeader className="border-b border-dark-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-dark-50 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  AI Strategic Analysis
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedInsight(null)}
                  className="text-dark-400 hover:text-dark-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-dark-400 mt-1">
                Deep analysis powered by Writer AI with EasyJet domain knowledge
              </p>
            </CardHeader>
            
            <CardContent className="p-6">
              {narrativeLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-aviation-500 mr-3" />
                  <span className="text-dark-400">Generating strategic analysis...</span>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-line text-dark-200 leading-relaxed">
                    {aiNarrative}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Route Performance Summary */}
        <Card className="bg-dark-900 border-dark-800">
          <CardHeader className="border-b border-dark-800">
            <CardTitle className="text-dark-50">Route Performance Summary</CardTitle>
            <p className="text-sm text-dark-400 mt-1">Your core route portfolio overview</p>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-dark-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Load Factor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Yield</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Competitive Pressure</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Demand Trend</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {briefingData?.routeInsights.map((route) => (
                    <tr key={route.route} className="hover:bg-dark-800/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-50">
                        {route.route}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getRouteStatusColor(route.status)}>
                          {route.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                        {route.loadFactor.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                        {route.yield.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                        {route.competitorPressure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                        {route.demandTrend}
                      </td>
                      <td className="px-6 py-4 text-sm text-dark-300">
                        {route.recommendation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}