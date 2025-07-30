import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { agentService } from "./services/agents";
import { llmService } from "./services/llm";
import { WebSocketService } from "./services/websocket";
import { insertAlertSchema, insertFeedbackSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket service
  const wsService = new WebSocketService(httpServer);
  
  // Initialize agents
  await agentService.initializeAgents();

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Dashboard endpoints
  app.get("/api/dashboard/summary", async (req, res) => {
    try {
      const alerts = await storage.getAlerts(10);
      const agents = await storage.getAgents();
      const metrics = await storage.getSystemMetrics();
      const activities = await storage.getRecentActivities(5);

      // Calculate summary metrics
      const criticalAlerts = alerts.filter(a => a.priority === 'critical');
      const agentAccuracy = agents.reduce((sum, a) => sum + parseFloat(a.accuracy || '0'), 0) / agents.length;

      res.json({
        alerts: {
          total: alerts.length,
          critical: criticalAlerts.length,
          recent: alerts.slice(0, 3)
        },
        agents: agents.map(a => ({
          id: a.id,
          name: a.name,
          status: a.status,
          accuracy: a.accuracy
        })),
        metrics: {
          networkYield: 127.45,
          loadFactor: 87.2,
          agentAccuracy: agentAccuracy.toFixed(1)
        },
        activities: activities
      });
    } catch (error) {
      console.error('Dashboard summary error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard summary' });
    }
  });

  // Alerts endpoints
  app.get("/api/alerts", async (req, res) => {
    try {
      const { priority, limit } = req.query;
      
      let alerts;
      if (priority) {
        alerts = await storage.getAlertsByPriority(priority as string);
      } else {
        alerts = await storage.getAlerts(Number(limit) || 50);
      }
      
      res.json(alerts);
    } catch (error) {
      console.error('Get alerts error:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const alertData = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert(alertData);
      
      // Broadcast new alert via WebSocket
      wsService.broadcastAlert(alert);
      
      res.status(201).json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid alert data', details: error.errors });
      } else {
        console.error('Create alert error:', error);
        res.status(500).json({ error: 'Failed to create alert' });
      }
    }
  });

  app.patch("/api/alerts/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      await storage.updateAlertStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      console.error('Update alert status error:', error);
      res.status(500).json({ error: 'Failed to update alert status' });
    }
  });

  // Agents endpoints
  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAgents();
      res.json(agents);
    } catch (error) {
      console.error('Get agents error:', error);
      res.status(500).json({ error: 'Failed to fetch agents' });
    }
  });

  app.post("/api/agents/:id/feedback", async (req, res) => {
    try {
      const { id: agentId } = req.params;
      const feedbackData = {
        ...insertFeedbackSchema.parse(req.body),
        agentId,
        userId: req.body.userId || 'dev-user' // Development mode
      };
      
      await agentService.processFeedback(feedbackData);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid feedback data', details: error.errors });
      } else {
        console.error('Submit feedback error:', error);
        res.status(500).json({ error: 'Failed to submit feedback' });
      }
    }
  });

  app.post("/api/agents/run/:agentId", async (req, res) => {
    try {
      const { agentId } = req.params;
      
      switch (agentId) {
        case 'competitive':
          await agentService.runCompetitiveAgent();
          break;
        case 'performance':
          await agentService.runPerformanceAgent();
          break;
        case 'network':
          await agentService.runNetworkAgent();
          break;
        default:
          return res.status(400).json({ error: 'Unknown agent ID' });
      }
      
      res.json({ success: true, message: `${agentId} agent executed` });
    } catch (error) {
      console.error('Run agent error:', error);
      res.status(500).json({ error: 'Failed to run agent' });
    }
  });

  // LLM endpoints
  app.post("/api/llm/query", async (req, res) => {
    const startTime = Date.now();
    console.log(`[API] Received LLM query request`);
    
    try {
      const { query, type = 'genie' } = req.body;
      console.log(`[API] Query type: ${type}`);
      console.log(`[API] Query length: ${query?.length || 0} characters`);
      
      if (!query) {
        console.log('[API] Error: Query is required');
        return res.status(400).json({ error: 'Query is required' });
      }
      
      let result;
      if (type === 'genie') {
        console.log('[API] Processing as data query (genie)');
        result = await llmService.processDataQuery(query);
      } else {
        console.log('[API] Processing as strategic analysis');
        result = await llmService.generateStrategicAnalysis(query);
      }
      
      const duration = Date.now() - startTime;
      console.log(`[API] LLM query completed successfully in ${duration}ms`);
      
      res.json(result);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[API] LLM query error after ${duration}ms:`, error);
      res.status(500).json({ error: 'Failed to process query' });
    }
  });

  app.post("/api/llm/provider", async (req, res) => {
    try {
      const { provider } = req.body;
      
      if (!['openai', 'writer'].includes(provider)) {
        return res.status(400).json({ error: 'Invalid provider' });
      }
      
      llmService.setProvider(provider);
      res.json({ success: true, provider });
    } catch (error) {
      console.error('Set LLM provider error:', error);
      res.status(500).json({ error: 'Failed to set provider' });
    }
  });

  // Route performance endpoints
  app.get("/api/routes/performance", async (req, res) => {
    try {
      const { route, days } = req.query;
      const performance = await storage.getRoutePerformance(
        route as string, 
        Number(days) || 7
      );
      res.json(performance);
    } catch (error) {
      console.error('Get route performance error:', error);
      res.status(500).json({ error: 'Failed to fetch route performance' });
    }
  });

  // Conversations endpoints
  app.get("/api/conversations", async (req, res) => {
    try {
      const userId = 'dev-user'; // Development mode
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const conversationData = {
        ...req.body,
        userId: 'dev-user' // Development mode
      };
      
      const conversation = await storage.createConversation(conversationData);
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Create conversation error:', error);
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  });

  // Activities endpoint
  app.get("/api/activities", async (req, res) => {
    try {
      const { limit } = req.query;
      const activities = await storage.getRecentActivities(Number(limit) || 20);
      res.json(activities);
    } catch (error) {
      console.error('Get activities error:', error);
      res.status(500).json({ error: 'Failed to fetch activities' });
    }
  });

  // Background agent execution (simulate overnight processing)
  setInterval(async () => {
    try {
      await agentService.runCompetitiveAgent();
      await agentService.runPerformanceAgent();
      await agentService.runNetworkAgent();
    } catch (error) {
      console.error('Background agent execution error:', error);
    }
  }, 5 * 60 * 1000); // Run every 5 minutes for demo

  return httpServer;
}
