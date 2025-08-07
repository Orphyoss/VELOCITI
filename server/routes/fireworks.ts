import type { Express } from "express";
import { fireworksService } from "../services/fireworksService";
import { logger } from "../services/logger";
import rateLimit from "express-rate-limit";

// Rate limiting for Fireworks API endpoints
const fireworksRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Too many requests to Fireworks API, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export async function fireworksRoutes(app: Express): Promise<void> {
  // Test Fireworks connection
  app.get("/api/fireworks/test", fireworksRateLimit, async (req, res) => {
    try {
      logger.info('Testing Fireworks AI connection');
      const isConnected = await fireworksService.testConnection();
      
      res.json({
        success: isConnected,
        message: isConnected ? 'Fireworks AI connection successful' : 'Fireworks AI connection failed',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Fireworks connection test error', { error: error instanceof Error ? error.message : error });
      res.status(500).json({
        success: false,
        error: 'Failed to test Fireworks connection',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get available models
  app.get("/api/fireworks/models", (req, res) => {
    try {
      const models = fireworksService.getAvailableModels();
      res.json({
        success: true,
        models,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting Fireworks models', { error: error instanceof Error ? error.message : error });
      res.status(500).json({
        success: false,
        error: 'Failed to get available models'
      });
    }
  });

  // Generate insight analysis using Fireworks AI
  app.post("/api/fireworks/analyze", fireworksRateLimit, async (req, res) => {
    try {
      const { data, analysisType = 'general' } = req.body;

      if (!data) {
        return res.status(400).json({
          success: false,
          error: 'Data is required for analysis'
        });
      }

      logger.info('Generating Fireworks analysis', { analysisType, dataKeys: Object.keys(data) });

      const analysis = await fireworksService.generateInsightAnalysis(data, analysisType);

      res.json({
        success: true,
        analysis,
        analysisType,
        timestamp: new Date().toISOString(),
        provider: 'fireworks-ai'
      });

    } catch (error) {
      logger.error('Fireworks analysis error', { error: error instanceof Error ? error.message : error });
      res.status(500).json({
        success: false,
        error: 'Failed to generate analysis',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate alert summary using Fireworks AI
  app.post("/api/fireworks/alert-summary", fireworksRateLimit, async (req, res) => {
    try {
      const { alerts } = req.body;

      if (!alerts || !Array.isArray(alerts)) {
        return res.status(400).json({
          success: false,
          error: 'Alerts array is required'
        });
      }

      logger.info('Generating Fireworks alert summary', { alertCount: alerts.length });

      const summary = await fireworksService.generateAlertSummary(alerts);

      res.json({
        success: true,
        summary,
        alertCount: alerts.length,
        timestamp: new Date().toISOString(),
        provider: 'fireworks-ai'
      });

    } catch (error) {
      logger.error('Fireworks alert summary error', { error: error instanceof Error ? error.message : error });
      res.status(500).json({
        success: false,
        error: 'Failed to generate alert summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate competitive analysis using Fireworks AI
  app.post("/api/fireworks/competitive", fireworksRateLimit, async (req, res) => {
    try {
      const { competitiveData } = req.body;

      if (!competitiveData) {
        return res.status(400).json({
          success: false,
          error: 'Competitive data is required'
        });
      }

      logger.info('Generating Fireworks competitive analysis', { 
        dataKeys: Object.keys(competitiveData),
        route: competitiveData.route 
      });

      const analysis = await fireworksService.generateCompetitiveAnalysis(competitiveData);

      res.json({
        success: true,
        analysis,
        route: competitiveData.route,
        timestamp: new Date().toISOString(),
        provider: 'fireworks-ai'
      });

    } catch (error) {
      logger.error('Fireworks competitive analysis error', { error: error instanceof Error ? error.message : error });
      res.status(500).json({
        success: false,
        error: 'Failed to generate competitive analysis',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate route optimization using Fireworks AI
  app.post("/api/fireworks/optimize-route", fireworksRateLimit, async (req, res) => {
    try {
      const { routeData } = req.body;

      if (!routeData) {
        return res.status(400).json({
          success: false,
          error: 'Route data is required'
        });
      }

      logger.info('Generating Fireworks route optimization', { 
        route: routeData.route || routeData.routeId,
        dataKeys: Object.keys(routeData)
      });

      const optimization = await fireworksService.generateRouteOptimization(routeData);

      res.json({
        success: true,
        optimization,
        route: routeData.route || routeData.routeId,
        timestamp: new Date().toISOString(),
        provider: 'fireworks-ai'
      });

    } catch (error) {
      logger.error('Fireworks route optimization error', { error: error instanceof Error ? error.message : error });
      res.status(500).json({
        success: false,
        error: 'Failed to generate route optimization',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Custom completion endpoint
  app.post("/api/fireworks/completion", fireworksRateLimit, async (req, res) => {
    try {
      const { messages, model, temperature, maxTokens } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          success: false,
          error: 'Messages array is required'
        });
      }

      logger.info('Generating Fireworks completion', { 
        model: model || 'default',
        messageCount: messages.length,
        temperature,
        maxTokens
      });

      const completion = await fireworksService.generateCompletion(messages, {
        model,
        temperature,
        maxTokens
      });

      res.json({
        success: true,
        completion,
        model: model || 'default',
        timestamp: new Date().toISOString(),
        provider: 'fireworks-ai'
      });

    } catch (error) {
      logger.error('Fireworks completion error', { error: error instanceof Error ? error.message : error });
      res.status(500).json({
        success: false,
        error: 'Failed to generate completion',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  logger.info('Fireworks AI routes registered successfully');
}