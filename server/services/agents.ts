import { db } from './supabase';
import { alerts, agents, feedback, routePerformance, activities } from '@shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { llmService } from './llm';
import { storage } from '../storage';
import { enhancedAlertGenerator } from './enhancedAlertGenerator';
import { logger, logAgent } from './logger';
import { duplicatePreventionService } from './duplicatePreventionService';

export class AgentService {
  
  async runCompetitiveAgent(): Promise<void> {
    return await logger.logOperation(
      'Agent',
      'runCompetitiveAgent',
      'Running competitive intelligence analysis',
      async () => {
        // Prefer enhanced alert generator for sophisticated scenarios
        if (Math.random() > 0.3) { // 70% chance to use enhanced scenarios
          await enhancedAlertGenerator.generateAlertsByType('competitive', 1);
          await this.updateAgentMetrics('competitive', 1);
          logAgent('competitive', 'enhanced_scenario', 'Generated enhanced competitive scenario');
          return;
        }
        
        const competitiveAlerts = await this.detectCompetitiveChanges();
      
        for (const alert of competitiveAlerts) {
          try {
            logAgent('competitive', 'alert_creation', `Creating alert: ${alert.title}`, {
              priority: alert.priority,
              route: alert.route
            });
            
            await db.insert(alerts).values([alert]);
            
            await storage.createActivity({
              type: 'alert',
              title: 'Competitive Alert Generated',
              description: `Competitive Agent detected: ${alert.title}`,
              agentId: 'competitive',
            });
            
            logger.info('Agent', 'runCompetitiveAgent', `Successfully created alert: ${alert.title}`);
          } catch (error) {
            logger.error('Agent', 'runCompetitiveAgent', `Failed to create alert: ${alert.title}`, error);
          }
        }

        // Update agent metrics
        await this.updateAgentMetrics('competitive', competitiveAlerts.length);
        
        logger.info('Agent', 'runCompetitiveAgent', `Competitive agent completed`, {
          alertsGenerated: competitiveAlerts.length
        });
      }
    );
  }

  async runPerformanceAgent(): Promise<void> {
    try {
      console.log('Running Performance Agent analysis...');
      
      // Use enhanced alert generator for demand and system scenarios
      if (Math.random() > 0.5) { // 50% chance to use enhanced scenarios
        const scenarioType = Math.random() > 0.5 ? 'demand' : 'system';
        await enhancedAlertGenerator.generateAlertsByType(scenarioType, 1);
        await this.updateAgentMetrics('performance', 1);
        return;
      }
      
      const performanceAlerts = await this.analyzeRoutePerformance();
      
      for (const alert of performanceAlerts) {
        try {
          console.log(`[Performance Agent] Inserting alert:`, {
            title: alert.title,
            category: alert.category,
            priority: alert.priority
          });
          
          await db.insert(alerts).values([alert]);
          
          await storage.createActivity({
            type: 'analysis',
            title: 'Performance Analysis Complete',
            description: `Performance Agent analyzed route: ${alert.route}`,
            agentId: 'performance',
          });
          
          console.log(`[Performance Agent] Successfully inserted alert: ${alert.title}`);
        } catch (error) {
          console.error(`[Performance Agent] Failed to insert alert:`, error);
          console.error(`[Performance Agent] Alert data:`, alert);
        }
      }

      await this.updateAgentMetrics('performance', performanceAlerts.length);
      
    } catch (error) {
      console.error('Performance Agent error:', error);
    }
  }

  async runNetworkAgent(): Promise<void> {
    try {
      console.log('Running Network Agent analysis...');
      
      // Use enhanced alert generator for operational and economic scenarios
      if (Math.random() > 0.6) { // 40% chance to use enhanced scenarios
        const scenarioType = Math.random() > 0.5 ? 'operational' : 'economic';
        await enhancedAlertGenerator.generateAlertsByType(scenarioType, 1);
        await this.updateAgentMetrics('network', 1);
        return;
      }
      
      const networkAlerts = await this.analyzeNetworkOptimization();
      
      for (const alert of networkAlerts) {
        try {
          console.log(`[Network Agent] Inserting alert:`, {
            title: alert.title,
            category: alert.category,
            priority: alert.priority
          });
          
          await db.insert(alerts).values([alert]);
          
          await storage.createActivity({
            type: 'analysis',
            title: 'Network Analysis Complete',
            description: `Network Agent identified: ${alert.title}`,
            agentId: 'network',
          });
          
          console.log(`[Network Agent] Successfully inserted alert: ${alert.title}`);
        } catch (error) {
          console.error(`[Network Agent] Failed to insert alert:`, error);
          console.error(`[Network Agent] Alert data:`, alert);
        }
      }

      await this.updateAgentMetrics('network', networkAlerts.length);
      
    } catch (error) {
      console.error('Network Agent error:', error);
    }
  }

