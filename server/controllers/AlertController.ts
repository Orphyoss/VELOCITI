import type { Request, Response } from "express";
import { storage } from "../storage";
import { enhancedAlertGenerator } from "../services/enhancedAlertGenerator";
import { insertAlertSchema } from "@shared/schema";
import { z } from "zod";

export class AlertController {
  static async getAlerts(req: Request, res: Response) {
    try {
      const priority = req.query.priority as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const alerts = await storage.getAlerts(priority, limit);
      
      // Ensure consistent data structure for frontend
      const formattedAlerts = (alerts || []).map(alert => ({
        ...alert,
        type: alert.category || alert.type || 'alert',
        message: alert.title || alert.description || 'Alert notification',
        agentName: alert.agentName || AlertController.getAgentDisplayName(alert.agent_id)
      }));
      
      res.json(formattedAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  }

  static async createAlert(req: Request, res: Response) {
    try {
      const validatedData = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert(validatedData);
      res.status(201).json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
      } else {
        console.error('Error creating alert:', error);
        res.status(500).json({ error: 'Failed to create alert' });
      }
    }
  }

  static async updateAlertStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      await storage.updateAlertStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating alert status:', error);
      res.status(500).json({ error: 'Failed to update alert status' });
    }
  }

  static async generateAlert(req: Request, res: Response) {
    try {
      const result = await enhancedAlertGenerator.generateSingleAlert();
      res.json({ 
        success: true, 
        alert: result,
        message: 'Alert generated successfully' 
      });
    } catch (error) {
      console.error('Error generating alert:', error);
      res.status(500).json({ error: 'Failed to generate alert' });
    }
  }

  static async cleanupMetricsAlerts(req: Request, res: Response) {
    try {
      // Delete alerts with repetitive system monitoring titles
      const junkTitles = [
        'Insight Accuracy Rate Alert',
        'Analyst Time Savings Alert', 
        'AI insight accuracy has fallen below acceptable levels',
        'Analyst time savings are below expectations',
        'Competitive alert precision is declining',
        'AI confidence scores are dropping'
      ];
      
      let deletedCount = 0;
      for (const title of junkTitles) {
        const { client } = await import('../db.js');
        const result = await client`
          DELETE FROM alerts 
          WHERE title LIKE ${`%${title}%`} OR description LIKE ${`%${title}%`}
        `;
        deletedCount += result.count || 0;
      }
      
      res.json({ 
        success: true, 
        deletedCount, 
        message: `Cleaned up ${deletedCount} repetitive system monitoring alerts` 
      });
    } catch (error) {
      console.error('Error cleaning up metrics alerts:', error);
      res.status(500).json({ error: 'Failed to clean up alerts' });
    }
  }

  private static getAgentDisplayName(agentId: string): string {
    switch (agentId) {
      case 'competitive': return 'Competitive';
      case 'performance': return 'Performance';
      case 'network': return 'Network';
      default: return 'System';
    }
  }
}