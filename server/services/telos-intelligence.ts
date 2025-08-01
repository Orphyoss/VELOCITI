/**
 * Telos Intelligence Platform - Data Consumption Framework
 * Integrates airline intelligence data into Velociti platform
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, gte, desc, and, sql } from 'drizzle-orm';

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
  performanceVsForecast: number;
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
const client = postgres(connectionString);
const db = drizzle(client);

/**
 * Core intelligence data access layer
 */
export class TelosIntelligenceService {
  
  /**
   * Get competitive positioning analysis for EasyJet routes
   */
  async getCompetitivePosition(routeId?: string, days: number = 7): Promise<CompetitivePosition[]> {
    try {
      const query = db
        .select({
          routeId: sql<string>`route_id`,
          observationDate: sql<string>`observation_date::text`,
          easyjetAvgPrice: sql<number>`easyjet_avg_price`,
          ryanairAvgPrice: sql<number>`ryanair_avg_price`,
          priceGapPercent: sql<number>`
            CASE 
              WHEN easyjet_avg_price IS NOT NULL AND ryanair_avg_price IS NOT NULL 
              THEN ROUND(((easyjet_avg_price - ryanair_avg_price) / ryanair_avg_price * 100), 2)
              ELSE NULL 
            END
          `,
          competitorCount: sql<number>`competitor_count`
        })
        .from(sql`easyjet_competitive_position`)
        .where(sql`observation_date >= CURRENT_DATE - INTERVAL '${days} days'`)
        .orderBy(sql`observation_date DESC, route_id`);

      if (routeId) {
        query.where(sql`route_id = ${routeId}`);
      }

      const results = await query;

      return results.map(row => ({
        ...row,
        marketPosition: this.determineMarketPosition(row.priceGapPercent)
      }));

    } catch (error) {
      console.error('Failed to get competitive position:', error);
      throw error;
    }
  }

  /**
   * Get route performance metrics
   */
  async getRoutePerformance(routeId?: string, days: number = 14): Promise<RoutePerformance[]> {
    try {
      const whereClause = routeId 
        ? sql`WHERE flight_date >= CURRENT_DATE - INTERVAL '${days} days' AND route_id = ${routeId}`
        : sql`WHERE flight_date >= CURRENT_DATE - INTERVAL '${days} days'`;

      const results = await db.execute(sql`
        SELECT 
          route_id as "routeId",
          flight_date::text as "flightDate",
          load_factor as "loadFactor",
          revenue_total as "revenueTotal",
          yield_per_pax as "yieldPerPax", 
          bookings_count as "bookingsCount"
        FROM flight_performance
        ${whereClause}
        ORDER BY flight_date DESC
      `);

      return results.rows.map((row: any) => ({
        ...row,
        loadFactor: parseFloat(row.loadFactor) || 0,
        revenueTotal: parseFloat(row.revenueTotal) || 0,
        yieldPerPax: parseFloat(row.yieldPerPax) || 0,
        bookingsCount: parseInt(row.bookingsCount) || 0,
        performanceVsForecast: this.calculatePerformanceVsForecast(parseFloat(row.loadFactor) || 0)
      }));

    } catch (error) {
      console.error('Failed to get route performance:', error);
      throw error;
    }
  }

  /**
   * Get demand intelligence and search trends
   */
  async getDemandIntelligence(routeId?: string, days: number = 30): Promise<DemandIntelligence[]> {
    try {
      const whereClause = routeId 
        ? sql`WHERE search_date >= CURRENT_DATE - INTERVAL '${days} days' AND route_id = ${routeId}`
        : sql`WHERE search_date >= CURRENT_DATE - INTERVAL '${days} days'`;

      const results = await db.execute(sql`
        SELECT 
          route_id as "routeId",
          search_date::text as "searchDate",
          search_volume as "searchVolume",
          booking_volume as "bookingVolume",
          conversion_rate as "conversionRate",
          search_volume - LAG(search_volume, 7) OVER (
            PARTITION BY route_id 
            ORDER BY search_date
          ) as "trendIndicator"
        FROM web_search_data
        ${whereClause}
        ORDER BY search_date DESC
      `);

      return results.rows.map((row: any) => ({
        routeId: row.routeId,
        searchDate: row.searchDate,
        searchVolume: parseInt(row.searchVolume) || 0,
        bookingVolume: parseInt(row.bookingVolume) || 0,
        conversionRate: parseFloat(row.conversionRate) || 0,
        demandTrend: this.determineDemandTrend(row.trendIndicator),
        trendStrength: Math.abs(row.trendIndicator || 0) / (parseInt(row.searchVolume) || 1)
      }));

    } catch (error) {
      console.error('Failed to get demand intelligence:', error);
      throw error;
    }
  }

