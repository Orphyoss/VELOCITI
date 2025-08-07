import { Router } from 'express';
import { competitivePricingService } from '../services/competitivePricingService';
import { logger } from '../services/logger';

const router = Router();

/**
 * GET /api/competitive/routes
 * Get all available routes with competitive data
 */
router.get('/routes', async (req, res) => {
  try {
    const routes = await competitivePricingService.getAvailableRoutes();
    
    res.json({
      success: true,
      data: routes
    });
  } catch (error) {
    logger.error('CompetitiveAPI', '/routes', 'Failed to fetch routes', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch competitive routes data'
    });
  }
});

/**
 * GET /api/competitive/analysis/:route
 * Get competitive analysis for a specific route
 */
router.get('/analysis/:route', async (req, res) => {
  try {
    const { route } = req.params;
    const analysis = await competitivePricingService.getCompetitiveAnalysis(route);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('CompetitiveAPI', `/analysis/${req.params.route}`, 'Failed to fetch competitive analysis', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch competitive analysis'
    });
  }
});

/**
 * GET /api/competitive/pricing/:route
 * Get detailed competitive pricing data for a route
 */
router.get('/pricing/:route', async (req, res) => {
  try {
    const { route } = req.params;
    const daysBack = parseInt(req.query.daysBack as string) || 7;
    
    const pricing = await competitivePricingService.getRouteCompetitivePricing(route, daysBack);
    
    res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    logger.error('CompetitiveAPI', `/pricing/${req.params.route}`, 'Failed to fetch pricing data', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch competitive pricing data'
    });
  }
});

/**
 * GET /api/competitive/trends/:route
 * Get competitive pricing trends for a route
 */
router.get('/trends/:route', async (req, res) => {
  try {
    const { route } = req.params;
    const daysBack = parseInt(req.query.daysBack as string) || 30;
    
    const trends = await competitivePricingService.getCompetitiveTrends(route, daysBack);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    logger.error('CompetitiveAPI', `/trends/${req.params.route}`, 'Failed to fetch trends data', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch competitive trends data'
    });
  }
});

/**
 * GET /api/competitive/network-summary
 * Get network-wide competitive summary
 */
router.get('/network-summary', async (req, res) => {
  try {
    const summary = await competitivePricingService.getNetworkCompetitiveSummary();
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('CompetitiveAPI', '/network-summary', 'Failed to fetch network summary', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch network competitive summary'
    });
  }
});

export default router;