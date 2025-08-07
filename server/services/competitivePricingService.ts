import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, desc, asc, sql, count, avg, min, max } from 'drizzle-orm';
import { competitivePricing, routeMarkets } from '../../shared/schema';
import { logger } from './logger';

const client = postgres(process.env.DEV_DATABASE_URL || process.env.DATABASE_URL!);
const db = drizzle(client);

export class CompetitivePricingService {
  /**
   * Get competitive pricing analysis for a specific route
   */
  async getRouteCompetitivePricing(routeCode: string, daysBack: number = 7) {
    return await logger.logOperation(
      'CompetitivePricingService',
      'getRouteCompetitivePricing',
      `Fetching competitive pricing for route ${routeCode}`,
      async () => {
        try {
          // Get market key for the route
          const routeMarket = await db
            .select()
            .from(routeMarkets)
            .where(eq(routeMarkets.routeCode, routeCode))
            .limit(1);

          if (routeMarket.length === 0) {
            logger.warn('CompetitivePricingService', 'getRouteCompetitivePricing', `No market found for route ${routeCode}`);
            return [];
          }

          const marketKey = routeMarket[0].marketKey;

          // Get competitive pricing data
          const pricingData = await db
            .select({
              airlineCode: competitivePricing.carrAirlineCode,
              airlineName: competitivePricing.carrAirlineName,
              searchClass: competitivePricing.searchClass,
              priceInclTax: competitivePricing.priceInclTaxAmt,
              priceExclTax: competitivePricing.priceExclTaxAmt,
              mainPrice: competitivePricing.mainPrice,
              saverPrice: competitivePricing.saverPrice,
              flightNumber: competitivePricing.outbndFltNbr,
              bookingClass: competitivePricing.outbndBookingClassCd,
              fareBasis: competitivePricing.outbndFareBasis,
              snapshotDate: competitivePricing.snapshotDateKey,
              departureDate: competitivePricing.dptrDateKey,
            })
            .from(competitivePricing)
            .where(eq(competitivePricing.marketKey, marketKey))
            .orderBy(desc(competitivePricing.snapshotDateKey));

          return pricingData;
        } catch (error) {
          logger.error('CompetitivePricingService', 'getRouteCompetitivePricing', 'Database query failed', error);
          throw error;
        }
      }
    );
  }

  /**
   * Get competitive analysis summary for a route
   */
  async getCompetitiveAnalysis(routeCode: string) {
    return await logger.logOperation(
      'CompetitivePricingService',
      'getCompetitiveAnalysis',
      `Analyzing competitive position for route ${routeCode}`,
      async () => {
        try {
          const pricingData = await this.getRouteCompetitivePricing(routeCode);
          
          if (pricingData.length === 0) {
            return {
              route: routeCode,
              competitorCount: 0,
              easyjetPrice: null,
              competitorAvgPrice: null,
              priceRank: null,
              marketShare: null,
              priceAdvantage: null
            };
          }

          // Separate EasyJet from competitors
          const easyjetData = pricingData.filter(p => p.airlineCode === 'U2');
          const competitorData = pricingData.filter(p => p.airlineCode !== 'U2');

          // Calculate averages
          const easyjetAvgPrice = easyjetData.length > 0 
            ? easyjetData.reduce((sum, p) => sum + Number(p.priceInclTax || 0), 0) / easyjetData.length
            : null;

          const competitorAvgPrice = competitorData.length > 0
            ? competitorData.reduce((sum, p) => sum + Number(p.priceInclTax || 0), 0) / competitorData.length
            : null;

          // Calculate price rank (where EasyJet ranks among all airlines)
          const allPrices = pricingData
            .map(p => ({ airline: p.airlineCode, price: Number(p.priceInclTax || 0) }))
            .sort((a, b) => a.price - b.price);

          const easyjetRank = allPrices.findIndex(p => p.airline === 'U2') + 1;

          // Calculate price advantage/disadvantage
          const priceAdvantage = (easyjetAvgPrice && competitorAvgPrice) 
            ? competitorAvgPrice - easyjetAvgPrice
            : null;

          return {
            route: routeCode,
            competitorCount: competitorData.length,
            easyjetPrice: easyjetAvgPrice,
            competitorAvgPrice: competitorAvgPrice,
            priceRank: easyjetRank || null,
            priceAdvantage: priceAdvantage,
            airlines: [...new Set(pricingData.map(p => p.airlineCode))],
            searchClasses: [...new Set(pricingData.map(p => p.searchClass))],
            totalRecords: pricingData.length
          };
        } catch (error) {
          logger.error('CompetitivePricingService', 'getCompetitiveAnalysis', 'Analysis failed', error);
          throw error;
        }
      }
    );
  }

