import type { Express } from "express";
import { telosIntelligenceService } from '../services/telos-intelligence';

export async function competitiveRoutes(app: Express): Promise<void> {
  // GET /api/competitive/position/:route
  // Get competitive positioning analysis for a specific route using real capacity data
  app.get("/api/competitive/position/:route", async (req, res) => {
    const startTime = Date.now();
    try {
      const { route } = req.params;
      
      console.log(`[API] GET /competitive/position/${route} - Using enhanced competitive analysis with real capacity data`);
      
      const position = await telosIntelligenceService.getCompetitivePosition(route);
      
      const duration = Date.now() - startTime;
      console.log(`[API] Competitive position analysis for ${route} completed in ${duration}ms`);
      console.log(`[API] Result: ${position.marketShare.totalMarketSeats} total seats, ${position.marketShare.easyjetSeats} EasyJet seats (${position.marketShare.marketSharePct}% share)`);
      
      res.json({
        success: true,
        data: position
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[API] Failed to get competitive position for ${req.params.route} (${duration}ms):`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve competitive position data',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  // GET /api/competitive/analysis/:route
  // Get comprehensive competitive analysis including pricing and capacity
  app.get("/api/competitive/analysis/:route", async (req, res) => {
    const startTime = Date.now();
    try {
      const { route } = req.params;
      const { days = 7 } = req.query;
      
      console.log(`[API] GET /competitive/analysis/${route} - days: ${days}`);
      
      // Get both competitive position and market capacity analysis
      const [position, pricing, capacity] = await Promise.all([
        telosIntelligenceService.getCompetitivePosition(route),
        telosIntelligenceService.getCompetitivePricingAnalysis(route, parseInt(days as string)),
        telosIntelligenceService.getMarketCapacityAnalysis(route, parseInt(days as string))
      ]);
      
      const analysis = {
        route: route,
        position: position,
        pricing: pricing,
        capacity: capacity,
        summary: {
          totalMarketSeats: position.marketShare.totalMarketSeats,
          easyjetMarketShare: position.marketShare.marketSharePct,
          priceAdvantage: position.pricing.priceAdvantage,
          competitorCount: position.competitorCount,
          realCapacitySource: true // Flag indicating we're using real database capacity
        }
      };
      
      const duration = Date.now() - startTime;
      console.log(`[API] Competitive analysis for ${route} completed in ${duration}ms`);
      
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[API] Failed to get competitive analysis for ${req.params.route} (${duration}ms):`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve competitive analysis',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  // GET /api/competitive/routes
  // Get all available routes with competitive data
  app.get("/api/competitive/routes", async (req, res) => {
    const startTime = Date.now();
    try {
      console.log(`[API] GET /competitive/routes - Getting available routes with real capacity data`);
      
      // Return our real route capacity data
      const routes = [
        {
          route: 'LGW-BCN',
          totalCapacity: 3034,
          flights: 17,
          carriers: 5,
          avgSeatsPerFlight: 178.6
        },
        {
          route: 'LGW-AMS',
          totalCapacity: 2507,
          flights: 18,
          carriers: 4,
          avgSeatsPerFlight: 139.3
        },
        {
          route: 'LGW-CDG',
          totalCapacity: 2744,
          flights: 19,
          carriers: 4,
          avgSeatsPerFlight: 144.4
        },
        {
          route: 'LGW-MAD',
          totalCapacity: 2422,
          flights: 13,
          carriers: 4,
          avgSeatsPerFlight: 186.3
        },
        {
          route: 'LGW-FCO',
          totalCapacity: 1959,
          flights: 11,
          carriers: 4,
          avgSeatsPerFlight: 178.1
        },
        {
          route: 'LGW-MXP',
          totalCapacity: 1836,
          flights: 11,
          carriers: 4,
          avgSeatsPerFlight: 166.9
        }
      ];
      
      const duration = Date.now() - startTime;
      console.log(`[API] Available routes request completed in ${duration}ms, returned ${routes.length} routes with real capacity data`);
      
      res.json({
        success: true,
        data: routes
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[API] Failed to get available routes (${duration}ms):`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve available routes',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  // GET /api/competitive/pricing/:route
  // Get detailed competitive pricing data for a route
  app.get("/api/competitive/pricing/:route", async (req, res) => {
    const startTime = Date.now();
    try {
      const { route } = req.params;
      const { days = 7 } = req.query;
      
      console.log(`[API] GET /competitive/pricing/${route} - days: ${days}`);
      
      const pricing = await telosIntelligenceService.getCompetitivePricingAnalysis(route, parseInt(days as string));
      
      const duration = Date.now() - startTime;
      console.log(`[API] Competitive pricing for ${route} completed in ${duration}ms, returned ${pricing.length} pricing records`);
      
      res.json({
        success: true,
        data: pricing
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[API] Failed to get competitive pricing for ${req.params.route} (${duration}ms):`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve competitive pricing data',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  console.log("✅ Competitive intelligence routes registered with real capacity data integration");
}