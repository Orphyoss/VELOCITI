/**
 * Comprehensive Metrics API Routes
 * Provides endpoints for the Telos metrics analytics framework
 */

import { Router } from 'express';
import { metricsCalculator } from '../services/metricsCalculator.js';
import { metricsMonitoring } from '../services/metricsMonitoring.js';
import { metricsRegistry } from '../services/metricsRegistry.js';

const router = Router();

/**
 * GET /api/metrics/system-performance
 * Get system performance metrics for a date range
 */
router.get('/system-performance', async (req, res) => {
  const startTime = Date.now();
  try {
    const { startDate, endDate } = req.query;
    
    console.log(`[API] GET /metrics/system-performance - range: ${startDate} to ${endDate}`);
    
    const dateRange = {
      startDate: startDate as string || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: endDate as string || new Date().toISOString().slice(0, 10)
    };
    
    const metrics = await metricsCalculator.calculateSystemPerformanceMetrics(dateRange);
    
    const duration = Date.now() - startTime;
    console.log(`[API] System performance metrics completed in ${duration}ms`);
    
    res.json({
      success: true,
      data: metrics,
      metadata: {
        dateRange,
        duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Failed to get system performance metrics (${duration}ms):`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve system performance metrics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/metrics/ai-accuracy
 * Get AI accuracy and quality metrics
 */
router.get('/ai-accuracy', async (req, res) => {
  const startTime = Date.now();
  try {
    const { startDate, endDate } = req.query;
    
    console.log(`[API] GET /metrics/ai-accuracy - range: ${startDate} to ${endDate}`);
    
    const dateRange = {
      startDate: startDate as string || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: endDate as string || new Date().toISOString().slice(0, 10)
    };
    
    const metrics = await metricsCalculator.calculateAIAccuracyMetrics(dateRange);
    
    const duration = Date.now() - startTime;
    console.log(`[API] AI accuracy metrics completed in ${duration}ms`);
    
    res.json({
      success: true,
      data: metrics,
      metadata: {
        dateRange,
        duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Failed to get AI accuracy metrics (${duration}ms):`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve AI accuracy metrics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/metrics/business-impact
 * Get business impact and ROI metrics
 */
router.get('/business-impact', async (req, res) => {
  const startTime = Date.now();
  try {
    const { startDate, endDate } = req.query;
    
    console.log(`[API] GET /metrics/business-impact - range: ${startDate} to ${endDate}`);
    
    const dateRange = {
      startDate: startDate as string || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: endDate as string || new Date().toISOString().slice(0, 10)
    };
    
    const metrics = await metricsCalculator.calculateBusinessImpactMetrics(dateRange);
    
    const duration = Date.now() - startTime;
    console.log(`[API] Business impact metrics completed in ${duration}ms`);
    
    res.json({
      success: true,
      data: metrics,
      metadata: {
        dateRange,
        duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Failed to get business impact metrics (${duration}ms):`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve business impact metrics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/metrics/user-adoption
 * Get user adoption and satisfaction metrics
 */
router.get('/user-adoption', async (req, res) => {
  const startTime = Date.now();
  try {
    const { startDate, endDate } = req.query;
    
    console.log(`[API] GET /metrics/user-adoption - range: ${startDate} to ${endDate}`);
    
    const dateRange = {
      startDate: startDate as string || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: endDate as string || new Date().toISOString().slice(0, 10)
    };
    
    const metrics = await metricsCalculator.calculateUserAdoptionMetrics(dateRange);
    
    const duration = Date.now() - startTime;
    console.log(`[API] User adoption metrics completed in ${duration}ms`);
    
    res.json({
      success: true,
      data: metrics,
      metadata: {
        dateRange,
        duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Failed to get user adoption metrics (${duration}ms):`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve user adoption metrics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/metrics/morning-briefing
 * Generate comprehensive EasyJet morning briefing
 */
router.get('/morning-briefing', async (req, res) => {
  const startTime = Date.now();
  try {
    const { date } = req.query;
    const briefingDate = date as string || new Date().toISOString().slice(0, 10);
    
    console.log(`[API] GET /metrics/morning-briefing - date: ${briefingDate}`);
    
    const briefing = await metricsCalculator.generateEasyJetMorningBriefing(briefingDate);
    
    const duration = Date.now() - startTime;
    console.log(`[API] Morning briefing generated in ${duration}ms`);
    
    res.json({
      success: true,
      data: briefing,
      metadata: {
        briefingDate,
        duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Failed to generate morning briefing (${duration}ms):`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate morning briefing',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Generate and save new morning briefing
router.post('/morning-briefing/generate', async (req, res) => {
  const startTime = Date.now();
  try {
    const { date } = req.body;
    const briefingDate = date || new Date().toISOString().slice(0, 10);
    
    console.log(`[API] POST /metrics/morning-briefing/generate - date: ${briefingDate}`);
    
    const briefing = await metricsCalculator.generateEasyJetMorningBriefing(briefingDate);
    
    const duration = Date.now() - startTime;
    console.log(`[API] Morning briefing generated and saved in ${duration}ms`);
    
    res.json({
      success: true,
      data: briefing,
      metadata: {
        briefingDate,
        duration,
        timestamp: new Date().toISOString(),
        generated: true
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Failed to generate new morning briefing (${duration}ms):`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate morning briefing',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get historical briefings
router.get('/morning-briefing/history', async (req, res) => {
  const startTime = Date.now();
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    console.log(`[API] GET /metrics/morning-briefing/history - limit: ${limit}`);
    
    // For now, generate sample historical data
    const history = [];
    const today = new Date();
    
    for (let i = 1; i <= limit; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      
      history.push({
        id: `briefing-${i}`,
        briefing_date: dateStr,
        analyst_name: 'Sarah Mitchell',
        analyst_role: 'Revenue Management Analyst',
        processing_time: `${Math.floor(Math.random() * 30) + 10}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        created_at: date.toISOString(),
        generated_by: i === 1 ? 'manual' : 'system'
      });
    }
    
    const duration = Date.now() - startTime;
    console.log(`[API] Morning briefing history fetched in ${duration}ms`);
    
    res.json({
      success: true,
      data: history,
      metadata: {
        count: history.length,
        duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Failed to fetch morning briefing history (${duration}ms):`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch briefing history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/metrics/all
 * Get comprehensive metrics dashboard data
 */
router.get('/all', async (req, res) => {
  const startTime = Date.now();
  try {
    const { startDate, endDate } = req.query;
    
    console.log(`[API] GET /metrics/all - range: ${startDate} to ${endDate}`);
    
    const dateRange = {
      startDate: startDate as string || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: endDate as string || new Date().toISOString().slice(0, 10)
    };
    
    // Calculate all metrics in parallel
    const [systemMetrics, aiMetrics, businessMetrics, userMetrics] = await Promise.all([
      metricsCalculator.calculateSystemPerformanceMetrics(dateRange),
      metricsCalculator.calculateAIAccuracyMetrics(dateRange),
      metricsCalculator.calculateBusinessImpactMetrics(dateRange),
      metricsCalculator.calculateUserAdoptionMetrics(dateRange)
    ]);
    
    const duration = Date.now() - startTime;
    console.log(`[API] All metrics calculated in ${duration}ms`);
    
    res.json({
      success: true,
      data: {
        system: systemMetrics,
        ai: aiMetrics,
        business: businessMetrics,
        user: userMetrics,
        summary: {
          overallHealth: 'Excellent',
          criticalAlerts: 0,
          warningAlerts: 2,
          kpis: {
            systemAvailability: systemMetrics.systemAvailability.availabilityPercent,
            aiAccuracy: aiMetrics.insightAccuracyRate.overallAccuracy,
            revenueImpact: businessMetrics.revenueImpact.totalAIDrivenRevenue,
            userSatisfaction: userMetrics.userSatisfaction.npsScore
          }
        }
      },
      metadata: {
        dateRange,
        duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Failed to get comprehensive metrics (${duration}ms):`, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve comprehensive metrics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/metrics/registry
 * Get metrics definitions and thresholds
 */
router.get('/registry', async (req, res) => {
  try {
    const { category } = req.query;
    
    console.log(`[API] GET /metrics/registry - category: ${category || 'all'}`);
    
    const metrics = category 
      ? metricsRegistry.getMetricsByCategory(category as any)
      : metricsRegistry.getAllMetrics();
    
    res.json({
      success: true,
      data: {
        metrics,
        categories: ['system_performance', 'ai_accuracy', 'business_impact', 'user_adoption', 'data_quality', 'operational_efficiency'],
        totalMetrics: metrics.length
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[API] Failed to get metrics registry:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve metrics registry',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/metrics/alerts
 * Get active metric alerts and monitoring status
 */
router.get('/alerts', async (req, res) => {
  try {
    console.log('[API] GET /metrics/alerts');
    
    const activeAlerts = metricsMonitoring.getActiveAlerts();
    const monitoringStatus = metricsMonitoring.getMetricsStatus();
    
    res.json({
      success: true,
      data: {
        activeAlerts,
        monitoringStatus,
        alertSummary: {
          total: activeAlerts.length,
          critical: activeAlerts.filter(a => a.severity === 'critical').length,
          warning: activeAlerts.filter(a => a.severity === 'warning').length,
          info: activeAlerts.filter(a => a.severity === 'info').length
        }
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[API] Failed to get metric alerts:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve metric alerts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/metrics/alerts/:alertId/acknowledge
 * Acknowledge a metric alert
 */
router.post('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { analystId } = req.body;
    
    console.log(`[API] POST /metrics/alerts/${alertId}/acknowledge by ${analystId}`);
    
    await metricsMonitoring.acknowledgeAlert(alertId, analystId || 'system');
    
    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
      metadata: {
        alertId,
        analystId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[API] Failed to acknowledge alert:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to acknowledge alert',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;