  /**
   * Get active intelligence alerts and insights
   */
  async getIntelligenceAlerts(priority?: string, agentSource?: string): Promise<IntelligenceAlert[]> {
    try {
      let whereConditions = [`insight_date >= CURRENT_DATE - INTERVAL '7 days'`, `action_taken = false`];
      
      if (priority) {
        whereConditions.push(`priority_level = '${priority}'`);
      }
      if (agentSource) {
        whereConditions.push(`agent_source = '${agentSource}'`);
      }

      const results = await db.execute(sql`
        SELECT 
          insight_id::text as "id",
          CASE 
            WHEN insight_type = 'Alert' THEN 'competitive'
            WHEN insight_type = 'Opportunity' THEN 'performance'
            WHEN insight_type = 'Trend' THEN 'demand'
            ELSE 'external'
          END as "alertType",
          priority_level as "priority",
          title,
          description,
          recommendation,
          route_id as "routeId",
          airline_code as "airlineCode",
          confidence_score as "confidenceScore",
          agent_source as "agentSource",
          supporting_data as "supportingData",
          insight_date::text as "insertDate"
        FROM intelligence_insights
        WHERE ${sql.raw(whereConditions.join(' AND '))}
        ORDER BY 
          CASE priority_level
            WHEN 'Critical' THEN 1
            WHEN 'High' THEN 2
            WHEN 'Medium' THEN 3
            ELSE 4
          END,
          confidence_score DESC
      `);

      return results.rows.map((row: any) => ({
        id: row.id,
        alertType: row.alertType,
        priority: row.priority,
        title: row.title,
        description: row.description,
        recommendation: row.recommendation,
        routeId: row.routeId,
        airlineCode: row.airlineCode,
        confidenceScore: parseFloat(row.confidenceScore) || 0,
        agentSource: row.agentSource,
        supportingData: row.supportingData || {},
        insertDate: row.insertDate
      }));

    } catch (error) {
      console.error('Failed to get intelligence alerts:', error);
      throw error;
    }
  }

  /**
   * Generate daily intelligence dashboard summary
   */
  async getDailyIntelligenceSummary() {
    try {
      const [
        competitiveAlerts,
        performanceMetrics,
        demandTrends,
        marketEvents,
        recentInsights
      ] = await Promise.all([
        this.getCompetitivePosition(undefined, 1),
        this.getRoutePerformance(undefined, 1),
        this.getDemandIntelligence(undefined, 7),
        this.getMarketEvents(7),
        this.getIntelligenceAlerts()
      ]);

      return {
        summary: {
          totalRoutes: new Set([
            ...competitiveAlerts.map(a => a.routeId),
            ...performanceMetrics.map(p => p.routeId)
          ]).size,
          activeAlerts: recentInsights.filter(i => i.priority === 'Critical' || i.priority === 'High').length,
          competitivePositions: competitiveAlerts.length,
          performanceMetrics: performanceMetrics.length,
          demandSignals: demandTrends.length
        },
        competitive: {
          alerts: competitiveAlerts.filter(cp => 
            cp.priceGapPercent && Math.abs(cp.priceGapPercent) > 15
          ),
          averagePriceGap: this.calculateAveragePriceGap(competitiveAlerts)
        },
        performance: {
          metrics: performanceMetrics,
          averageLoadFactor: performanceMetrics.reduce((acc, p) => acc + p.loadFactor, 0) / performanceMetrics.length || 0,
          totalRevenue: performanceMetrics.reduce((acc, p) => acc + p.revenueTotal, 0)
        },
        demand: {
          trends: demandTrends.slice(0, 10), // Top 10 recent trends
          overallTrend: this.calculateOverallDemandTrend(demandTrends)
        },
        insights: recentInsights.slice(0, 15), // Top 15 most recent/important
        marketEvents: marketEvents.slice(0, 5) // Recent market events
      };

    } catch (error) {
      console.error('Failed to generate daily intelligence summary:', error);
      throw error;
    }
  }