  private async detectCompetitiveChanges() {
    // Check if we have generated recent competitive alerts to prevent spam
    const recentAlertCount = await duplicatePreventionService.getRecentAlertCount('competitive', 1);
    if (recentAlertCount > 0) {
      logger.debug('Agent', 'detectCompetitiveChanges', 'Skipping - recent competitive alert exists', { recentCount: recentAlertCount });
      return [];
    }

    // Simulate competitive intelligence detection with unique scenarios
    const alerts = [];
    const scenarios = [
      {
        title: 'British Airways Premium Push - LGW→FCO',
        description: 'BA increased business class capacity by 30% on London Gatwick to Rome route. Premium positioning strategy detected.',
        competitor: 'British Airways',
        route: 'LGW→FCO',
        impact: 65000
      },
      {
        title: 'Wizz Air Frequency Increase - LTN→BER', 
        description: 'Wizz Air added 3 weekly flights on London Luton to Berlin route. Aggressive market expansion detected.',
        competitor: 'Wizz Air',
        route: 'LTN→BER',
        impact: 42000
      },
      {
        title: 'Jet2 Late Booking Campaign - STN→ALC',
        description: 'Jet2 launched aggressive last-minute pricing on London Stansted to Alicante. Short-haul leisure market pressure.',
        competitor: 'Jet2',
        route: 'STN→ALC', 
        impact: 38000
      }
    ];
    
    // Randomly select a scenario but check for duplicates
    if (Math.random() > 0.8) { // 20% chance for uniqueness
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      
      // Check if this specific alert already exists
      const isDuplicate = await duplicatePreventionService.isDuplicateAlert(scenario.title, 'competitive', 48);
      if (!isDuplicate) {
        alerts.push({
          type: 'competitive',
          title: scenario.title,
          description: scenario.description,
          priority: 'high' as const,
          category: 'competitive' as const,
          route: scenario.route,
          impact_score: scenario.impact.toString(),
          confidence: (0.80 + Math.random() * 0.15).toFixed(4),
          agent_id: 'competitive',
          metadata: {
            competitor: scenario.competitor,
            detection_method: 'market_monitoring',
            generated_at: new Date().toISOString()
          }
        });
        
        logger.info('Agent', 'detectCompetitiveChanges', 'Generated unique competitive scenario', {
          title: scenario.title,
          competitor: scenario.competitor
        });
      }
    }

    return alerts;
  }

  private async analyzeRoutePerformance() {
    // Simulate performance analysis
    const alerts = [];
    
    // Example: Demand surge detected
    if (Math.random() > 0.6) { // 40% chance for demo
      alerts.push({
        type: 'performance',
        title: 'Demand Surge - STN→AMS',
        description: '20% booking increase detected overnight on Stansted to Amsterdam. Current load factor: 89%.',
        priority: 'high' as const,
        category: 'performance' as const,
        route: 'STN→AMS',
        impact_score: "45000.00",
        confidence: "0.8700",
        agent_id: 'performance',
        metadata: {
          demandIncrease: 20,
          loadFactor: 89,
          opportunity: 'pricing'
        }
      });
    }

    return alerts;
  }

  private async analyzeNetworkOptimization() {
    // Simulate network analysis
    const alerts = [];
    
    if (Math.random() > 0.8) { // 20% chance for demo
      alerts.push({
        type: 'network',
        title: 'Capacity Reallocation Opportunity',
        description: 'Network analysis suggests reallocating capacity from underperforming LGW→MAD to high-demand STN→BCN.',
        priority: 'medium' as const,
        category: 'network' as const,
        route: 'Multiple',
        impact_score: "125000.00",
        confidence: "0.8200",
        agent_id: 'network',
        metadata: {
          fromRoute: 'LGW→MAD',
          toRoute: 'STN→BCN',
          capacityChange: 2
        }
      });
    }

    return alerts;
  }

