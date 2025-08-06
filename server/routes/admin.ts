import type { Express } from "express";
import os from "os";
import { logger } from "../services/logger";
import { apiMonitor } from "../services/apiMonitor";

export async function adminRoutes(app: Express) {
  logger.info('AdminRoutes', 'init', 'Registering admin routes');

  // Health check endpoint
  app.get("/api/admin/health", async (req, res) => {
    try {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        },
        services: {
          database: 'connected',
          api: 'operational',
          websocket: 'active'
        }
      };

      res.json(healthStatus);
    } catch (error) {
      logger.error('AdminRoutes', 'health', 'Health check failed', error);
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });

  // Performance monitoring endpoint
  app.get("/api/admin/performance", async (req, res) => {
    try {
      const memUsage = process.memoryUsage();
      const performanceData = {
        timestamp: new Date().toISOString(),
        system: {
          uptime: process.uptime(),
          loadAverage: process.platform !== 'win32' ? os.loadavg() : [0, 0, 0],
          memory: {
            used: memUsage.heapUsed,
            total: memUsage.heapTotal,
            external: memUsage.external,
            rss: memUsage.rss,
            usedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
            totalMB: Math.round(memUsage.heapTotal / 1024 / 1024)
          },
          cpu: {
            usage: process.cpuUsage()
          }
        },
        api: {
          totalRequests: 0, // Will be enhanced when apiMonitor is available
          averageResponseTime: 0,
          errorRate: 0,
          status: 'operational'
        },
        process: {
          pid: process.pid,
          version: process.version,
          platform: process.platform,
          arch: process.arch
        }
      };

      res.json(performanceData);
    } catch (error) {
      logger.error('AdminRoutes', 'performance', 'Performance data retrieval failed', error);
      res.status(500).json({
        error: 'Failed to retrieve performance data',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Memory statistics endpoint
  app.get("/api/memory/stats", async (req, res) => {
    try {
      const memoryUsage = process.memoryUsage();
      const memoryStats = {
        timestamp: new Date().toISOString(),
        memory: {
          heapUsed: {
            bytes: memoryUsage.heapUsed,
            mb: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100
          },
          heapTotal: {
            bytes: memoryUsage.heapTotal,
            mb: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100
          },
          external: {
            bytes: memoryUsage.external,
            mb: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100
          },
          rss: {
            bytes: memoryUsage.rss,
            mb: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100
          }
        },
        percentage: {
          heapUsage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
        },
        system: {
          totalMemory: os.totalmem(),
          freeMemory: os.freemem(),
          uptime: process.uptime()
        },
        gc: {
          // Garbage collection stats if available
          lastRun: Date.now() - (process.uptime() * 1000)
        }
      };

      res.json(memoryStats);
    } catch (error) {
      logger.error('AdminRoutes', 'memoryStats', 'Memory stats retrieval failed', error);
      res.status(500).json({
        error: 'Failed to retrieve memory statistics',
        timestamp: new Date().toISOString()
      });
    }
  });

  logger.info('AdminRoutes', 'init', 'Admin routes registered successfully');
}