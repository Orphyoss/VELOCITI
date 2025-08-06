import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketService } from "../services/websocket";
import { agentService } from "../services/agents";
import { alertRoutes } from "./alerts";
import { agentRoutes } from "./agents";
import { metricsRoutes } from "./metrics";
import { debugRoutes } from "./debug";
import { dashboardRoutes } from "./dashboard";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket service
  const wsService = new WebSocketService(httpServer);
  
  // Initialize agents
  await agentService.initializeAgents();

  // DISABLED: Metrics monitoring was generating repetitive low-quality alerts
  // Focus on AI agent generated alerts for airline intelligence instead
  // metricsMonitoring.setWebSocketService(wsService);
  // metricsMonitoring.startMonitoring();

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Register modular routes
  await alertRoutes(app);
  await agentRoutes(app);
  await metricsRoutes(app);
  await dashboardRoutes(app);
  await debugRoutes(app);

  console.log("✅ All routes registered successfully");
  
  return httpServer;
}