/**
 * Telos AI Intelligence Agents
 * Specialized agents for competitive, performance, and demand analysis
 */

import { telosIntelligenceService } from './telos-intelligence.js';
import OpenAI from 'openai';

export interface AgentAnalysisResult {
  agentName: string;
  insights: IntelligenceAlert[];
  processingTime: number;
  dataPointsAnalyzed: number;
  confidenceLevel: number;
}

/**
 * Competitive Intelligence Agent
 * Monitors competitor pricing and market positioning
 */
export class CompetitiveIntelligenceAgent {
  private readonly agentName = 'Competitive Intelligence Agent';

  async analyzeCompetitivePosition(): Promise<AgentAnalysisResult> {
    const startTime = Date.now();
    const insights: IntelligenceAlert[] = [];

    try {
      // Get recent competitive data
      const competitivePositions = await telosIntelligenceService.getCompetitivePosition('LGW-BCN');
      
      // Analyze for significant competitive movements
      for (const position of competitivePositions) {
        if (position.priceGapPercent && Math.abs(position.priceGapPercent) > 15) {
          const insight = await this.generateCompetitiveInsight(position);
          if (insight) {
            insights.push(insight);
          }
        }
      }

      // Generate AI-enhanced competitive analysis
      if (insights.length > 0) {
        const enhancedInsights = await this.enhanceWithAI(insights, competitivePositions);
        insights.push(...enhancedInsights);
      }

      const processingTime = Date.now() - startTime;
      
      return {
        agentName: this.agentName,
        insights,
        processingTime,
        dataPointsAnalyzed: competitivePositions.length,
        confidenceLevel: this.calculateOverallConfidence(insights)
      };

    } catch (error) {
      console.error(`${this.agentName} analysis failed:`, error);
      throw error;
    }
  }