  private async updateAgentMetrics(agentId: string, alertsGenerated: number) {
    const agent = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
    
    if (agent.length > 0) {
      const currentAgent = agent[0];
      await db.update(agents)
        .set({
          totalAnalyses: (currentAgent.totalAnalyses || 0) + 1,
          lastActive: new Date(),
          updatedAt: new Date()
        })
        .where(eq(agents.id, agentId));
    }
  }

  async processFeedback(feedbackData: {
    alert_id: string;
    agent_id: string;
    user_id: string;
    rating: number;
    comment?: string;
    action_taken: boolean;
    impact_realized?: string;
  }) {
    console.log('[AgentService] Processing feedback:', feedbackData);
    
    // Store feedback directly with snake_case fields
    await db.insert(feedback).values([feedbackData]);
    console.log('[AgentService] Feedback stored successfully');
    
    // Update agent accuracy based on feedback
    await this.updateAgentAccuracy(feedbackData.agent_id, feedbackData.rating);
    
    // Log learning activity
    await db.insert(activities).values({
      type: 'feedback',
      title: 'Learning Update',
      description: `${feedbackData.agent_id} Agent improved accuracy based on user feedback`,
      agentId: feedbackData.agent_id,
    });
  }

  private async updateAgentAccuracy(agentId: string, rating: number) {
    // Simple accuracy calculation - would be more sophisticated in production
    const recentFeedback = await db.select()
      .from(feedback)
      .where(and(
        eq(feedback.agent_id, agentId),
        gte(feedback.created_at, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
      ));

    if (recentFeedback.length > 0) {
      const avgRating = recentFeedback.reduce((sum, f) => sum + f.rating, 0) / recentFeedback.length;
      const accuracy = Math.max(0, Math.min(100, (avgRating / 5) * 100)); // Convert to percentage

      await db.update(agents)
        .set({ 
          accuracy: accuracy.toString(),
          successfulPredictions: recentFeedback.filter(f => f.rating >= 4).length,
          updatedAt: new Date()
        })
        .where(eq(agents.id, agentId));
    }
  }

  async initializeAgents() {
    const defaultAgents = [
      {
        id: 'competitive',
        name: 'Competitive Intelligence',
        status: 'active' as const,
        accuracy: '94.7',
        configuration: {
          competitors: ['Ryanair', 'Wizz Air', 'Vueling'],
          priceChangeThreshold: 10,
          impactThreshold: 5000
        }
      },
      {
        id: 'performance',
        name: 'Performance Attribution',
        status: 'active' as const,
        accuracy: '92.3',
        configuration: {
          varianceThreshold: 5,
          forecastAccuracy: 85,
          alertThreshold: 20000
        }
      },
      {
        id: 'network',
        name: 'Network Analysis',
        status: 'learning' as const,
        accuracy: '89.1',
        configuration: {
          optimizationPeriod: 30,
          capacityThreshold: 80,
          yieldThreshold: 15
        }
      }
    ];

    for (const agent of defaultAgents) {
      try {
        await db.insert(agents).values(agent).onConflictDoNothing();
      } catch (error) {
        // Agent already exists
      }
    }
  }

  // Method to generate multiple enhanced scenario alerts
  async generateEnhancedScenarios(count: number = 5): Promise<void> {
    try {
      console.log(`[AgentService] Generating ${count} enhanced scenario alerts...`);
      await enhancedAlertGenerator.generateScenarioAlerts(count);
      
      // Create a summary activity
      await storage.createActivity({
        type: 'analysis',
        title: `Enhanced Alert Scenarios Generated`,
        description: `Generated ${count} realistic airline intelligence scenarios across competitive, demand, operational, system, and economic categories`,
        agentId: 'system',
        metadata: {
          scenario_count: count,
          generation_type: 'enhanced_batch'
        }
      });
      
      console.log(`[AgentService] Successfully generated ${count} enhanced scenario alerts`);
    } catch (error) {
      console.error('[AgentService] Error generating enhanced scenarios:', error);
    }
  }

  // Method to get scenario statistics
  getScenarioStats() {
    return enhancedAlertGenerator.getScenarioStats();
  }
}

export const agentService = new AgentService();
