/**
 * Telos Metrics Monitoring System
 * Real-time monitoring and alerting for platform metrics
 * Implements intelligent threshold-based alerting from the comprehensive framework
 */

import { metricsCalculator } from './metricsCalculator.js';
import { metricsRegistry, MetricCategory } from './metricsRegistry.js';
import { WebSocketService } from './websocket.js';
import { storage } from '../storage.js';

export interface MetricAlert {
  id: string;
  metricName: string;
  category: MetricCategory;
  severity: 'info' | 'warning' | 'critical';
  currentValue: number;
  threshold: number;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  escalated: boolean;
}

export interface MonitoringConfig {
  checkIntervalMinutes: number;
  alertCooldownMinutes: number;
  escalationEnabled: boolean;
  notificationChannels: string[];
}

export class TelosMetricsMonitoring {
  private config: MonitoringConfig;
  private activeAlerts: Map<string, MetricAlert>;
  private lastAlertTimes: Map<string, Date>;
  private monitoringInterval?: NodeJS.Timeout;
  private wsService?: WebSocketService;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.activeAlerts = new Map();
    this.lastAlertTimes = new Map();
  }

  setWebSocketService(wsService: WebSocketService) {
    this.wsService = wsService;
  }

  async startMonitoring() {
    console.log('[MetricsMonitoring] Starting continuous monitoring...');
    
    // Initial check
    await this.performMetricsCheck();

    // Schedule regular checks
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performMetricsCheck();
      } catch (error) {
        console.error('[MetricsMonitoring] Error during scheduled check:', error);
      }
    }, this.config.checkIntervalMinutes * 60 * 1000);

    console.log(`[MetricsMonitoring] Monitoring started with ${this.config.checkIntervalMinutes}min intervals`);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log('[MetricsMonitoring] Monitoring stopped');
    }
  }

  private async performMetricsCheck() {
    const now = new Date();
    const dateRange = {
      startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: now.toISOString().slice(0, 10)
    };

    try {
      // Get current metrics
      const [systemMetrics, aiMetrics, businessMetrics, userMetrics] = await Promise.all([
        metricsCalculator.calculateSystemPerformanceMetrics(dateRange),
        metricsCalculator.calculateAIAccuracyMetrics(dateRange),
        metricsCalculator.calculateBusinessImpactMetrics(dateRange),
        metricsCalculator.calculateUserAdoptionMetrics(dateRange)
      ]);

      // Check each metric category for threshold violations
      await this.checkSystemPerformanceThresholds(systemMetrics);
      await this.checkAIAccuracyThresholds(aiMetrics);
      await this.checkBusinessImpactThresholds(businessMetrics);
      await this.checkUserAdoptionThresholds(userMetrics);

      // Broadcast current metrics to connected clients
      if (this.wsService && 'broadcastMessage' in this.wsService) {
        (this.wsService as any).broadcastMessage('metrics_update', {
          timestamp: now.toISOString(),
          system: systemMetrics,
          ai: aiMetrics,
          business: businessMetrics,
          user: userMetrics,
          alerts: Array.from(this.activeAlerts.values())
        });
      }

      console.log(`[MetricsMonitoring] Check completed at ${now.toISOString()}, ${this.activeAlerts.size} active alerts`);
    } catch (error) {
      console.error('[MetricsMonitoring] Error during metrics check:', error);
    }
  }

  private async checkSystemPerformanceThresholds(metrics: any) {
    // System Availability
    await this.checkThreshold(
      'system_availability',
      metrics.systemAvailability.availabilityPercent,
      { target: 99.9, warning: 99.5, critical: 99.0 },
      'System availability has dropped below acceptable levels',
      'higher'
    );

    // Processing Time
    await this.checkThreshold(
      'nightshift_processing_time',
      metrics.nightshiftProcessingTime.avgMinutes,
      { target: 45, warning: 60, critical: 90 },
      'NightShift processing time is exceeding targets',
      'lower'
    );

    // Data Freshness
    await this.checkThreshold(
      'data_freshness',
      metrics.dataFreshness.avgHoursDelay,
      { target: 2, warning: 4, critical: 8 },
      'Data freshness is degrading across sources',
      'lower'
    );
  }

  private async checkAIAccuracyThresholds(metrics: any) {
    // Insight Accuracy
    await this.checkThreshold(
      'insight_accuracy_rate',
      metrics.insightAccuracyRate.overallAccuracy,
      { target: 85, warning: 80, critical: 75 },
      'AI insight accuracy has fallen below acceptable levels',
      'higher'
    );

    // Competitive Alert Precision
    await this.checkThreshold(
      'competitive_alert_precision',
      metrics.competitiveAlertPrecision.precisionRate,
      { target: 70, warning: 60, critical: 50 },
      'Competitive alert precision is declining',
      'higher'
    );

    // Confidence Distribution
    await this.checkThreshold(
      'confidence_score_distribution',
      metrics.confidenceDistribution.highConfidenceRate,
      { target: 75, warning: 65, critical: 50 },
      'AI confidence scores are dropping',
      'higher'
    );
  }

  private async checkBusinessImpactThresholds(metrics: any) {
    // Revenue Impact (monthly target)
    const monthlyRevenue = metrics.revenueImpact.monthlyRevenue || 0;
    await this.checkThreshold(
      'revenue_impact',
      monthlyRevenue,
      { target: 500000, warning: 300000, critical: 200000 },
      'AI-driven revenue impact is below targets',
      'higher'
    );

    // Response Speed
    await this.checkThreshold(
      'competitive_response_speed',
      metrics.competitiveResponseSpeed.avgResponseTimeHours,
      { target: 4, warning: 8, critical: 24 },
      'Competitive response time is too slow',
      'lower'
    );

    // Time Savings
    await this.checkThreshold(
      'analyst_time_savings',
      metrics.analystTimeSavings.avgDailySavingsMinutes,
      { target: 120, warning: 90, critical: 60 },
      'Analyst time savings are below expectations',
      'higher'
    );
  }

  private async checkUserAdoptionThresholds(metrics: any) {
    // Daily Active Users (assuming target of 20 analysts)
    const userRate = (metrics.dailyActiveUsers.avgDailyUsers / 20) * 100;
    await this.checkThreshold(
      'daily_active_users',
      userRate,
      { target: 90, warning: 80, critical: 70 },
      'Daily active user rate is declining',
      'higher'
    );

    // User Satisfaction (NPS)
    await this.checkThreshold(
      'user_satisfaction_score',
      metrics.userSatisfaction.npsScore,
      { target: 50, warning: 30, critical: 10 },
      'User satisfaction (NPS) is below acceptable levels',
      'higher'
    );

    // Insight Action Rate
    await this.checkThreshold(
      'insight_action_rate',
      metrics.insightActionRate.overallActionRate,
      { target: 60, warning: 50, critical: 40 },
      'Insight action rate indicates low user engagement',
      'higher'
    );
  }

  private async checkThreshold(
    metricName: string,
    currentValue: number,
    thresholds: { target: number; warning: number; critical: number },
    baseMessage: string,
    direction: 'higher' | 'lower'
  ) {
    const alertKey = `${metricName}_threshold`;
    const now = new Date();

    // Check if we're in cooldown period
    const lastAlertTime = this.lastAlertTimes.get(alertKey);
    if (lastAlertTime && (now.getTime() - lastAlertTime.getTime()) < (this.config.alertCooldownMinutes * 60 * 1000)) {
      return;
    }

    let severity: 'info' | 'warning' | 'critical' | null = null;
    let threshold = 0;

    if (direction === 'higher') {
      // Higher values are better (availability, accuracy, etc.)
      if (currentValue < thresholds.critical) {
        severity = 'critical';
        threshold = thresholds.critical;
      } else if (currentValue < thresholds.warning) {
        severity = 'warning';
        threshold = thresholds.warning;
      }
    } else {
      // Lower values are better (response time, processing time, etc.)
      if (currentValue > thresholds.critical) {
        severity = 'critical';
        threshold = thresholds.critical;
      } else if (currentValue > thresholds.warning) {
        severity = 'warning';
        threshold = thresholds.warning;
      }
    }

    if (severity) {
      const alert: MetricAlert = {
        id: `${alertKey}_${now.getTime()}`,
        metricName,
        category: this.getMetricCategory(metricName),
        severity,
        currentValue,
        threshold,
        message: `${baseMessage}. Current: ${currentValue.toFixed(2)}, Threshold: ${threshold}`,
        timestamp: now.toISOString(),
        acknowledged: false,
        escalated: false
      };

      this.activeAlerts.set(alertKey, alert);
      this.lastAlertTimes.set(alertKey, now);

      // Store alert in database
      await this.storeAlert(alert);

      // Send notifications
      await this.sendNotification(alert);

      console.log(`[MetricsMonitoring] ${severity.toUpperCase()} alert: ${metricName} = ${currentValue.toFixed(2)}`);
    } else {
      // Metric is healthy, remove any existing alert
      if (this.activeAlerts.has(alertKey)) {
        this.activeAlerts.delete(alertKey);
        console.log(`[MetricsMonitoring] Resolved: ${metricName} back to healthy levels`);
      }
    }
  }

  private getMetricCategory(metricName: string): MetricCategory {
    const metric = metricsRegistry.getMetric(metricName);
    return metric?.category || MetricCategory.SYSTEM_PERFORMANCE;
  }

  private async storeAlert(alert: MetricAlert) {
    try {
      await storage.createAlert({
        type: alert.category,
        priority: alert.severity,
        title: `${alert.metricName} Threshold Alert`,
        description: alert.message,
        status: 'active',
        agent_id: 'metrics_monitoring',
        route: null,
        confidence: "100",
        metadata: {
          currentValue: alert.currentValue,
          threshold: alert.threshold,
          category: alert.category,
          metricAlertId: alert.id
        }
      });
      console.log(`[MetricsMonitoring] Successfully stored alert: ${alert.metricName}`);
    } catch (error) {
      console.error('[MetricsMonitoring] Error storing alert:', error);
      console.error('[MetricsMonitoring] Alert data:', alert);
    }
  }

  private async sendNotification(alert: MetricAlert) {
    // WebSocket notification
    if (this.wsService && 'broadcastMessage' in this.wsService) {
      (this.wsService as any).broadcastMessage('metric_alert', alert);
    }

    // Log notification (in production, this would integrate with Slack, email, etc.)
    console.log(`[MetricsMonitoring] NOTIFICATION: ${alert.severity.toUpperCase()} - ${alert.message}`);

    // Escalation logic
    if (alert.severity === 'critical' && this.config.escalationEnabled) {
      setTimeout(() => {
        this.escalateAlert(alert);
      }, 30 * 60 * 1000); // Escalate after 30 minutes
    }
  }

  private async escalateAlert(alert: MetricAlert) {
    if (!this.activeAlerts.has(`${alert.metricName}_threshold`)) {
      return; // Alert was resolved
    }

    alert.escalated = true;
    console.log(`[MetricsMonitoring] ESCALATED: ${alert.message}`);
    
    // In production, this would trigger escalation to management
    if (this.wsService && 'broadcastMessage' in this.wsService) {
      (this.wsService as any).broadcastMessage('alert_escalation', alert);
    }
  }

  async acknowledgeAlert(alertId: string, analystId: string) {
    const alertKey = Object.keys(Object.fromEntries(this.activeAlerts)).find(key => 
      this.activeAlerts.get(key)?.id === alertId
    );

    if (alertKey) {
      const alert = this.activeAlerts.get(alertKey);
      if (alert) {
        alert.acknowledged = true;
        console.log(`[MetricsMonitoring] Alert acknowledged: ${alertId} by ${analystId}`);
        
        if (this.wsService && 'broadcastMessage' in this.wsService) {
          (this.wsService as any).broadcastMessage('alert_acknowledged', { alertId, analystId });
        }
      }
    }
  }

  getActiveAlerts(): MetricAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  getMetricsStatus() {
    return {
      monitoringActive: !!this.monitoringInterval,
      checkInterval: this.config.checkIntervalMinutes,
      activeAlertsCount: this.activeAlerts.size,
      lastCheckTime: new Date().toISOString(),
      alertsByCategory: this.groupAlertsByCategory()
    };
  }

  private groupAlertsByCategory() {
    const categories: Record<string, number> = {};
    
    for (const alert of Array.from(this.activeAlerts.values())) {
      categories[alert.category] = (categories[alert.category] || 0) + 1;
    }

    return categories;
  }
}

// Export default configuration
export const defaultMonitoringConfig: MonitoringConfig = {
  checkIntervalMinutes: 15,
  alertCooldownMinutes: 60,
  escalationEnabled: true,
  notificationChannels: ['websocket', 'console']
};

// Export singleton instance
export const metricsMonitoring = new TelosMetricsMonitoring(defaultMonitoringConfig);