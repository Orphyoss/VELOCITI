// Telos Intelligence Platform - Data Service
// Provides analytics and insights for airline revenue management

import { db } from './supabase.js';
import { desc, eq, gte, lte, and, count, avg, sum, sql } from "drizzle-orm";
import {
  competitivePricing,
  marketCapacity,
  webSearchData,
  flightPerformance,
  intelligenceInsights,
  routes,
  airlines
} from "../../shared/schema.js";

export class TelosIntelligenceService {
  // Get competitive pricing analysis for a route
  async getCompetitivePricingAnalysis(routeId: string, days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
      const results = await db
        .select({
          airlineCode: competitivePricing.airlineCode,
          avgPrice: sql<string>`AVG(${competitivePricing.priceAmount}::numeric)`,
          minPrice: sql<string>`MIN(${competitivePricing.priceAmount}::numeric)`,
          maxPrice: sql<string>`MAX(${competitivePricing.priceAmount}::numeric)`,
          observationCount: count()
        })
        .from(competitivePricing)
        .where(
          and(
            eq(competitivePricing.routeId, routeId),
            gte(competitivePricing.observationDate, cutoffDate.toISOString().slice(0, 10))
          )
        )
        .groupBy(competitivePricing.airlineCode)
        .orderBy(desc(sql`AVG(${competitivePricing.priceAmount}::numeric)`));

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
          airlineCode: marketCapacity.airlineCode,
          totalFlights: sum(marketCapacity.numFlights),
          totalSeats: sum(marketCapacity.numSeats),
          avgFlightsPerDay: sql<number>`${sum(marketCapacity.numFlights)} / ${days}`
        })
        .from(marketCapacity)
        .where(
          and(
            eq(marketCapacity.routeId, routeId),
            gte(marketCapacity.flightDate, cutoffDate.toISOString().slice(0, 10))
          )
        )
        .groupBy(marketCapacity.airlineCode)
        .orderBy(desc(sql`SUM(${marketCapacity.numSeats})`));

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
          avgPrice: sql<string>`AVG(${competitivePricing.priceAmount}::numeric)`,
          minPrice: sql<string>`MIN(${competitivePricing.priceAmount}::numeric)`,
          maxPrice: sql<string>`MAX(${competitivePricing.priceAmount}::numeric)`,
          observationCount: count()
        })
        .from(competitivePricing)
        .where(
          and(
            eq(competitivePricing.routeId, routeId),
            eq(competitivePricing.airlineCode, 'EZY'),
            gte(competitivePricing.observationDate, cutoffDate.toISOString().slice(0, 10))
          )
        );

      // Get EasyJet's capacity
      const ezyCapacity = await db
        .select({
          totalSeats: sql<string>`SUM(${marketCapacity.numSeats}::numeric)`,
          totalFlights: count(),
          avgLoadFactor: sql<string>`75.0` // Default load factor estimate
        })
        .from(marketCapacity)
        .where(
          and(
            eq(marketCapacity.routeId, routeId),
            eq(marketCapacity.airlineCode, 'EZY'),
            gte(marketCapacity.flightDate, cutoffDate.toISOString().slice(0, 10))
          )
        );

      const pricing = ezyPricing[0];
      const capacity = ezyCapacity[0];

      if (!pricing || !capacity || pricing.observationCount === 0) {
        return null;
      }

      // Calculate performance metrics from available data
      const avgPrice = parseFloat(pricing.avgPrice || '0');
      const totalSeats = parseInt(capacity.totalSeats || '0');
      const loadFactor = parseFloat(capacity.avgLoadFactor || '0');
      
      // Estimate revenue and yield
      const estimatedPax = Math.round(totalSeats * (loadFactor / 100));
      const estimatedRevenue = estimatedPax * avgPrice;
      const yieldPerPax = avgPrice; // Price per passenger is yield approximation

      return {
        routeId,
        avgLoadFactor: loadFactor,
        avgYield: yieldPerPax,
        totalRevenue: estimatedRevenue,
        totalBookings: estimatedPax,
        flightCount: parseInt(capacity.totalFlights || '0'),
        avgPrice: avgPrice,
        priceRange: {
          min: parseFloat(pricing.minPrice || '0'),
          max: parseFloat(pricing.maxPrice || '0')
        },
        observationCount: parseInt(pricing.observationCount || '0')
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
          routeId: competitivePricing.routeId
        })
        .from(competitivePricing)
        .where(eq(competitivePricing.airlineCode, 'EZY'))
        .orderBy(competitivePricing.routeId);

      return routes.map(r => r.routeId).filter(Boolean);
    } catch (error) {
      console.error("Error in getAvailableRoutes:", error);
      return [];
    }
  }

  // Get active intelligence insights
  async getActiveInsights(priorityLevel?: string, agentSource?: string) {
    try {
      let query = db
        .select()
        .from(intelligenceInsights)
        .where(eq(intelligenceInsights.actionTaken, false))
        .orderBy(
          desc(intelligenceInsights.insightDate),
          desc(intelligenceInsights.confidenceScore)
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
        .from(intelligenceInsights)
        .where(
          and(
            eq(intelligenceInsights.routeId, routeId),
            gte(intelligenceInsights.insightDate, cutoffDate.toISOString().slice(0, 10))
          )
        )
        .orderBy(desc(intelligenceInsights.insightDate));
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
            eq(webSearchData.routeId, routeId),
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
      
      // Calculate EasyJet's position
      const easyjetPricing = pricing.find(p => p.airlineCode === 'EZY');
      const easyjetCapacity = capacity.find(c => c.airlineCode === 'EZY');
      
      const totalMarketSeats = capacity.reduce((sum: number, carrier: any) => 
        sum + (Number(carrier.totalSeats) || 0), 0);
      
      const avgCompetitorPrice = pricing
        .filter(p => p.airlineCode !== 'EZY')
        .reduce((sum: number, p: any) => sum + (Number(p.avgPrice) || 0), 0) / 
        Math.max(1, pricing.filter(p => p.airlineCode !== 'EZY').length);

      return {
        route: routeId,
        pricing: {
          easyjetPrice: Number(easyjetPricing?.avgPrice || 0),
          competitorAvgPrice: avgCompetitorPrice,
          priceAdvantage: Number(easyjetPricing?.avgPrice || 0) - avgCompetitorPrice,
          priceRank: pricing.findIndex(p => p.airlineCode === 'EZY') + 1
        },
        marketShare: {
          easyjetSeats: Number(easyjetCapacity?.totalSeats || 0),
          totalMarketSeats,
          marketSharePct: totalMarketSeats > 0 ? 
            (Number(easyjetCapacity?.totalSeats || 0) / totalMarketSeats * 100) : 0,
          capacityRank: capacity.findIndex(c => c.airlineCode === 'EZY') + 1
        },
        competitorCount: pricing.length
      };
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