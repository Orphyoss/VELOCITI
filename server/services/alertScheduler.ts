/**
 * Alert Generation Scheduler
 * Automatically runs AI agents to generate fresh airline intelligence alerts
 */

import { agentService } from './agents.js';
import { enhancedAlertGenerator } from './enhancedAlertGenerator.js';
import { logger } from './logger.js';

export class AlertScheduler {
  private schedulerInterval?: NodeJS.Timeout;
  private isRunning = false;
  private lastRunTime?: Date;
  
  constructor(private intervalMinutes: number = 45) {
    // Default to 45 minutes to ensure fresh alerts throughout the day
  }

  start() {
    if (this.isRunning) {
      logger.info('AlertScheduler', 'start', 'Scheduler already running');
      return;
    }

    this.isRunning = true;
    logger.info('AlertScheduler', 'start', `Starting alert generation scheduler with ${this.intervalMinutes}min intervals`);
    
    // Run immediately on startup
    this.generateAlerts();
    
    // Schedule regular runs
    this.schedulerInterval = setInterval(() => {
      this.generateAlerts();
    }, this.intervalMinutes * 60 * 1000);
  }

  stop() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = undefined;
    }
    this.isRunning = false;
    logger.info('AlertScheduler', 'stop', 'Alert generation scheduler stopped');
  }

  private async generateAlerts() {
    try {
      const startTime = new Date();
      logger.info('AlertScheduler', 'generateAlerts', 'Starting scheduled alert generation');

      // Run agents with different probabilities to create variety
      const promises = [];

      // Competitive Agent - 70% chance
      if (Math.random() > 0.3) {
        promises.push(this.runAgentWithRetry('competitive'));
      }

      // Performance Agent - 60% chance  
      if (Math.random() > 0.4) {
        promises.push(this.runAgentWithRetry('performance'));
      }

      // Network Agent - 50% chance
      if (Math.random() > 0.5) {
        promises.push(this.runAgentWithRetry('network'));
      }

      // Enhanced scenarios - 40% chance for 1-2 alerts
      if (Math.random() > 0.6) {
        const scenarioTypes = ['competitive', 'demand', 'operational', 'system', 'economic'];
        const randomType = scenarioTypes[Math.floor(Math.random() * scenarioTypes.length)];
        const alertCount = Math.random() > 0.7 ? 2 : 1;
        promises.push(this.generateEnhancedScenarios(randomType, alertCount));
      }

      // Wait for all agent runs to complete
      await Promise.allSettled(promises);

      const duration = new Date().getTime() - startTime.getTime();
      this.lastRunTime = startTime;
      
      logger.info('AlertScheduler', 'generateAlerts', `Scheduled alert generation completed in ${duration}ms`, {
        agents_run: promises.length,
        timestamp: startTime.toISOString()
      });

    } catch (error) {
      logger.error('AlertScheduler', 'generateAlerts', 'Error during scheduled alert generation', error);
    }
  }

  private async runAgentWithRetry(agentType: 'competitive' | 'performance' | 'network', retries = 2) {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        switch (agentType) {
          case 'competitive':
            await agentService.runCompetitiveAgent();
            break;
          case 'performance':
            await agentService.runPerformanceAgent();
            break;
          case 'network':
            await agentService.runNetworkAgent();
            break;
        }
        
        logger.info('AlertScheduler', 'runAgentWithRetry', `${agentType} agent completed successfully`);
        return;
        
      } catch (error) {
        if (attempt <= retries) {
          logger.warn('AlertScheduler', 'runAgentWithRetry', `${agentType} agent failed (attempt ${attempt}/${retries + 1}), retrying...`, error);
          await this.delay(1000 * attempt); // Progressive delay
        } else {
          logger.error('AlertScheduler', 'runAgentWithRetry', `${agentType} agent failed after ${retries + 1} attempts`, error);
        }
      }
    }
  }

  private async generateEnhancedScenarios(type: string, count: number) {
    try {
      const validTypes = ['competitive', 'demand', 'operational', 'system', 'economic'];
      const scenarioType = validTypes.includes(type) ? type as 'competitive' | 'demand' | 'operational' | 'system' | 'economic' : 'competitive';
      await enhancedAlertGenerator.generateAlertsByType(scenarioType, count);
      logger.info('AlertScheduler', 'generateEnhancedScenarios', `Generated ${count} enhanced ${type} scenarios`);
    } catch (error) {
      logger.error('AlertScheduler', 'generateEnhancedScenarios', `Failed to generate enhanced ${type} scenarios`, error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Status methods
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.intervalMinutes,
      lastRunTime: this.lastRunTime?.toISOString(),
      nextRunTime: this.lastRunTime 
        ? new Date(this.lastRunTime.getTime() + this.intervalMinutes * 60 * 1000).toISOString()
        : null
    };
  }

  // Manual trigger for testing
  async triggerManualRun() {
    logger.info('AlertScheduler', 'triggerManualRun', 'Manual alert generation triggered');
    await this.generateAlerts();
  }
}

// Create and export singleton instance
export const alertScheduler = new AlertScheduler(45); // 45 minutes