  private async generateCompetitiveInsight(position: any): Promise<IntelligenceAlert | null> {
    try {
      const priority = Math.abs(position.priceGapPercent) > 25 ? 'Critical' : 
                      Math.abs(position.priceGapPercent) > 20 ? 'High' : 'Medium';

      const title = position.priceGapPercent > 0 
        ? `Price Disadvantage Alert - ${position.route_id}`
        : `Competitive Price Advantage - ${position.route_id}`;

      const description = `EasyJet is ${Math.abs(position.priceGapPercent).toFixed(1)}% ${
        position.priceGapPercent > 0 ? 'above' : 'below'
      } Ryanair pricing on ${position.route_id}. ${
        position.easyjetAvgPrice ? `EasyJet: €${position.easyjetAvgPrice.toFixed(0)}` : ''
      }, ${
        position.ryanairAvgPrice ? `Ryanair: €${position.ryanairAvgPrice.toFixed(0)}` : ''
      }`;

      const recommendation = position.priceGapPercent > 15 
        ? `Monitor booking pace impact. Consider price adjustment if load factors decline.`
        : `Maintain competitive advantage while monitoring competitor response.`;

      return {
        id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        alertType: 'competitive',
        priority,
        title,
        description,
        recommendation,
        routeId: position.route_id,
        airlineCode: 'RYR',
        confidenceScore: 0.85 + (Math.abs(position.priceGapPercent) * 0.005),
        agentSource: this.agentName,
        supportingData: {
          priceGapPercent: position.priceGapPercent,
          easyjetPrice: position.easyjetAvgPrice,
          ryanairPrice: position.ryanairAvgPrice,
          observation_date: position.observation_date,
          competitorCount: position.competitorCount
        },
        insertDate: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to generate competitive insight:', error);
      return null;
    }
  }

  private async enhanceWithAI(insights: IntelligenceAlert[], positions: any[]): Promise<IntelligenceAlert[]> {
    try {
      if (!process.env.OPENAI_API_KEY) return [];

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const analysisPrompt = `
Analyze the following competitive intelligence data for EasyJet:

Competitive Positions:
${JSON.stringify(positions.slice(0, 10), null, 2)}

Current Insights:
${JSON.stringify(insights.map(i => ({ title: i.title, priority: i.priority, routeId: i.route_id })), null, 2)}

Provide strategic analysis in JSON format:
{
  "strategicRecommendations": "Overall competitive strategy recommendations",
  "riskAssessment": "Assessment of competitive risks",
  "opportunityAnalysis": "Competitive opportunities identified",
  "confidenceLevel": 0.0-1.0
}
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a senior airline revenue management analyst specializing in European LCC competitive dynamics.' },
          { role: 'user', content: analysisPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      const strategicInsight: IntelligenceAlert = {
        id: `strategic_${Date.now()}`,
        alertType: 'competitive',
        priority: 'Medium',
        title: 'Strategic Competitive Analysis',
        description: analysis.strategicRecommendations || 'AI-generated strategic analysis',
        recommendation: analysis.opportunityAnalysis || 'Monitor competitive developments',
        confidenceScore: analysis.confidenceLevel || 0.75,
        agentSource: `${this.agentName} (AI-Enhanced)`,
        supportingData: {
          riskAssessment: analysis.riskAssessment,
          opportunityAnalysis: analysis.opportunityAnalysis,
          analysisDate: new Date().toISOString()
        },
        insertDate: new Date().toISOString()
      };

      return [strategicInsight];

    } catch (error) {
      console.error('AI enhancement failed:', error);
      return [];
    }
  }

  private calculateOverallConfidence(insights: IntelligenceAlert[]): number {
    if (insights.length === 0) return 0;
    return insights.reduce((acc, insight) => acc + insight.confidence_score, 0) / insights.length;
  }
}

/**
 * Performance Intelligence Agent
 * Monitors route performance against forecasts and historical trends
 */
export class PerformanceIntelligenceAgent {
  private readonly agentName = 'Performance Intelligence Agent';

  async analyzeRoutePerformance(): Promise<AgentAnalysisResult> {
    const startTime = Date.now();
    const insights: IntelligenceAlert[] = [];

    try {
      // Get recent performance data
      const performances = await telosIntelligence.getRoutePerformance(undefined, 7);
      
      // Analyze for performance anomalies
      for (const performance of performances) {
        if (Math.abs(performance.performanceVsForecast) > 10) {
          const insight = await this.generatePerformanceInsight(performance);
          if (insight) {
            insights.push(insight);
          }
        }
      }

      const processingTime = Date.now() - startTime;
      
      return {
        agentName: this.agentName,
        insights,
        processingTime,
        dataPointsAnalyzed: performances.length,
        confidenceLevel: this.calculateOverallConfidence(insights)
      };

    } catch (error) {
      console.error(`${this.agentName} analysis failed:`, error);
      throw error;
    }
  }

  private async generatePerformanceInsight(performance: any): Promise<IntelligenceAlert | null> {
    try {
      const isUnderperforming = performance.performanceVsForecast < -10;
      const priority = Math.abs(performance.performanceVsForecast) > 20 ? 'High' : 'Medium';

      const title = isUnderperforming 
        ? `Underperformance Alert - ${performance.route_id}`
        : `Strong Performance - ${performance.route_id}`;

      const description = `Route ${performance.route_id} is performing ${
        Math.abs(performance.performanceVsForecast).toFixed(1)
      }% ${isUnderperforming ? 'below' : 'above'} forecast. Load factor: ${
        (performance.load_factor * 100).toFixed(1)
      }%, Revenue: €${performance.revenueTotal.toFixed(0)}`;

      const recommendation = isUnderperforming 
        ? `Investigate booking pace and consider yield adjustments or promotional activity.`
        : `Maintain pricing strategy and monitor for capacity optimization opportunities.`;

      return {
        id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        alertType: 'performance',
        priority,
        title,
        description,
        recommendation,
        routeId: performance.route_id,
        confidenceScore: 0.80 + (Math.abs(performance.performanceVsForecast) * 0.01),
        agentSource: this.agentName,
        supportingData: {
          loadFactor: performance.load_factor,
          revenueTotal: performance.revenueTotal,
          yieldPerPax: performance.yieldPerPax,
          performanceVsForecast: performance.performanceVsForecast,
          flight_date: performance.flight_date
        },
        insertDate: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to generate performance insight:', error);
      return null;
    }
  }

  private calculateOverallConfidence(insights: IntelligenceAlert[]): number {
    if (insights.length === 0) return 0;
    return insights.reduce((acc, insight) => acc + insight.confidence_score, 0) / insights.length;
  }
}

/**
 * Demand Intelligence Agent
 * Monitors search trends and booking patterns
 */
export class DemandIntelligenceAgent {
  private readonly agentName = 'Demand Intelligence Agent';

  async analyzeDemandTrends(): Promise<AgentAnalysisResult> {
    const startTime = Date.now();
    const insights: IntelligenceAlert[] = [];

    try {
      // Get recent demand data
      const demandTrends = await telosIntelligence.getDemandIntelligence(undefined, 14);
      
      // Analyze for significant demand changes
      for (const trend of demandTrends) {
        if (trend.trendStrength > 0.2 && trend.demandTrend !== 'Stable') {
          const insight = await this.generateDemandInsight(trend);
          if (insight) {
            insights.push(insight);
          }
        }
      }

      const processingTime = Date.now() - startTime;
      
      return {
        agentName: this.agentName,
        insights,
        processingTime,
        dataPointsAnalyzed: demandTrends.length,
        confidenceLevel: this.calculateOverallConfidence(insights)
      };

    } catch (error) {
      console.error(`${this.agentName} analysis failed:`, error);
      throw error;
    }
  }

  private async generateDemandInsight(trend: any): Promise<IntelligenceAlert | null> {
    try {
      const isIncreasing = trend.demandTrend === 'Increasing';
      const priority = trend.trendStrength > 0.4 ? 'High' : 'Medium';

      const title = `Demand ${trend.demandTrend} - ${trend.route_id}`;

      const description = `Search volume is ${trend.demandTrend.toLowerCase()} on ${trend.route_id}. ` +
        `Current volume: ${trend.searchVolume}, Conversion rate: ${(trend.conversionRate * 100).toFixed(1)}%`;

      const recommendation = isIncreasing 
        ? `Consider yield optimization or capacity adjustments to capture increased demand.`
        : `Monitor booking pace and consider promotional activity to stimulate demand.`;

      return {
        id: `demand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        alertType: 'demand',
        priority,
        title,
        description,
        recommendation,
        routeId: trend.route_id,
        confidenceScore: 0.75 + (trend.trendStrength * 0.2),
        agentSource: this.agentName,
        supportingData: {
          searchVolume: trend.searchVolume,
          bookingVolume: trend.bookingVolume,
          conversionRate: trend.conversionRate,
          demandTrend: trend.demandTrend,
          trendStrength: trend.trendStrength,
          searchDate: trend.searchDate
        },
        insertDate: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to generate demand insight:', error);
      return null;
    }
  }

  private calculateOverallConfidence(insights: IntelligenceAlert[]): number {
    if (insights.length === 0) return 0;
    return insights.reduce((acc, insight) => acc + insight.confidence_score, 0) / insights.length;
  }
}

// Export agent instances
export const competitiveAgent = new CompetitiveIntelligenceAgent();
export const performanceAgent = new PerformanceIntelligenceAgent();
export const demandAgent = new DemandIntelligenceAgent();

/**
 * Telos Agent Orchestrator
 * Coordinates all intelligence agents and manages analysis scheduling
 */
export class TelosAgentOrchestrator {
  async runIntelligenceAnalysis(): Promise<{
    competitive: AgentAnalysisResult;
    performance: AgentAnalysisResult;
    demand: AgentAnalysisResult;
    totalInsights: number;
    overallConfidence: number;
  }> {
    try {
      console.log('Starting Telos intelligence analysis...');

      // Run all agents in parallel for efficiency
      const [competitive, performance, demand] = await Promise.all([
        competitiveAgent.analyzeCompetitivePosition(),
        performanceAgent.analyzeRoutePerformance(),
        demandAgent.analyzeDemandTrends()
      ]);

      // Store new insights in database
      const allInsights = [
        ...competitive.insights,
        ...performance.insights,
        ...demand.insights
      ];

      for (const insight of allInsights) {
        await telosIntelligence.storeIntelligenceInsight(insight);
      }

      const totalInsights = allInsights.length;
      const overallConfidence = totalInsights > 0 
        ? allInsights.reduce((acc, insight) => acc + insight.confidence_score, 0) / totalInsights
        : 0;

      console.log(`Telos analysis complete: ${totalInsights} insights generated with ${(overallConfidence * 100).toFixed(1)}% average confidence`);

      return {
        competitive,
        performance,
        demand,
        totalInsights,
        overallConfidence
      };

    } catch (error) {
      console.error('Telos intelligence analysis failed:', error);
      throw error;
    }
  }
}

export const telosOrchestrator = new TelosAgentOrchestrator();