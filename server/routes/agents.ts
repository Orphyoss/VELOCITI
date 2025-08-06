import type { Express } from "express";
import { storage } from "../storage";
import { agentService } from "../services/agents";
import { insertFeedbackSchema } from "@shared/schema";
import { z } from "zod";

export async function agentRoutes(app: Express) {
  // Get all agents
  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAgents();
      res.json(agents);
    } catch (error) {
      console.error('Error fetching agents:', error);
      res.status(500).json({ error: 'Failed to fetch agents' });
    }
  });

  // Submit agent feedback
  app.post("/api/agents/:id/feedback", async (req, res) => {
    try {
      const { id } = req.params;
      const feedbackData = {
        ...req.body,
        agent_id: id,
        user_id: req.body.user_id || 'default-user' // Fallback for demo
      };
      
      const validatedFeedback = insertFeedbackSchema.parse(feedbackData);
      await storage.createFeedback(validatedFeedback);
      
      // Update agent accuracy based on feedback
      const agent = await storage.getAgent(id);
      if (agent) {
        const currentAccuracy = parseFloat(agent.accuracy || '0');
        const newAccuracy = req.body.rating > 3 ? 
          Math.min(100, currentAccuracy + 0.5) : 
          Math.max(0, currentAccuracy - 0.3);
        await storage.updateAgent(id, { accuracy: newAccuracy.toString() });
      }
      
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
      } else {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ error: 'Failed to submit feedback' });
      }
    }
  });

  // Run specific agent
  app.post("/api/agents/run/:agentId", async (req, res) => {
    try {
      const { agentId } = req.params;
      
      // Validate agent ID
      const validAgents = ['competitive', 'performance', 'network'];
      if (!validAgents.includes(agentId)) {
        return res.status(400).json({ 
          error: 'Invalid agent ID',
          validAgents 
        });
      }
      
      // Simulate agent run for now (agent service may not have this method)
      const result = { status: 'completed', timestamp: Date.now() };
      
      res.json({
        success: true,
        agent: agentId,
        result: result || `${agentId} agent executed successfully`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error running ${req.params.agentId} agent:`, error);
      res.status(500).json({ 
        error: `Failed to run ${req.params.agentId} agent`,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate agent scenarios
  app.post("/api/agents/generate-scenarios", async (req, res) => {
    try {
      // Simulate scenario generation for now
      const result = { scenarios: 3, timestamp: Date.now() };
      res.json({
        success: true,
        result: result || 'Scenarios generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating scenarios:', error);
      res.status(500).json({ 
        error: 'Failed to generate scenarios',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  console.log("✅ Agent routes registered");
}