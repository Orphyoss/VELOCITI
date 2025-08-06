// Telos Intelligence Platform - Data Service
// Provides analytics and insights for airline revenue management

import { db } from './supabase';
import { desc, eq, gte, lte, and, count, avg, sum, sql } from "drizzle-orm";
import {
  competitive_pricing,
  market_capacity,
  web_search_data,
  flight_performance,
  intelligence_insights,
  routes,
  airlines
} from "../../shared/schema";

export class TelosIntelligenceService {
  // Get competitive pricing analysis for a route
  async getCompetitivePricingAnalysis(routeId: string, days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
      const results = await db
        .select({
          airlineCode: competitive_pricing.airline_code,
          avgPrice: sql<string>`AVG(${competitive_pricing.price_amount})`,
          minPrice: sql<string>`MIN(${competitive_pricing.price_amount})`,
          maxPrice: sql<string>`MAX(${competitive_pricing.price_amount})`,
          observationCount: count()
        })
        .from(competitive_pricing)
        .where(
          and(
            eq(competitive_pricing.route_id, routeId),
            gte(competitive_pricing.observation_date, cutoffDate.toISOString().slice(0, 10))
          )
        )
        .groupBy(competitive_pricing.airline_code)
        .orderBy(desc(sql`AVG(${competitive_pricing.price_amount})`));

      return results;
    } catch (error) {
      console.error("Error in getCompetitivePricingAnalysis:", error);
      return [];
    }
  }

  // Get market capacity analysis for a route
  async getMarketCapacityAnalysis(routeId: string, days: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
      const results = await db
        .select({
          airlineCode: market_capacity.airline_code,
          totalFlights: sum(market_capacity.num_flights),
          total_seats: sum(market_capacity.num_seats),
          avgFlightsPerDay: sql<number>`${sum(market_capacity.num_flights)} / ${days}`
        })
        .from(market_capacity)
        .where(
          and(
            eq(market_capacity.route_id, routeId),
            gte(market_capacity.flight_date, cutoffDate.toISOString().slice(0, 10))
          )
        )
        .groupBy(market_capacity.airline_code)
        .orderBy(desc(sql`SUM(${market_capacity.num_seats})`));

      return results;
    } catch (error) {
      console.error("Error in getMarketCapacityAnalysis:", error);
      return [];
    }
  }

  // Get route performance metrics (calculated from competitive pricing and market capacity data)
  async getRoutePerformanceMetrics(routeId: string, days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
      // Get EasyJet's pricing performance
      const ezyPricing = await db
        .select({
          avgPrice: sql<string>`AVG(${competitive_pricing.price_amount})`,
          minPrice: sql<string>`MIN(${competitive_pricing.price_amount})`,
          maxPrice: sql<string>`MAX(${competitive_pricing.price_amount})`,
          observationCount: count()
        })
        .from(competitive_pricing)
        .where(
          and(
            eq(competitive_pricing.route_id, routeId),
            eq(competitive_pricing.airline_code, 'EZY'),
            gte(competitive_pricing.observation_date, cutoffDate.toISOString().slice(0, 10))
          )
        );

      // Get EasyJet's authentic flight performance data
      const ezyCapacity = await db
        .select({
          total_seats: sql<string>`SUM(${flight_performance.total_seats})`,
          totalFlights: count(),
          avgLoadFactor: sql<string>`AVG(${flight_performance.load_factor})`
        })
        .from(flightPerformance)
        .where(
          and(
            eq(flight_performance.route_id, routeId),
            gte(flight_performance.flight_date, cutoffDate.toISOString().slice(0, 10))
          )
        );

      const pricing = ezyPricing[0];
      const capacity = ezyCapacity[0];

      if (!pricing || !capacity || pricing.observationCount === 0) {
        return null;
      }

      // Calculate performance metrics from available data
      const avgPrice = parseFloat(pricing.avgPrice || '0');
      const total_seats = parseInt(capacity.total_seats || '0');
      const loadFactor = parseFloat(capacity.avgLoadFactor || '0');
      
      // Estimate revenue and yield
      const estimatedPax = Math.round(total_seats * (loadFactor / 100));
      const estimatedRevenue = estimatedPax * avgPrice;
      const yieldPerPax = avgPrice; // Price per passenger is yield approximation

      return {
        routeId,
        avgLoadFactor: loadFactor,
        avgYield: yieldPerPax,
        totalRevenue: estimatedRevenue,
        totalBookings: estimatedPax,
        flightCount: parseInt(capacity.totalFlights?.toString() || '0'),
        avgPrice: avgPrice,
        priceRange: {
          min: parseFloat(pricing.minPrice || '0'),
          max: parseFloat(pricing.maxPrice || '0')
        },
        observationCount: parseInt(pricing.observationCount?.toString() || '0')
      };
    } catch (error) {
      console.error("Error in getRoutePerformanceMetrics:", error);
      return null;
    }
  }

  // Get available routes from the database
  async getAvailableRoutes() {
    try {
      const routes = await db
        .selectDistinct({
          routeId: competitive_pricing.route_id
        })
        .from(competitive_pricing)
        .where(eq(competitive_pricing.airline_code, 'EZY'))
        .orderBy(competitive_pricing.route_id);

      return routes.map(r => r.route_id).filter(Boolean);
    } catch (error) {
      console.error("Error in getAvailableRoutes:", error);
      return [];
    }
  }

  // Get intelligence insights - general method used by metrics calculator
  async getIntelligenceInsights(days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    try {
      return await db
        .select()
        .from(intelligence_insights)
        .where(
          gte(intelligence_insights.insight_date, cutoffDate.toISOString().slice(0, 10))
        )
        .orderBy(
          desc(intelligence_insights.insight_date),
          desc(intelligence_insights.confidence_score)
        )
        .limit(100);
    } catch (error) {
      console.error("Error in getIntelligenceInsights:", error);
      return [];
    }
  }

  // Get active intelligence insights
  async getActiveInsights(priorityLevel?: string, agentSource?: string) {
    try {
      let query = db
        .select()
        .from(intelligence_insights)
        .where(eq(intelligence_insights.action_taken, false))
        .orderBy(
          desc(intelligence_insights.insight_date),
          desc(intelligence_insights.confidence_score)
        );

      return await query.limit(50);
    } catch (error) {
      console.error("Error in getActiveInsights:", error);
      return [];
    }
  }

  // Get insights by route
  async getInsightsByRoute(routeId: string, days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
      return await db
        .select()
        .from(intelligence_insights)
        .where(
          and(
            eq(intelligence_insights.route_id, routeId),
            gte(intelligence_insights.insight_date, cutoffDate.toISOString().slice(0, 10))
          )
        )
        .orderBy(desc(intelligence_insights.insight_date));
    } catch (error) {
      console.error("Error in getInsightsByRoute:", error);
      return [];
    }
  }

  // Get web search trends
  async getWebSearchTrends(routeId: string, days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
      return await db
        .select({
          searchDate: webSearchData.searchDate,
          searchVolume: webSearchData.searchVolume,
          bookingVolume: webSearchData.bookingVolume,
          conversionRate: webSearchData.conversionRate,
          avgSearchPrice: webSearchData.avgSearchPrice
        })
        .from(webSearchData)
        .where(
          and(
            eq(webSearchData.route_id, routeId),
            gte(webSearchData.searchDate, cutoffDate.toISOString().slice(0, 10))
          )
        )
        .orderBy(webSearchData.searchDate);
    } catch (error) {
      console.error("Error in getWebSearchTrends:", error);
      return [];
    }
  }

  // Get comprehensive route dashboard data
  async getRouteDashboard(routeId: string) {
    try {
      const [pricing, capacity, performance, insights, searchTrends] = await Promise.all([
        this.getCompetitivePricingAnalysis(routeId, 7),
        this.getMarketCapacityAnalysis(routeId, 7),
        this.getRoutePerformanceMetrics(routeId, 7),
        this.getInsightsByRoute(routeId, 14),
        this.getWebSearchTrends(routeId, 14)
      ]);

      return {
        routeId,
        pricing,
        capacity,
        performance,
        insights: {
          total: insights.length,
          critical: insights.filter(i => i.priorityLevel === 'Critical').length,
          opportunities: insights.filter(i => i.insightType === 'Opportunity').length,
          recent: insights.slice(0, 5) // Most recent 5 insights
        },
        searchTrends
      };
    } catch (error) {
      console.error("Error in getRouteDashboard:", error);
      return {
        routeId,
        pricing: [],
        capacity: [],
        performance: null,
        insights: { total: 0, critical: 0, opportunities: 0, recent: [] },
        searchTrends: []
      };
    }
  }

  // Generate competitive position summary
  async getCompetitivePosition(routeId: string) {
    try {
      const pricing = await this.getCompetitivePricingAnalysis(routeId, 7);
      const capacity = await this.getMarketCapacityAnalysis(routeId, 7);
      
      if (pricing.length === 0) {
        return {
          route: routeId,
          pricing: { easyjetPrice: 0, competitorAvgPrice: 0, priceAdvantage: 0, priceRank: 0 },
          marketShare: { easyjetSeats: 0, totalMarketSeats: 0, marketSharePct: 0, capacityRank: 0 },
          competitorCount: 0
        };
      }
      
      // Calculate EasyJet's position
      const easyjetPricing = pricing.find(p => p.airline_code === 'EZY');
      const easyjetCapacity = capacity.find(c => c.airline_code === 'EZY');
      
      const totalMarketSeats = capacity.reduce((sum: number, carrier: any) => 
        sum + (Number(carrier.total_seats) || 0), 0);
      
      const competitorPrices = pricing.filter(p => p.airline_code !== 'EZY');
      const avgCompetitorPrice = competitorPrices.length > 0 ? 
        competitorPrices.reduce((sum: number, p: any) => sum + (Number(p.avgPrice) || 0), 0) / competitorPrices.length : 0;

      const result = {
        route: routeId,
        pricing: {
          easyjetPrice: Number(easyjetPricing?.avgPrice || 0),
          competitorAvgPrice: avgCompetitorPrice,
          priceAdvantage: Number(easyjetPricing?.avgPrice || 0) - avgCompetitorPrice,
          priceRank: pricing.findIndex(p => p.airline_code === 'EZY') + 1
        },
        marketShare: {
          easyjetSeats: Number(easyjetCapacity?.total_seats || 0),
          totalMarketSeats,
          marketSharePct: totalMarketSeats > 0 ? 
            (Number(easyjetCapacity?.total_seats || 0) / totalMarketSeats * 100) : 0,
          capacityRank: capacity.findIndex(c => c.airline_code === 'EZY') + 1
        },
        competitorCount: pricing.length
      };
      
      return result;
    } catch (error) {
      console.error("Error in getCompetitivePosition:", error);
      return {
        route: routeId,
        pricing: { easyjetPrice: 0, competitorAvgPrice: 0, priceAdvantage: 0, priceRank: 0 },
        marketShare: { easyjetSeats: 0, totalMarketSeats: 0, marketSharePct: 0, capacityRank: 0 },
        competitorCount: 0
      };
    }
  }
}

// Export singleton instance
export const telosIntelligenceService = new TelosIntelligenceService();