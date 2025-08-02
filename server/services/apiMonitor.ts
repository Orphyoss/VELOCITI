import cron from 'node-cron';

export interface APIHealthCheck {
  service: string;
  endpoint: string;
  status: 'online' | 'offline' | 'degraded';
  responseTime: number;
  lastChecked: string;
  uptime: number;
  errorCount: number;
  lastError?: string;
}

export interface PerformanceMetric {
  timestamp: string;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userAgent?: string;
  ip?: string;
}

export class APIMonitorService {
  private healthChecks: Map<string, APIHealthCheck> = new Map();
  private performanceMetrics: PerformanceMetric[] = [];
  private maxMetricsHistory = 10000; // Keep last 10k requests
  private cronJob?: any;

  constructor() {
    this.initializeHealthChecks();
    this.startHealthCheckCron();
  }

  private initializeHealthChecks() {
    const services = [
      { service: 'OpenAI', endpoint: 'https://api.openai.com/v1/models' },
      { service: 'Pinecone', endpoint: 'https://api.pinecone.io/actions/whoami' },
      { service: 'Writer API', endpoint: 'https://api.writer.com/v1/models' },
      { service: 'Internal API', endpoint: 'http://localhost:5000/api/agents' }
    ];

    services.forEach(({ service, endpoint }) => {
      this.healthChecks.set(service, {
        service,
        endpoint,
        status: 'offline',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        uptime: 0,
        errorCount: 0
      });
    });
  }

  private startHealthCheckCron() {
    // Run health checks every 5 minutes
    this.cronJob = cron.schedule('*/5 * * * *', async () => {
      await this.runHealthChecks();
    });

    // Run initial check
    setTimeout(() => this.runHealthChecks(), 1000);
  }

  private async runHealthChecks() {
    console.log('[APIMonitor] Running health checks...');
    
    for (const [serviceName, healthCheck] of Array.from(this.healthChecks.entries())) {
      try {
        const startTime = Date.now();
        let response: { ok: boolean; error?: string } | undefined;
        
        if (serviceName === 'OpenAI') {
          response = await this.checkOpenAI();
        } else if (serviceName === 'Pinecone') {
          response = await this.checkPinecone();
        } else if (serviceName === 'Writer API') {
          response = await this.checkWriterAPI();
        } else if (serviceName === 'Internal API') {
          response = await this.checkInternalAPI();
        }
        
        if (!response) {
          throw new Error('No response from health check');
        }
        
        const responseTime = Date.now() - startTime;
        
        this.healthChecks.set(serviceName, {
          ...healthCheck,
          status: response.ok ? 'online' : 'degraded',
          responseTime,
          lastChecked: new Date().toISOString(),
          uptime: response.ok ? healthCheck.uptime + 1 : healthCheck.uptime,
          errorCount: response.ok ? healthCheck.errorCount : healthCheck.errorCount + 1,
          lastError: response.ok ? undefined : response.error
        });

        console.log(`[APIMonitor] ${serviceName}: ${response.ok ? 'OK' : 'ERROR'} (${responseTime}ms)`);
      } catch (error) {
        console.error(`[APIMonitor] Error checking ${serviceName}:`, error);
        
        this.healthChecks.set(serviceName, {
          ...healthCheck,
          status: 'offline',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          errorCount: healthCheck.errorCount + 1,
          lastError: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  private async checkOpenAI(): Promise<{ ok: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      return { ok: response.ok, error: response.ok ? undefined : `HTTP ${response.status}` };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async checkPinecone(): Promise<{ ok: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.pinecone.io/actions/whoami', {
        headers: {
          'Api-Key': process.env.PINECONE_API_KEY!,
        },
        signal: AbortSignal.timeout(10000)
      });
      
      return { ok: response.ok, error: response.ok ? undefined : `HTTP ${response.status}` };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async checkWriterAPI(): Promise<{ ok: boolean; error?: string }> {
    try {
      if (!process.env.WRITER_API_KEY) {
        return { ok: false, error: 'Writer API key not configured' };
      }

      const response = await fetch('https://api.writer.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.WRITER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      return { ok: response.ok, error: response.ok ? undefined : `HTTP ${response.status}` };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async checkInternalAPI(): Promise<{ ok: boolean; error?: string }> {
    try {
      const response = await fetch('http://localhost:5000/api/agents', {
        signal: AbortSignal.timeout(5000)
      });
      
      return { ok: response.ok, error: response.ok ? undefined : `HTTP ${response.status}` };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  logRequest(metric: PerformanceMetric) {
    this.performanceMetrics.push(metric);
    
    // Keep only recent metrics
    if (this.performanceMetrics.length > this.maxMetricsHistory) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetricsHistory);
    }
  }

  getHealthChecks(): APIHealthCheck[] {
    return Array.from(this.healthChecks.values()).map(check => {
      // Calculate uptime percentage
      const totalChecks = check.uptime + check.errorCount;
      const uptimePercentage = totalChecks > 0 ? Math.round((check.uptime / totalChecks) * 100) : 0;
      
      return {
        ...check,
        uptime: uptimePercentage
      };
    });
  }

  getPerformanceMetrics(hours: number = 24): PerformanceMetric[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    return this.performanceMetrics.filter(metric => metric.timestamp >= cutoff);
  }

  getPerformanceStats(hours: number = 24) {
    const metrics = this.getPerformanceMetrics(hours);
    
    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 0,
        errorRate: 0,
        endpointStats: {}
      };
    }

    const successfulRequests = metrics.filter(m => m.statusCode >= 200 && m.statusCode < 400);
    const totalResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0);
    
    // Group by endpoint
    const endpointStats: Record<string, any> = {};
    metrics.forEach(metric => {
      if (!endpointStats[metric.endpoint]) {
        endpointStats[metric.endpoint] = {
          count: 0,
          totalResponseTime: 0,
          errors: 0
        };
      }
      
      endpointStats[metric.endpoint].count++;
      endpointStats[metric.endpoint].totalResponseTime += metric.responseTime;
      if (metric.statusCode >= 400) {
        endpointStats[metric.endpoint].errors++;
      }
    });

    // Calculate averages for each endpoint
    Object.keys(endpointStats).forEach(endpoint => {
      const stats = endpointStats[endpoint];
      stats.averageResponseTime = stats.totalResponseTime / stats.count;
      stats.errorRate = (stats.errors / stats.count) * 100;
    });

    return {
      totalRequests: metrics.length,
      averageResponseTime: totalResponseTime / metrics.length,
      successRate: (successfulRequests.length / metrics.length) * 100,
      errorRate: ((metrics.length - successfulRequests.length) / metrics.length) * 100,
      endpointStats
    };
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.destroy();
    }
  }
}

export const apiMonitor = new APIMonitorService();