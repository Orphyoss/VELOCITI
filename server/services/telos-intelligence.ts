/**
 * Telos Intelligence Platform - Data Consumption Framework
 * Integrates airline intelligence data into Velociti platform
 * Enhanced with comprehensive logging and error handling
 */

import postgres from 'postgres';

// Data Models and Types
export interface CompetitivePosition {
  routeId: string;
  observationDate: string;
  easyjetAvgPrice: number | null;
  ryanairAvgPrice: number | null;
  priceGapPercent: number | null;
  competitorCount: number;
  marketPosition: 'Leading' | 'Competitive' | 'Behind';
}

export interface RoutePerformance {
  routeId: string;
  flightDate: string;
  loadFactor: number;
  revenueTotal: number;
  yieldPerPax: number;
  bookingsCount: number;
  performanceVsForecast: string;
}

export interface DemandIntelligence {
  routeId: string;
  searchDate: string;
  searchVolume: number;
  bookingVolume: number;
  conversionRate: number;
  demandTrend: 'Increasing' | 'Stable' | 'Decreasing';
  trendStrength: number;
}

export interface IntelligenceAlert {
  id: string;
  alertType: 'competitive' | 'performance' | 'demand' | 'external';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  title: string;
  description: string;
  recommendation: string;
  routeId?: string;
  airlineCode?: string;
  confidenceScore: number;
  agentSource: string;
  supportingData: Record<string, any>;
  insertDate: string;
}

// Database connection
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, {
  onnotice: () => {}, // Suppress NOTICE messages
  debug: false
});

/**
 * Core intelligence data access layer with enhanced error handling
 */
export class TelosIntelligenceService {
  
  /**
   * Get competitive positioning analysis for EasyJet routes
   */
  async getCompetitivePosition(routeId?: string, days: number = 7): Promise<CompetitivePosition[]> {
    console.log(`[TelosIntelligence] getCompetitivePosition called with routeId: ${routeId}, days: ${days}`);
    
    try {
      let sqlQuery = `
        SELECT 
          route_id,
          observation_date::text,
          easyjet_avg_price,
          ryanair_avg_price,
          CASE 
            WHEN easyjet_avg_price IS NOT NULL AND ryanair_avg_price IS NOT NULL AND ryanair_avg_price > 0
            THEN ROUND(((easyjet_avg_price - ryanair_avg_price) / ryanair_avg_price * 100), 2)
            ELSE NULL 
          END as price_gap_percent,
          competitor_count
        FROM easyjet_competitive_position
        WHERE observation_date >= CURRENT_DATE - INTERVAL '${days} days'
      `;

      const params: any[] = [];
      if (routeId && routeId !== 'undefined') {
        sqlQuery += ` AND route_id = $1`;
        params.push(routeId);
      }

      sqlQuery += ` ORDER BY observation_date DESC, route_id LIMIT 1000`;

      console.log(`[TelosIntelligence] Executing SQL query: ${sqlQuery.substring(0, 200)}...`);
      const results = await client.unsafe(sqlQuery, params);

      console.log(`[TelosIntelligence] Retrieved ${results.length} competitive position records`);

      return results.map((row: any) => ({
        routeId: row.route_id || '',
        observationDate: row.observation_date || '',
        easyjetAvgPrice: this.safeParseFloat(row.easyjet_avg_price),
        ryanairAvgPrice: this.safeParseFloat(row.ryanair_avg_price),
        priceGapPercent: this.safeParseFloat(row.price_gap_percent),
        competitorCount: this.safeParseInt(row.competitor_count),
        marketPosition: this.determineMarketPosition(this.safeParseFloat(row.price_gap_percent))
      }));

    } catch (error) {
      console.error('[TelosIntelligence] Failed to get competitive position:', error);
      // Return empty array instead of throwing to maintain app stability
      return [];
    }
  }

