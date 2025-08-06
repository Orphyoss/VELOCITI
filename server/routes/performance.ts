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
      
      // Get route performance data from database
      const performanceData = await storage.getRoutePerformance(
        route as string | undefined,
        parseInt(days as string) || 7
      );
      
      const duration = Date.now() - startTime;
      console.log(`[API] Route performance completed in ${duration}ms, returned ${performanceData?.length || 0} records`);
      
      res.json(performanceData || []);
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