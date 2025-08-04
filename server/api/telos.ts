/**
 * Telos Intelligence Platform API Routes
 * Provides endpoints for consuming airline intelligence data
 */

import { Router } from 'express';
import { telosIntelligenceService } from '../services/telos-intelligence.js';
import { telosOrchestrator } from '../services/telos-agents.js';

const router = Router();

/**
 * GET /api/telos/competitive-position
 * Get competitive positioning analysis
 */
router.get('/competitive-position', async (req, res) => {
  const startTime = Date.now();
  try {
    const { routeId, days = 7 } = req.query;
    
    console.log(`[API] GET /competitive-position - routeId: ${routeId}, days: ${days}`);
    
    const positions = await telosIntelligenceService.getCompetitivePosition(
      routeId as string || 'LGW-BCN'
    );
    
    const duration = Date.now() - startTime;
    console.log(`[API] Competitive position request completed in ${duration}ms, returned data for route ${routeId}:`, positions);
    
    res.json(positions);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Failed to get competitive position (${duration}ms):`, error);
    res.status(500).json({ 
      error: 'Failed to retrieve competitive position data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/telos/route-performance
 * Get route performance metrics
 */
router.get('/route-performance', async (req, res) => {
  const startTime = Date.now();
  try {
    const { routeId, days = 14 } = req.query;
    
    console.log(`[API] GET /route-performance - routeId: ${routeId}, days: ${days}`);
    
    const performance = await telosIntelligenceService.getRoutePerformanceMetrics(
      routeId as string || 'LGW-BCN',
      parseInt(days as string) || 14
    );
    
    const duration = Date.now() - startTime;
    console.log(`[API] Route performance request completed in ${duration}ms, returned ${performance.length} records`);
    
    res.json(performance);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Failed to get route performance (${duration}ms):`, error);
    res.status(500).json({ 
      error: 'Failed to retrieve route performance data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/telos/demand-intelligence
 * Get demand trends and search intelligence
 */
router.get('/demand-intelligence', async (req, res) => {
  const startTime = Date.now();
  try {
    const { routeId, days = 30 } = req.query;
    
    console.log(`[API] GET /demand-intelligence - routeId: ${routeId}, days: ${days}`);
    
    const demand = await telosIntelligenceService.getWebSearchTrends(
      routeId as string || 'LGW-BCN',
      parseInt(days as string) || 30
    );
    
    const duration = Date.now() - startTime;
    console.log(`[API] Demand intelligence request completed in ${duration}ms, returned ${demand.length} records`);
    
    res.json(demand);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Failed to get demand intelligence (${duration}ms):`, error);
    res.status(500).json({ 
      error: 'Failed to retrieve demand intelligence data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/telos/intelligence-alerts
 * Get active intelligence alerts and insights
 */
router.get('/intelligence-alerts', async (req, res) => {
  const startTime = Date.now();
  try {
    const { priority, agentSource } = req.query;
    
    console.log(`[API] GET /intelligence-alerts - priority: ${priority}, agentSource: ${agentSource}`);
    
    const alerts = await telosIntelligenceService.getActiveInsights(
      priority as string,
      agentSource as string
    );
    
    const duration = Date.now() - startTime;
    console.log(`[API] Intelligence alerts request completed in ${duration}ms, returned ${alerts.length} records`);
    
    res.json(alerts);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Failed to get intelligence alerts (${duration}ms):`, error);
    res.status(500).json({ 
      error: 'Failed to retrieve intelligence alerts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/telos/daily-summary
 * Get comprehensive daily intelligence dashboard
 */
router.get('/daily-summary', async (req, res) => {
  const startTime = Date.now();
  try {
    console.log('[API] GET /daily-summary - generating comprehensive daily intelligence dashboard');
    
    const summary = await telosIntelligenceService.getRouteDashboard('LGW-BCN');
    
    const duration = Date.now() - startTime;
    console.log(`[API] Daily summary request completed in ${duration}ms`);
    
    res.json(summary);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Failed to get daily summary (${duration}ms):`, error);
    res.status(500).json({ 
      error: 'Failed to retrieve daily intelligence summary',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/telos/market-events
 * Get recent market events affecting operations
 */
router.get('/market-events', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const events = await telosIntelligence.getMarketEvents(parseInt(days as string));
    res.json(events);
  } catch (error) {
    console.error('Failed to get market events:', error);
    res.status(500).json({ error: 'Failed to retrieve market events' });
  }
});

/**
 * POST /api/telos/run-analysis
 * Trigger Telos intelligence agent analysis
 */
router.post('/run-analysis', async (req, res) => {
  const startTime = Date.now();
  try {
    console.log('[API] POST /run-analysis - Manual Telos intelligence analysis triggered');
    
    const analysis = await telosOrchestrator.runIntelligenceAnalysis();
    
    const duration = Date.now() - startTime;
    console.log(`[API] Intelligence analysis completed in ${duration}ms`);
    
    res.json({
      success: true,
      message: 'Intelligence analysis completed successfully',
      results: analysis,
      duration
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Failed to run Telos analysis (${duration}ms):`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to run intelligence analysis',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/telos/routes
 * Get list of available routes for filtering
 */
router.get('/routes', async (req, res) => {
  const startTime = Date.now();
  try {
    console.log('[API] GET /routes - retrieving available route list');
    
    // Get distinct routes from competitive data
    const positions = await telosIntelligence.getCompetitivePosition(undefined, 30);
    const routes = Array.from(new Set(positions.map(p => p.routeId))).filter(r => r).sort();
    
    const duration = Date.now() - startTime;
    console.log(`[API] Routes request completed in ${duration}ms, found ${routes.length} unique routes`);
    
    res.json(routes);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Failed to get routes (${duration}ms):`, error);
    res.status(500).json({ 
      error: 'Failed to retrieve route list',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/telos/analytics/pricing-trends
 * Get pricing trend analysis across competitors
 */
router.get('/analytics/pricing-trends', async (req, res) => {
  try {
    const { routeId, days = 30 } = req.query;
    
    const trends = await telosIntelligence.getCompetitivePosition(
      routeId as string,
      parseInt(days as string)
    );
    
    // Group by date for trend analysis
    const trendAnalysis = trends.reduce((acc, position) => {
      const date = position.observationDate;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(position);
      return acc;
    }, {} as Record<string, any[]>);
    
    res.json(trendAnalysis);
  } catch (error) {
    console.error('Failed to get pricing trends:', error);
    res.status(500).json({ error: 'Failed to retrieve pricing trends' });
  }
});

/**
 * GET /api/telos/analytics/performance-summary
 * Get aggregated performance metrics
 */
router.get('/analytics/performance-summary', async (req, res) => {
  try {
    const { days = 14 } = req.query;
    
    const performance = await telosIntelligence.getRoutePerformance(
      undefined,
      parseInt(days as string)
    );
    
    // Calculate summary metrics
    const summary = {
      totalFlights: performance.length,
      averageLoadFactor: performance.reduce((acc, p) => acc + p.loadFactor, 0) / performance.length || 0,
      totalRevenue: performance.reduce((acc, p) => acc + p.revenueTotal, 0),
      averageYield: performance.reduce((acc, p) => acc + p.yieldPerPax, 0) / performance.length || 0,
      routeCount: new Set(performance.map(p => p.routeId)).size,
      performanceDistribution: {
        above: performance.filter(p => p.performanceVsForecast > 5).length,
        onTarget: performance.filter(p => Math.abs(p.performanceVsForecast) <= 5).length,
        below: performance.filter(p => p.performanceVsForecast < -5).length
      }
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Failed to get performance summary:', error);
    res.status(500).json({ error: 'Failed to retrieve performance summary' });
  }
});

export default router;