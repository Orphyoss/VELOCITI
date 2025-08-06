import type { Express } from "express";
import { MetricsController } from "../controllers/MetricsController";

export async function metricsRoutes(app: Express) {
  // Dashboard summary with real metrics
  app.get("/api/dashboard/summary", MetricsController.getDashboardSummary);

  // Alerts metrics
  app.get("/api/metrics/alerts", MetricsController.getAlertsMetrics);

  // Metrics routes registered successfully
}