  /**
   * Get route performance metrics
   */
  async getRoutePerformance(routeId?: string, days: number = 14): Promise<RoutePerformance[]> {
    console.log(`[TelosIntelligence] getRoutePerformance called with routeId: ${routeId}, days: ${days}`);
    
    try {
      let sqlQuery = `
        SELECT 
          route_id,
          flight_date::text,
          load_factor,
          revenue_total,
          yield_per_pax, 
          bookings_count
        FROM flight_performance
        WHERE flight_date >= CURRENT_DATE - INTERVAL '${days} days'
      `;

      const params: any[] = [];
      if (routeId && routeId !== 'undefined') {
        sqlQuery += ` AND route_id = $1`;
        params.push(routeId);
      }

      sqlQuery += ` ORDER BY flight_date DESC LIMIT 1000`;

      console.log(`[TelosIntelligence] Executing performance query: ${sqlQuery.substring(0, 200)}...`);
      const results = await client.unsafe(sqlQuery, params);

      console.log(`[TelosIntelligence] Retrieved ${results.length} performance records`);

      return results.map((row: any) => ({
        routeId: row.route_id || '',
        flightDate: row.flight_date || '',
        loadFactor: this.safeParseFloat(row.load_factor),
        revenueTotal: this.safeParseFloat(row.revenue_total),
        yieldPerPax: this.safeParseFloat(row.yield_per_pax),
        bookingsCount: this.safeParseInt(row.bookings_count),
        performanceVsForecast: this.calculatePerformanceVsForecast(this.safeParseFloat(row.load_factor))
      }));

    } catch (error) {
      console.error('[TelosIntelligence] Failed to get route performance:', error);
      // Return empty array instead of throwing to maintain app stability
      return [];
    }
  }

  /**
   * Get demand intelligence and search trends
   */
  async getDemandIntelligence(routeId?: string, days: number = 30): Promise<DemandIntelligence[]> {
    console.log(`[TelosIntelligence] getDemandIntelligence called with routeId: ${routeId}, days: ${days}`);
    
    try {
      let sqlQuery = `
        SELECT 
          route_id,
          search_date::text,
          search_volume,
          booking_volume,
          conversion_rate,
          search_volume - LAG(search_volume, 7) OVER (
            PARTITION BY route_id 
            ORDER BY search_date
          ) as trend_indicator
        FROM web_search_data
        WHERE search_date >= CURRENT_DATE - INTERVAL '${days} days'
      `;

      const params: any[] = [];
      if (routeId && routeId !== 'undefined') {
        sqlQuery += ` AND route_id = $1`;
        params.push(routeId);
      }

      sqlQuery += ` ORDER BY search_date DESC LIMIT 1000`;

      console.log(`[TelosIntelligence] Executing demand query: ${sqlQuery.substring(0, 200)}...`);
      const results = await client.unsafe(sqlQuery, params);

      console.log(`[TelosIntelligence] Retrieved ${results.length} demand intelligence records`);

      return results.map((row: any) => ({
        routeId: row.route_id || '',
        searchDate: row.search_date || '',
        searchVolume: this.safeParseInt(row.search_volume),
        bookingVolume: this.safeParseInt(row.booking_volume),
        conversionRate: this.safeParseFloat(row.conversion_rate),
        demandTrend: this.determineDemandTrend(this.safeParseFloat(row.trend_indicator)),
        trendStrength: Math.abs(this.safeParseFloat(row.trend_indicator)) / Math.max(this.safeParseInt(row.search_volume), 1)
      }));

    } catch (error) {
      console.error('[TelosIntelligence] Failed to get demand intelligence:', error);
      // Return empty array instead of throwing to maintain app stability
      return [];
    }
  }

  /**
   * Get active intelligence alerts and insights
   */
  async getIntelligenceAlerts(priority?: string, agentSource?: string): Promise<IntelligenceAlert[]> {
    console.log(`[TelosIntelligence] getIntelligenceAlerts called with priority: ${priority}, agentSource: ${agentSource}`);
    
    try {
      let sqlQuery = `
        SELECT 
          insight_id::text as id,
          CASE 
            WHEN insight_type = 'Alert' THEN 'competitive'
            WHEN insight_type = 'Opportunity' THEN 'performance'
            WHEN insight_type = 'Trend' THEN 'demand'
            ELSE 'external'
          END as alert_type,
          priority_level as priority,
          title,
          description,
          recommendation,
          route_id,
          airline_code,
          confidence_score,
          agent_source,
          supporting_data,
          insight_date::text as insert_date
        FROM intelligence_insights
        WHERE insight_date >= CURRENT_DATE - INTERVAL '7 days' AND action_taken = false
      `;

      const params: any[] = [];
      if (priority) {
        sqlQuery += ` AND priority_level = $${params.length + 1}`;
        params.push(priority);
      }
      if (agentSource) {
        sqlQuery += ` AND agent_source = $${params.length + 1}`;
        params.push(agentSource);
      }

      sqlQuery += ` ORDER BY insight_date DESC, priority_level DESC LIMIT 100`;

      console.log(`[TelosIntelligence] Executing alerts query: ${sqlQuery.substring(0, 200)}...`);
      const results = await client.unsafe(sqlQuery, params);

      console.log(`[TelosIntelligence] Retrieved ${results.length} intelligence alerts`);

      return results.map((row: any) => ({
        id: row.id || '',
        alertType: row.alert_type || 'external',
        priority: row.priority || 'Low',
        title: row.title || '',
        description: row.description || '',
        recommendation: row.recommendation || '',
        routeId: row.route_id,
        airlineCode: row.airline_code,
        confidenceScore: this.safeParseFloat(row.confidence_score),
        agentSource: row.agent_source || '',
        supportingData: this.safeParseSupportingData(row.supporting_data),
        insertDate: row.insert_date || ''
      }));

    } catch (error) {
      console.error('[TelosIntelligence] Failed to get intelligence alerts:', error);
      // Return empty array instead of throwing to maintain app stability
      return [];
    }
  }

