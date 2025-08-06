import type { Express } from "express";
import { storage } from "../storage";

export async function performanceRoutes(app: Express): Promise<void> {
  // GET /api/routes/performance
  // Get route performance data for network analysis
  app.get("/api/routes/performance", async (req, res) => {
    const startTime = Date.now();
    try {
      const { route, days = 7, limit = 50 } = req.query;
      
      console.log(`[API] GET /routes/performance - route: ${route}, days: ${days}, limit: ${limit}`);
      
      // Direct database query for flight performance data
      const { db } = await import('../services/supabase');
      const { flight_performance } = await import('@shared/schema');
      const { eq, sql, count, desc } = await import('drizzle-orm');
      
      if (route) {
        // Get performance for specific route
        const performance = await db
          .select({
            routeId: flight_performance.route_id,
            avgLoadFactor: sql<string>`AVG(${flight_performance.load_factor})`,
            totalSeats: sql<string>`SUM(${flight_performance.total_seats})`,
            flightCount: count(),
            avgYield: sql<string>`AVG(COALESCE(${flight_performance.ticket_price}, 150))`,
            totalRevenue: sql<string>`SUM(${flight_performance.total_seats}::numeric * ${flight_performance.load_factor}::numeric / 100 * COALESCE(${flight_performance.ticket_price}::numeric, 150))`
          })
          .from(flight_performance)
          .where(eq(flight_performance.route_id, route as string))
          .groupBy(flight_performance.route_id);
        
        const performanceData = performance.map(p => ({
          routeId: p.routeId,
          avgLoadFactor: parseFloat(p.avgLoadFactor || '0'),
          avgYield: parseFloat(p.avgYield || '0'),
          totalRevenue: parseFloat(p.totalRevenue || '0'),
          totalBookings: Math.round((parseFloat(p.totalSeats || '0') * parseFloat(p.avgLoadFactor || '0')) / 100),
          flightCount: p.flightCount || 0
        }));
        
        return res.json(performanceData);
      } else {
        // Get performance for all routes
        const limitNum = parseInt(limit as string) || 50;
        const performance = await db
          .select({
            routeId: flight_performance.route_id,
            avgLoadFactor: sql<string>`AVG(${flight_performance.load_factor})`,
            totalSeats: sql<string>`SUM(${flight_performance.total_seats})`,
            flightCount: count(),
            avgYield: sql<string>`AVG(COALESCE(${flight_performance.ticket_price}, 150))`,
            totalRevenue: sql<string>`SUM(${flight_performance.total_seats}::numeric * ${flight_performance.load_factor}::numeric / 100 * COALESCE(${flight_performance.ticket_price}::numeric, 150))`
          })
          .from(flight_performance)
          .groupBy(flight_performance.route_id)
          .orderBy(desc(count()))
          .limit(limitNum);
        
        const performanceData = performance.map(p => ({
          routeId: p.routeId,
          avgLoadFactor: parseFloat(p.avgLoadFactor || '0'),
          avgYield: parseFloat(p.avgYield || '0'),
          totalRevenue: parseFloat(p.totalRevenue || '0'),
          totalBookings: Math.round((parseFloat(p.totalSeats || '0') * parseFloat(p.avgLoadFactor || '0')) / 100),
          flightCount: p.flightCount || 0
        }));
        
        const duration = Date.now() - startTime;
        console.log(`[API] Route performance completed in ${duration}ms, returned ${performanceData?.length || 0} records`);
        
        return res.json(performanceData);
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[API] Failed to get route performance (${duration}ms):`, error);
      res.status(500).json({ 
        error: 'Failed to retrieve route performance data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  console.log("✅ Performance routes registered");
}