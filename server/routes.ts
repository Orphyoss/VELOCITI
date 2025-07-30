import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { agentService } from "./services/agents";
import { llmService } from "./services/llm";
import { pineconeService } from "./services/pinecone";
import { documentProcessor } from "./services/documentProcessor";
import { apiMonitor, type PerformanceMetric } from "./services/apiMonitor";
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
      const { query, type = 'genie', useRAG = false } = req.body;
      console.log(`[API] Query type: ${type}`);
      console.log(`[API] Query length: ${query?.length || 0} characters`);
      console.log(`[API] RAG enabled: ${useRAG}`);
      
      if (!query) {
        console.log('[API] Error: Query is required');
        return res.status(400).json({ error: 'Query is required' });
      }
      
      let context = '';
      
      // Add RAG context if enabled
      if (useRAG) {
        console.log(`[RAG] Searching for relevant context...`);
        const ragResults = await pineconeService.searchSimilar(query, 3);
        
        if (ragResults.length > 0) {
          context = ragResults.map(result => 
            `Source: ${result.metadata.filename}\n${result.text}`
          ).join('\n\n---\n\n');
          
          console.log(`[RAG] Found ${ragResults.length} relevant documents`);
          console.log(`[RAG] Context length: ${context.length} characters`);
        } else {
          console.log(`[RAG] No relevant documents found`);
        }
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

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const supportedTypes = documentProcessor.getSupportedTypes();
      if (supportedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}`));
      }
    }
  });

  // Middleware to log API performance
  app.use((req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const metric: PerformanceMetric = {
        timestamp: new Date().toISOString(),
        endpoint: req.path,
        method: req.method,
        responseTime,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      };
      
      apiMonitor.logRequest(metric);
    });
    
    next();
  });

  // Document Management Routes
  app.post("/api/admin/documents/upload", upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log(`[Admin] Processing upload: ${req.file.originalname}`);
      
      const processed = await documentProcessor.processDocument(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      await pineconeService.upsertDocument(processed.chunks);

      res.json({
        success: true,
        document: {
          filename: processed.filename,
          fileType: processed.fileType,
          fileSize: processed.fileSize,
          chunks: processed.chunks.length
        }
      });
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({ error: 'Failed to process document' });
    }
  });

  app.get("/api/admin/documents", async (req, res) => {
    try {
      const documents = await pineconeService.listDocuments();
      
      res.json({
        documents,
        stats: {
          totalVectors: documents.length,
          namespaces: { "": { recordCount: documents.length } }
        }
      });
    } catch (error) {
      console.error('List documents error:', error);
      // Return empty result instead of error
      res.json({
        documents: [],
        stats: {
          totalVectors: 0,
          namespaces: { "": { recordCount: 0 } }
        }
      });
    }
  });

  app.delete("/api/admin/documents/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      await pineconeService.deleteDocument(filename);
      
      console.log(`[Admin] Deleted document: ${filename}`);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  });

  app.post("/api/admin/documents/search", async (req, res) => {
    try {
      const { query, topK = 5 } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const results = await pineconeService.searchSimilar(query, topK);
      res.json({ results });
    } catch (error) {
      console.error('Document search error:', error);
      res.status(500).json({ error: 'Failed to search documents' });
    }
  });

  // API Monitoring Routes
  app.get("/api/admin/health", async (req, res) => {
    try {
      const healthChecks = apiMonitor.getHealthChecks();
      res.json({ healthChecks });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({ error: 'Failed to fetch health status' });
    }
  });

  app.get("/api/admin/performance", async (req, res) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const stats = apiMonitor.getPerformanceStats(hours);
      const metrics = apiMonitor.getPerformanceMetrics(hours);
      
      res.json({
        stats,
        recentMetrics: metrics.slice(-100) // Last 100 requests
      });
    } catch (error) {
      console.error('Performance stats error:', error);
      res.status(500).json({ error: 'Failed to fetch performance data' });
    }
  });

  // Memory system endpoints
  const { memoryService } = await import('./services/memoryService');

  app.get('/api/memory/stats', async (req, res) => {
    try {
      const stats = await memoryService.getMemoryStats();
      res.json(stats);
    } catch (error) {
      console.error('Memory stats error:', error);
      res.status(500).json({ error: 'Failed to get memory stats' });
    }
  });

  app.post('/api/memory/feedback', async (req, res) => {
    try {
      const { agentId, query, response, feedback, userId } = req.body;
      
      if (!agentId || !query || !response || !feedback || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await memoryService.recordAgentFeedback(agentId, query, response, feedback, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Memory feedback error:', error);
      res.status(500).json({ error: 'Failed to record feedback' });
    }
  });

  app.post('/api/memory/enhance-query', async (req, res) => {
    try {
      const { query, userId, sessionId } = req.body;
      
      if (!query || !userId || !sessionId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const enhanced = await memoryService.enhanceQueryWithMemory(query, userId, sessionId);
      res.json(enhanced);
    } catch (error) {
      console.error('Query enhancement error:', error);
      res.status(500).json({ error: 'Failed to enhance query' });
    }
  });

  app.delete('/api/memory/context/:userId/:sessionId', async (req, res) => {
    try {
      const { userId, sessionId } = req.params;
      await memoryService.clearUserContext(userId, sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error('Clear context error:', error);
      res.status(500).json({ error: 'Failed to clear context' });
    }
  });

  return httpServer;
}
