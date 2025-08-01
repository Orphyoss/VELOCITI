/**
 * Telos Intelligence Platform API Routes
 * Provides endpoints for consuming airline intelligence data
 */

import { Router } from 'express';
import { telosIntelligence } from '../services/telos-intelligence.js';
import { telosOrchestrator } from '../services/telos-agents.js';

const router = Router();

/**
 * GET /api/telos/competitive-position
 * Get competitive positioning analysis
 */
router.get('/competitive-position', async (req, res) => {
  try {
    const { routeId, days = 7 } = req.query;
    
    const positions = await telosIntelligence.getCompetitivePosition(
      routeId as string, 
      parseInt(days as string)
    );
    
    res.json(positions);
  } catch (error) {
    console.error('Failed to get competitive position:', error);
    res.status(500).json({ error: 'Failed to retrieve competitive position data' });
  }
});

/**
 * GET /api/telos/route-performance
 * Get route performance metrics
 */
router.get('/route-performance', async (req, res) => {
  try {
    const { routeId, days = 14 } = req.query;
    
    const performance = await telosIntelligence.getRoutePerformance(
      routeId as string,
      parseInt(days as string)
    );
    
    res.json(performance);
  } catch (error) {
    console.error('Failed to get route performance:', error);
    res.status(500).json({ error: 'Failed to retrieve route performance data' });
  }
});

/**
 * GET /api/telos/demand-intelligence
 * Get demand trends and search intelligence
 */
router.get('/demand-intelligence', async (req, res) => {
  try {
    const { routeId, days = 30 } = req.query;
    
    const demand = await telosIntelligence.getDemandIntelligence(
      routeId as string,
      parseInt(days as string)
    );
    
    res.json(demand);
  } catch (error) {
    console.error('Failed to get demand intelligence:', error);
    res.status(500).json({ error: 'Failed to retrieve demand intelligence data' });
  }
});

/**
 * GET /api/telos/intelligence-alerts
 * Get active intelligence alerts and insights
 */
router.get('/intelligence-alerts', async (req, res) => {
  try {
    const { priority, agentSource } = req.query;
    
    const alerts = await telosIntelligence.getIntelligenceAlerts(
      priority as string,
      agentSource as string
    );
    
    res.json(alerts);
  } catch (error) {
    console.error('Failed to get intelligence alerts:', error);
    res.status(500).json({ error: 'Failed to retrieve intelligence alerts' });
  }
});

/**
 * GET /api/telos/daily-summary
 * Get comprehensive daily intelligence dashboard
 */
router.get('/daily-summary', async (req, res) => {
  try {
    const summary = await telosIntelligence.getDailyIntelligenceSummary();
    res.json(summary);
  } catch (error) {
    console.error('Failed to get daily summary:', error);
    res.status(500).json({ error: 'Failed to retrieve daily intelligence summary' });
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
  try {
    console.log('Manual Telos intelligence analysis triggered');
    
    const analysis = await telosOrchestrator.runIntelligenceAnalysis();
    
    res.json({
      success: true,
      message: 'Intelligence analysis completed successfully',
      results: analysis
    });
  } catch (error) {
    console.error('Failed to run Telos analysis:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to run intelligence analysis' 
    });
  }
});

/**
 * GET /api/telos/routes
 * Get list of available routes for filtering
 */
router.get('/routes', async (req, res) => {
  try {
    // Get distinct routes from competitive data
    const positions = await telosIntelligence.getCompetitivePosition(undefined, 30);
    const routes = [...new Set(positions.map(p => p.routeId))].sort();
    
    res.json(routes);
  } catch (error) {
    console.error('Failed to get routes:', error);
    res.status(500).json({ error: 'Failed to retrieve route list' });
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