  /**
   * Generate daily intelligence dashboard summary
   */
  async getDailyIntelligenceSummary() {
    console.log('[TelosIntelligence] Generating daily intelligence summary');
    
    try {
      const [
        competitivePositions,
        performanceMetrics,
        demandTrends,
        recentInsights
      ] = await Promise.all([
        this.getCompetitivePosition(undefined, 1),
        this.getRoutePerformance(undefined, 1),
        this.getDemandIntelligence(undefined, 7),
        this.getIntelligenceAlerts()
      ]);

      const uniqueRoutes = new Set([
        ...competitivePositions.map(a => a.routeId),
        ...performanceMetrics.map(p => p.routeId)
      ]);

      const summary = {
        totalRoutes: uniqueRoutes.size,
        competitivePositions: competitivePositions.length,
        performanceMetrics: performanceMetrics.length,
        demandSignals: demandTrends.length,
        insights: recentInsights.slice(0, 10), // Top 10 recent insights
        marketEvents: [] // Placeholder for market events
      };

      console.log(`[TelosIntelligence] Generated summary with ${summary.totalRoutes} routes`);
      return summary;

    } catch (error) {
      console.error('[TelosIntelligence] Failed to generate daily intelligence summary:', error);
      // Return minimal summary instead of throwing
      return {
        totalRoutes: 0,
        competitivePositions: 0,
        performanceMetrics: 0,
        demandSignals: 0,
        insights: [],
        marketEvents: []
      };
    }
  }

  /**
   * Helper methods with enhanced error handling
   */
  private determineMarketPosition(priceGapPercent: number | null): 'Leading' | 'Competitive' | 'Behind' {
    try {
      if (priceGapPercent === null || isNaN(priceGapPercent)) return 'Competitive';
      if (priceGapPercent > 10) return 'Behind'; // EasyJet more expensive
      if (priceGapPercent < -10) return 'Leading'; // EasyJet cheaper
      return 'Competitive'; // Within 10% range
    } catch (error) {
      console.error('[TelosIntelligence] Error determining market position:', error);
      return 'Competitive';
    }
  }

  private calculatePerformanceVsForecast(loadFactor: number): string {
    try {
      // Simplified calculation - typically based on historical averages and forecasts
      if (isNaN(loadFactor) || loadFactor < 0) return 'Below Forecast';
      if (loadFactor > 0.85) return 'Above Forecast';
      if (loadFactor < 0.70) return 'Below Forecast';
      return 'On Forecast';
    } catch (error) {
      console.error('[TelosIntelligence] Error calculating performance vs forecast:', error);
      return 'On Forecast';
    }
  }

  private determineDemandTrend(trendIndicator: number | null): 'Increasing' | 'Stable' | 'Decreasing' {
    try {
      if (!trendIndicator || isNaN(trendIndicator)) return 'Stable';
      if (trendIndicator > 1000) return 'Increasing';
      if (trendIndicator < -1000) return 'Decreasing';
      return 'Stable';
    } catch (error) {
      console.error('[TelosIntelligence] Error determining demand trend:', error);
      return 'Stable';
    }
  }

  private safeParseFloat(value: any): number {
    try {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    } catch (error) {
      return 0;
    }
  }

  private safeParseInt(value: any): number {
    try {
      const parsed = parseInt(value);
      return isNaN(parsed) ? 0 : parsed;
    } catch (error) {
      return 0;
    }
  }

  private safeParseSupportingData(value: any): Record<string, any> {
    try {
      if (typeof value === 'string') {
        return JSON.parse(value);
      }
      if (typeof value === 'object' && value !== null) {
        return value;
      }
      return {};
    } catch (error) {
      return {};
    }
  }
}

// Export singleton instance
export const telosIntelligence = new TelosIntelligenceService();