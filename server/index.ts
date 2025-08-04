import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // For Replit deployments: Check if port 5000 is already in use by dev server
  // If so, automatically use alternative port to avoid conflicts
  let port = parseInt(process.env.PORT || '5000', 10);
  
  // In production, if port 5000 is specified but we detect dev server conflict, use 3001
  if (process.env.NODE_ENV === 'production' && port === 5000) {
    // Check if development server is already running on 5000
    const net = await import('net');
    const isPortInUse = await new Promise((resolve) => {
      const testServer = net.createServer();
      testServer.listen(5000, () => {
        testServer.close(() => resolve(false));
      });
      testServer.on('error', () => resolve(true));
    });
    
    if (isPortInUse) {
      port = 3001; // Use alternative port to avoid conflict
      console.log('[DEPLOY] Port 5000 in use, using port 3001 for production');
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
