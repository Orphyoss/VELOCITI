import type { Express } from "express";
import { storage } from "../storage";
import { enhancedAlertGenerator } from "../services/enhancedAlertGenerator";
import { logger } from "../services/logger";

export async function debugRoutes(app: Express) {
  // PRODUCTION DEBUG ENDPOINTS - Added to diagnose deployment issues
  app.get('/api/debug', async (req, res) => {
    logger.info('API', 'debug', 'Debug endpoint called', { userAgent: req.headers['user-agent'] });
    
    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      platform: process.platform,
      nodeVersion: process.version,
      
      // Environment variables (safely)
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPreview: process.env.DATABASE_URL?.substring(0, 30) + '***',
      
      // Request info
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      host: req.headers.host,
      
      // Database test results
      databaseTest: null,
      alertsTest: null,
      agentsTest: null
    };

    // Test database connection
    try {
      const testAlerts = await storage.getAlerts(undefined, 1);
      debug.alertsTest = {
        success: true,
        count: testAlerts?.length || 0,
        hasData: testAlerts && testAlerts.length > 0
      };
    } catch (error) {
      debug.alertsTest = {
        success: false,
        error: error.message
      };
    }

    // Test agent data
    try {
      const testAgents = await storage.getAgents();
      debug.agentsTest = {
        success: true,
        count: testAgents?.length || 0,
        hasData: testAgents && testAgents.length > 0,
        agents: testAgents?.map(a => ({ id: a.id, name: a.name, status: a.status })) || []
      };
    } catch (error) {
      debug.agentsTest = {
        success: false,
        error: error.message
      };
    }

    res.json(debug);
  });

  // Debug alerts endpoint
  app.get('/api/debug/alerts', async (req, res) => {
    try {
      const alerts = await storage.getAlerts(undefined, 5);
      const agents = await storage.getAgents();
      
      const debugInfo = {
        timestamp: new Date().toISOString(),
        alerts: {
          count: alerts?.length || 0,
          sample: alerts?.map(alert => ({
            id: alert.id,
            title: alert.title,
            priority: alert.priority,
            category: alert.category,
            agent_id: alert.agent_id,
            created_at: alert.created_at
          })) || []
        },
        agents: {
          count: agents?.length || 0,
          list: agents?.map(agent => ({
            id: agent.id,
            name: agent.name,
            status: agent.status,
            accuracy: agent.accuracy
          })) || []
        },
        database: {
          connected: true,
          timestamp: new Date().toISOString()
        }
      };
      
      res.json(debugInfo);
    } catch (error) {
      logger.error('API', 'debug', 'Debug alerts test failed', error);
      res.status(500).json({
        error: 'Debug endpoint failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Debug routes registered successfully
}