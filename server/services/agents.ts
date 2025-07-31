import { db } from './supabase';
import { alerts, agents, feedback, routePerformance, activities } from '@shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { llmService } from './llm';

export class AgentService {
  
  async runCompetitiveAgent(): Promise<void> {
    try {
      // Simulate competitive intelligence analysis
      console.log('Running Competitive Agent analysis...');
      
      // In real implementation, this would:
      // 1. Connect to Infare API for competitor pricing
      // 2. Analyze price changes and patterns
      // 3. Calculate revenue impact
      // 4. Generate alerts based on thresholds
      
      const competitiveAlerts = await this.detectCompetitiveChanges();
      
      for (const alert of competitiveAlerts) {
        try {
          console.log(`[Competitive Agent] Inserting alert:`, {
            title: alert.title,
            category: alert.category,
            priority: alert.priority
          });
          
          await db.insert(alerts).values(alert);
          
          await db.insert(activities).values({
            type: 'alert',
            title: 'Competitive Alert Generated',
            description: `Competitive Agent detected: ${alert.title}`,
            agent_id: 'competitive',
          });
          
          console.log(`[Competitive Agent] Successfully inserted alert: ${alert.title}`);
        } catch (error) {
          console.error(`[Competitive Agent] Failed to insert alert:`, error);
          console.error(`[Competitive Agent] Alert data:`, alert);
        }
      }

      // Update agent metrics
      await this.updateAgentMetrics('competitive', competitiveAlerts.length);
      
    } catch (error) {
      console.error('Competitive Agent error:', error);
    }
  }

  async runPerformanceAgent(): Promise<void> {
    try {
      console.log('Running Performance Agent analysis...');
      
      // Analyze route performance vs forecasts
      const performanceAlerts = await this.analyzeRoutePerformance();
      
      for (const alert of performanceAlerts) {
        try {
          console.log(`[Performance Agent] Inserting alert:`, {
            title: alert.title,
            category: alert.category,
            priority: alert.priority
          });
          
          await db.insert(alerts).values(alert);
          
          await db.insert(activities).values({
            type: 'analysis',
            title: 'Performance Analysis Complete',
            description: `Performance Agent analyzed route: ${alert.route}`,
            agent_id: 'performance',
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
      
      // Analyze network-wide optimization opportunities
      const networkAlerts = await this.analyzeNetworkOptimization();
      
      for (const alert of networkAlerts) {
        try {
          console.log(`[Network Agent] Inserting alert:`, {
            title: alert.title,
            category: alert.category,
            priority: alert.priority
          });
          
          await db.insert(alerts).values(alert);
          
          await db.insert(activities).values({
            type: 'analysis',
            title: 'Network Analysis Complete',
            description: `Network Agent identified: ${alert.title}`,
            agent_id: 'network',
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
    // Simulate competitive intelligence detection
    // In real implementation: connect to Infare API, analyze pricing data
    const alerts = [];
    
    // Example: Significant price drop detected
    if (Math.random() > 0.7) { // 30% chance for demo
      alerts.push({
        type: 'competitive',
        title: 'Ryanair 25% Price Drop - LGW→BCN',
        description: 'Competitor reduced prices by 25% on London Gatwick to Barcelona route. Estimated revenue impact: £87,500 weekly.',
        priority: 'critical' as const,
        category: 'competitive' as const,
        route: 'LGW→BCN',
        impact_score: 87500,
        confidence: 0.95,
        agent_id: 'competitive',
        metadata: {
          competitor: 'Ryanair',
          priceChange: -25,
          previousPrice: 120,
          newPrice: 90
        }
      });
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
        impact_score: 45000,
        confidence: 0.87,
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
        impact_score: 125000,
        confidence: 0.82,
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
          totalAnalyses: currentAgent.totalAnalyses + 1,
          lastActive: new Date(),
          updatedAt: new Date()
        })
        .where(eq(agents.id, agentId));
    }
  }

  async processFeedback(feedbackData: {
    alertId: string;
    agentId: string;
    userId: string;
    rating: number;
    comment?: string;
    actionTaken: boolean;
    impactRealized?: number;
  }) {
    console.log('[AgentService] Processing feedback:', feedbackData);
    
    // Map to database column names
    const dbFeedback = {
      alert_id: feedbackData.alertId,
      agent_id: feedbackData.agentId,
      user_id: feedbackData.userId,
      rating: feedbackData.rating,
      comment: feedbackData.comment,
      action_taken: feedbackData.actionTaken,
      impact_realized: feedbackData.impactRealized
    };
    
    // Store feedback
    await db.insert(feedback).values(dbFeedback);
    console.log('[AgentService] Feedback stored successfully');
    
    // Update agent accuracy based on feedback
    await this.updateAgentAccuracy(feedbackData.agentId, feedbackData.rating);
    
    // Log learning activity
    await db.insert(activities).values({
      type: 'feedback',
      title: 'Learning Update',
      description: `${feedbackData.agentId} Agent improved accuracy based on user feedback`,
      agent_id: feedbackData.agentId,
    });
  }

  private async updateAgentAccuracy(agentId: string, rating: number) {
    // Simple accuracy calculation - would be more sophisticated in production
    const recentFeedback = await db.select()
      .from(feedback)
      .where(and(
        eq(feedback.agentId, agentId),
        gte(feedback.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
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
}

export const agentService = new AgentService();
