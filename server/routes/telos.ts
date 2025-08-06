import type { Express } from "express";
import { Router } from 'express';
import { telosIntelligenceService } from '../services/telos-intelligence';
import { telosOrchestrator } from '../services/telos-agents';

export async function telosRoutes(app: Express): Promise<void> {
  // Import the existing telos router from server/api/telos.ts
  const telosModule = await import('../api/telos');
  const telosRouter = telosModule.default || telosModule.router;
  
  // Register the telos routes under /api/telos
  app.use('/api/telos', telosRouter);
  
  console.log("✅ Telos routes registered");
}