  /**
   * Get network-wide competitive summary
   */
  async getNetworkCompetitiveSummary() {
    return await logger.logOperation(
      'CompetitivePricingService',
      'getNetworkCompetitiveSummary',
      'Generating network competitive summary',
      async () => {
        try {
          // Get all routes with competitive data
          const routes = await db
            .select({ routeCode: routeMarkets.routeCode })
            .from(routeMarkets);

          const summaries = await Promise.all(
            routes.map(route => this.getCompetitiveAnalysis(route.routeCode))
          );

          // Calculate network-wide metrics
          const validSummaries = summaries.filter(s => s.competitorCount > 0);
          const totalCompetitors = validSummaries.reduce((sum, s) => sum + s.competitorCount, 0);
          const avgCompetitorCount = validSummaries.length > 0 ? totalCompetitors / validSummaries.length : 0;

          const routesWithAdvantage = validSummaries.filter(s => s.priceAdvantage && s.priceAdvantage > 0).length;
          const routesWithDisadvantage = validSummaries.filter(s => s.priceAdvantage && s.priceAdvantage < 0).length;

          return {
            totalRoutes: routes.length,
            routesWithData: validSummaries.length,
            avgCompetitorCount: avgCompetitorCount,
            routesWithAdvantage: routesWithAdvantage,
            routesWithDisadvantage: routesWithDisadvantage,
            routeDetails: summaries
          };
        } catch (error) {
          logger.error('CompetitivePricingService', 'getNetworkCompetitiveSummary', 'Summary generation failed', error);
          throw error;
        }
      }
    );
  }

  /**
   * Get competitive pricing trends over time
   */
  async getCompetitiveTrends(routeCode: string, daysBack: number = 30) {
    return await logger.logOperation(
      'CompetitivePricingService',
      'getCompetitiveTrends',
      `Analyzing pricing trends for ${routeCode} over ${daysBack} days`,
      async () => {
        try {
          const routeMarket = await db
            .select()
            .from(routeMarkets)
            .where(eq(routeMarkets.routeCode, routeCode))
            .limit(1);

          if (routeMarket.length === 0) {
            return [];
          }

          const marketKey = routeMarket[0].marketKey;

          // Get pricing trends by airline
          const trends = await db
            .select({
              airlineCode: competitivePricing.carrAirlineCode,
              airlineName: competitivePricing.carrAirlineName,
              snapshotDate: competitivePricing.snapshotDateKey,
              avgPrice: avg(competitivePricing.priceInclTaxAmt),
              minPrice: min(competitivePricing.priceInclTaxAmt),
              maxPrice: max(competitivePricing.priceInclTaxAmt),
              recordCount: count()
            })
            .from(competitivePricing)
            .where(eq(competitivePricing.marketKey, marketKey))
            .groupBy(
              competitivePricing.carrAirlineCode,
              competitivePricing.carrAirlineName,
              competitivePricing.snapshotDateKey
            )
            .orderBy(
              competitivePricing.snapshotDateKey,
              competitivePricing.carrAirlineCode
            );

          return trends;
        } catch (error) {
          logger.error('CompetitivePricingService', 'getCompetitiveTrends', 'Trends analysis failed', error);
          throw error;
        }
      }
    );
  }

  /**
   * Get all available routes with competitive data
   */
  async getAvailableRoutes() {
    return await logger.logOperation(
      'CompetitivePricingService',
      'getAvailableRoutes',
      'Fetching available routes with competitive data',
      async () => {
        try {
          const routes = await db
            .select({
              routeCode: routeMarkets.routeCode,
              marketName: routeMarkets.marketName,
              originAirport: routeMarkets.originAirport,
              destinationAirport: routeMarkets.destinationAirport,
              recordCount: count(competitivePricing.id)
            })
            .from(routeMarkets)
            .leftJoin(competitivePricing, eq(routeMarkets.marketKey, competitivePricing.marketKey))
            .groupBy(
              routeMarkets.routeCode,
              routeMarkets.marketName,
              routeMarkets.originAirport,
              routeMarkets.destinationAirport
            )
            .orderBy(routeMarkets.routeCode);

          return routes;
        } catch (error) {
          logger.error('CompetitivePricingService', 'getAvailableRoutes', 'Routes fetch failed', error);
          throw error;
        }
      }
    );
  }
}

export const competitivePricingService = new CompetitivePricingService();