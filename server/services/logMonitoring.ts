// Log Monitoring Service for Development Error Tracking
// Provides API endpoints to access comprehensive system logs

import { logger } from './logger.js';

export class LogMonitoringService {
  // Get recent system logs for debugging
  getRecentLogs(count: number = 100, level?: number) {
    return logger.getRecentLogs(count, level);
  }

  // Get error summary for health monitoring
  getErrorSummary(minutesBack: number = 60) {
    return logger.getErrorSummary(minutesBack);
  }

  // Get logs for specific service
  getServiceLogs(serviceName: string, count: number = 50) {
    const allLogs = logger.getRecentLogs(500);
    return allLogs
      .filter(log => log.service.toLowerCase().includes(serviceName.toLowerCase()))
      .slice(-count);
  }

  // Get performance metrics from logs
  getPerformanceMetrics() {
    const allLogs = logger.getRecentLogs(200);
    const operationLogs = allLogs.filter(log => log.duration !== undefined);
    
    if (operationLogs.length === 0) {
      return {
        averageResponseTime: 0,
        slowestOperations: [],
        fastestOperations: [],
        totalOperations: 0
      };
    }

    const durations = operationLogs.map(log => log.duration!);
    const avgDuration = durations.reduce((sum, dur) => sum + dur, 0) / durations.length;
    
    const sorted = operationLogs.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    
    return {
      averageResponseTime: Math.round(avgDuration),
      slowestOperations: sorted.slice(0, 5).map(log => ({
        service: log.service,
        operation: log.operation,
        duration: log.duration,
        timestamp: log.timestamp
      })),
      fastestOperations: sorted.slice(-5).map(log => ({
        service: log.service,
        operation: log.operation,
        duration: log.duration,
        timestamp: log.timestamp
      })),
      totalOperations: operationLogs.length
    };
  }

  // Clear old logs
  clearOldLogs() {
    logger.clearOldLogs();
    return { message: 'Old logs cleared successfully' };
  }

  // Get system health from logs
  getSystemHealth() {
    const errorSummary = this.getErrorSummary(30); // Last 30 minutes
    const performanceMetrics = this.getPerformanceMetrics();
    
    let healthScore = 100;
    
    // Deduct points for errors
    healthScore -= errorSummary.totalErrors * 2;
    healthScore -= errorSummary.criticalErrors * 10;
    
    // Deduct points for slow performance
    if (performanceMetrics.averageResponseTime > 1000) {
      healthScore -= 20;
    } else if (performanceMetrics.averageResponseTime > 500) {
      healthScore -= 10;
    }
    
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    let status = 'healthy';
    if (healthScore < 50) {
      status = 'critical';
    } else if (healthScore < 80) {
      status = 'warning';
    }
    
    return {
      score: healthScore,
      status,
      errors: errorSummary,
      performance: performanceMetrics,
      timestamp: new Date().toISOString()
    };
  }
}

export const logMonitoringService = new LogMonitoringService();