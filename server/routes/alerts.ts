import type { Express } from "express";
import { AlertController } from "../controllers/AlertController";

export async function alertRoutes(app: Express) {
  // Get alerts with optional priority filtering
  app.get("/api/alerts", AlertController.getAlerts);

  // Create a new alert
  app.post("/api/alerts", AlertController.createAlert);

  // Update alert status
  app.patch("/api/alerts/:id/status", AlertController.updateAlertStatus);

  // Generate a single alert for testing
  app.post("/api/alerts/generate", AlertController.generateAlert);

  // Cleanup metrics-generated junk alerts
  app.delete("/api/alerts/cleanup-metrics", AlertController.cleanupMetricsAlerts);

  // Alert routes registered successfully
}