  /**
   * Get market events affecting operations
   */
  async getMarketEvents(days: number = 7) {
    try {
      const results = await db.execute(sql`
        SELECT *
        FROM market_events
        WHERE event_date >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY event_date DESC
      `);

      return results.rows;

    } catch (error) {
      console.error('Failed to get market events:', error);
      throw error;
    }
  }

  /**
   * Process and store new intelligence insight
   */
  async storeIntelligenceInsight(insight: Omit<IntelligenceAlert, 'id' | 'insertDate'>) {
    try {
      const insightType = insight.alertType === 'competitive' ? 'Alert' : 
                         insight.alertType === 'performance' ? 'Opportunity' : 'Trend';

      const result = await db.execute(sql`
        INSERT INTO intelligence_insights (
          insight_date, insight_type, priority_level, route_id, airline_code,
          title, description, recommendation, confidence_score, 
          supporting_data, agent_source, action_taken
        ) VALUES (
          ${new Date()}, ${insightType}, ${insight.priority}, ${insight.routeId}, ${insight.airlineCode},
          ${insight.title}, ${insight.description}, ${insight.recommendation}, ${insight.confidenceScore},
          ${JSON.stringify(insight.supportingData)}, ${insight.agentSource}, ${false}
        )
        RETURNING insight_id
      `);

      console.log(`Stored new intelligence insight: ${insight.title}`);
      return result.rows[0];

    } catch (error) {
      console.error('Failed to store intelligence insight:', error);
      throw error;
    }
  }

  // Helper methods
  private determineMarketPosition(priceGapPercent: number | null): 'Leading' | 'Competitive' | 'Behind' {
    if (!priceGapPercent) return 'Competitive';
    if (priceGapPercent > 10) return 'Behind';
    if (priceGapPercent < -5) return 'Leading';
    return 'Competitive';
  }

  private calculatePerformanceVsForecast(loadFactor: number): number {
    // Simplified calculation - in reality would compare against forecast data
    const forecastLoadFactor = 0.80; // Assume 80% target
    return ((loadFactor - forecastLoadFactor) / forecastLoadFactor) * 100;
  }

  private determineDemandTrend(trendIndicator: number | null): 'Increasing' | 'Stable' | 'Decreasing' {
    if (!trendIndicator) return 'Stable';
    if (trendIndicator > 50) return 'Increasing';
    if (trendIndicator < -50) return 'Decreasing';
    return 'Stable';
  }

  private calculateAveragePriceGap(positions: CompetitivePosition[]): number {
    const validGaps = positions.filter(p => p.priceGapPercent !== null);
    if (validGaps.length === 0) return 0;
    return validGaps.reduce((acc, p) => acc + (p.priceGapPercent || 0), 0) / validGaps.length;
  }

  private calculateOverallDemandTrend(trends: DemandIntelligence[]): 'Increasing' | 'Stable' | 'Decreasing' {
    const increasingCount = trends.filter(t => t.demandTrend === 'Increasing').length;
    const decreasingCount = trends.filter(t => t.demandTrend === 'Decreasing').length;
    
    if (increasingCount > decreasingCount * 1.5) return 'Increasing';
    if (decreasingCount > increasingCount * 1.5) return 'Decreasing';
    return 'Stable';
  }
}

export const telosIntelligence = new TelosIntelligenceService();