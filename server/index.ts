import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes/index";
import { setupVite, serveStatic, log } from "./vite";
import { apiLimiter, corsOptions, securityHeaders } from "./middleware/security.js";
import { sanitizeInput } from "./middleware/sanitization.js";
import { errorHandler } from "./middleware/errorHandler.js";
import cors from 'cors';

const app = express();

// Apply security middleware first
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(apiLimiter);

app.use(express.json({ limit: '10mb' })); // Reasonable limit for airline data
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(sanitizeInput);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Use our enhanced error handler
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    // Setup middleware to prioritize API routes over Vite
    app.use('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) {
        // Let API routes be handled by Express
        return next();
      }
      next();
    });
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // DEPLOYMENT FIX: Handle Replit deployment port conflicts intelligently
  // During development: use 5000, during production deployment: handle conflicts gracefully
  let port = parseInt(process.env.PORT || '5000', 10);
  
  // Check if we're in a deployment context where port conflicts might occur
  const isDeployment = process.env.NODE_ENV === 'production';
  const isDevServerActive = port === 5000 && isDeployment;
  
  if (isDevServerActive) {
    // In deployment, test if development port is occupied and use fallback logic
    try {
      const net = await import('net');
      const testConnection = await new Promise((resolve, reject) => {
        const testServer = net.createServer();
        const timeout = setTimeout(() => {
          testServer.close();
          resolve('timeout');
        }, 1000);
        
        testServer.listen(port, '0.0.0.0', () => {
          clearTimeout(timeout);
          testServer.close(() => resolve('available'));
        });
        
        testServer.on('error', (err: any) => {
          clearTimeout(timeout);
          if (err.code === 'EADDRINUSE') {
            resolve('occupied');
          } else {
            reject(err);
          }
        });
      });
      
      if (testConnection === 'occupied') {
        // Development server is running, deployment should use different approach
        console.log('[DEPLOY] Development server detected on port 5000');
        console.log('[DEPLOY] Deployment will terminate to avoid conflicts');
        console.log('[DEPLOY] Please stop development server before deploying');
        process.exit(1);
      }
    } catch (error) {
      console.log('[DEPLOY] Port check failed, proceeding with deployment on', port);
    }
  }
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
