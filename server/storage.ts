import { 
  type Alert, type Agent, type User, type RoutePerformance,
  type Conversation, type SystemMetric, type Activity,
  type InsertAlert, type InsertAgent, type InsertUser,
  type InsertRoutePerformance, type InsertConversation,
  type InsertSystemMetric, type InsertActivity, type InsertFeedback
} from '@shared/schema';
import { db, client } from './services/supabase.js';
import { alerts as alertsTable, agents as agentsTable, users, feedback, conversations, systemMetrics, activities, routePerformance } from '@shared/schema';
import { eq, desc, gte, lte, and, sql } from 'drizzle-orm';

// Temporary memory storage for development resilience
const memoryStore = {
  users: new Map<string, User>(),
  alerts: new Map<string, Alert>(),
  agents: new Map<string, Agent>(),
  feedback: new Map<string, any>(),
  routePerformance: new Map<string, RoutePerformance>(),
  conversations: new Map<string, Conversation>(),
  systemMetrics: new Map<string, SystemMetric>(),
  activities: new Map<string, Activity>()
};

// Initialize essential agents for system operation
const initializeAgents = () => {
  const requiredAgents: Agent[] = [
    {
      id: 'competitive',
      name: 'Competitive Intelligence Agent',
      status: 'active',
      accuracy: '0.00',
      totalAnalyses: 0,
      successfulPredictions: 0,
      configuration: { threshold: 0.05, monitoring_frequency: 'hourly' },
      lastActive: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'performance',
      name: 'Route Performance Agent',
      status: 'active',
      accuracy: '0.00',
      totalAnalyses: 0,
      successfulPredictions: 0,
      configuration: { variance_threshold: 0.03, lookback_days: 7 },
      lastActive: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'network',
      name: 'Network Optimization Agent',
      status: 'active',
      accuracy: '0.00',
      totalAnalyses: 0,
      successfulPredictions: 0,
      configuration: { efficiency_threshold: 0.02, analysis_depth: 'comprehensive' },
      lastActive: new Date(),
      updatedAt: new Date()
    }
  ];

  if (memoryStore.agents.size === 0) {
    requiredAgents.forEach(agent => memoryStore.agents.set(agent.id, agent));
  }
};

initializeAgents();

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Alerts
  getAlerts(limit?: number): Promise<Alert[]>;
  getAlertsByPriority(priority: string): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlertStatus(id: string, status: string): Promise<void>;

  // Agents
  getAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | undefined>;
  updateAgent(id: string, updates: Partial<Agent>): Promise<void>;
  
  // Feedback
  createFeedback(feedback: InsertFeedback): Promise<void>;
  getFeedbackByAgent(agentId: string): Promise<any[]>;

  // Route Performance
  getRoutePerformance(route?: string, days?: number): Promise<RoutePerformance[]>;
  createRoutePerformance(data: InsertRoutePerformance): Promise<void>;

  // Conversations
  getConversations(userId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<void>;

  // System Metrics
  getSystemMetrics(type?: string, hours?: number): Promise<SystemMetric[]>;
  createSystemMetric(metric: InsertSystemMetric): Promise<void>;

  // Activities
  getRecentActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<void>;
}

export class MemoryStorage implements IStorage {
  
  // Helper method to get agent display name
  private getAgentDisplayName(agentId: string): string {
    switch (agentId) {
      case 'competitive': return 'Competitive';
      case 'performance': return 'Performance';
      case 'network': return 'Network';
      default: return 'System';
    }
  }
  
  async getUser(id: string): Promise<User | undefined> {
    return memoryStore.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = Array.from(memoryStore.users.values());
    return users.find(user => user.email === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = `user-${Date.now()}`;
    const newUser: User = {
      id,
      username: user.username,
      email: user.email,
      role: user.role || 'analyst',
      preferences: user.preferences || {},
      createdAt: new Date()
    };
    memoryStore.users.set(newUser.id, newUser);
    return newUser;
  }

  async getAlerts(limit = 50): Promise<Alert[]> {
    const { logger } = await import('./services/logger.js');
    
    return await logger.logOperation(
      'Storage',
      'getAlerts',
      `Fetching ${limit} alerts from database`,
      async () => {
        try {
          // Use Drizzle ORM instead of direct client for better compatibility
          const result = await db.select()
            .from(alertsTable)
            .orderBy(alertsTable.created_at)
            .limit(limit);
          
          const alertsData = result.map((alert: any) => ({
            id: alert.id,
            type: alert.type || 'alert',
            priority: alert.priority,
            message: alert.title || alert.description || 'Alert notification', // Map title/description to message
            title: alert.title,
            description: alert.description,
            details: alert.metadata ? JSON.stringify(alert.metadata) : null,
            route: alert.route || null,
            route_name: alert.route_name || null,
            metric_value: alert.metric_value || null,  
            threshold_value: alert.threshold_value || null,
            impact_score: alert.impact_score || null,
            confidence: alert.confidence || null,
            agentId: alert.agent_id, // Map agent_id to agentId
            agent_id: alert.agent_id,
            agent: alert.agent_id, // Add agent field for Header component
            agentName: this.getAgentDisplayName(alert.agent_id), // Add agentName for ActionAgents component
            metadata: alert.metadata || {},
            status: alert.status,
            createdAt: alert.created_at, // Map created_at to createdAt
            updatedAt: alert.created_at, // Use created_at as updatedAt fallback
            created_at: alert.created_at,
            acknowledged_at: alert.acknowledged_at || null,
            resolved_at: alert.resolved_at || null,
            category: alert.category || alert.type || 'general' // Fix missing category issue
          }));
          
          logger.debug('Storage', 'getAlerts', `Successfully fetched alerts from database`, {
            alertCount: alertsData.length,
            enhancedScenarios: alertsData.filter(a => a.metadata?.scenario_generated).length,
            priorities: alertsData.reduce((acc: any, alert) => {
              acc[alert.priority] = (acc[alert.priority] || 0) + 1;
              return acc;
            }, {}),
            agents: alertsData.reduce((acc: any, alert) => {
              acc[alert.agent_id] = (acc[alert.agent_id] || 0) + 1;
              return acc;
            }, {})
          });
          
          return alertsData;
          
        } catch (error) {
          logger.error('Storage', 'getAlerts', 'Database query failed, falling back to memory store', error, { limit });
          
          const allAlerts = Array.from(memoryStore.alerts.values())
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            .slice(0, limit);
          
          logger.warn('Storage', 'getAlerts', `Using memory store fallback`, {
            memoryAlertCount: allAlerts.length
          });
          
          return allAlerts;
        }
      },
      { limit }
    );
  }

  async getAlertsByPriority(priority: string): Promise<Alert[]> {
    try {
      const result = await client`
        SELECT * FROM alerts 
        WHERE priority = ${priority}
        ORDER BY created_at DESC
      `;
      
      return result.map((alert: any) => ({
        id: alert.id,
        type: alert.type || 'alert',
        priority: alert.priority,
        title: alert.title,
        description: alert.description,
        route: alert.route || null,
        route_name: alert.route_name || null,
        metric_value: alert.metric_value || null,  
        threshold_value: alert.threshold_value || null,
        impact_score: alert.impact_score || null,
        confidence: alert.confidence || null,
        agent_id: alert.agent_id,
        metadata: alert.metadata || {},
        status: alert.status,
        created_at: alert.created_at,
        acknowledged_at: alert.acknowledged_at || null,
        resolved_at: alert.resolved_at || null,
        category: alert.category
      }));
    } catch (error) {
      console.error('Error querying alerts by priority:', error);
      return Array.from(memoryStore.alerts.values())
        .filter(alert => alert.priority === priority)
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }
  }

  async createAlert(alertData: InsertAlert): Promise<Alert> {
    try {
      const result = await db.insert(alertsTable).values([{
        type: alertData.type || 'alert',
        priority: alertData.priority,
        title: alertData.title,
        description: alertData.description,
        route: alertData.route || null,
        route_name: alertData.route_name || null,
        metric_value: alertData.metric_value || null,
        agent_id: alertData.agent_id,
        metadata: alertData.metadata || {},
        status: alertData.status || 'active',
        category: alertData.category
      }]).returning();
      
      return {
        id: result[0].id,
        type: result[0].type || 'alert',
        priority: result[0].priority,
        title: result[0].title,
        description: result[0].description,
        route: result[0].route || null,
        route_name: result[0].route_name || null,
        metric_value: result[0].metric_value || null,
        threshold_value: result[0].threshold_value || null,
        impact_score: result[0].impact_score || null,
        confidence: result[0].confidence || null,
        agent_id: result[0].agent_id,
        metadata: result[0].metadata || {},
        status: result[0].status,
        created_at: result[0].created_at,
        acknowledged_at: result[0].acknowledged_at || null,
        resolved_at: result[0].resolved_at || null,
        category: result[0].category
      };
    } catch (error) {
      console.error('Error creating alert in database:', error);
      const id = `alert-${Date.now()}`;
      const newAlert: Alert = {
        id,
        ...alertData,
        type: alertData.type || 'alert',
        status: alertData.status || 'active',
        created_at: new Date(),
        acknowledged_at: null,
        resolved_at: null,
        route: alertData.route || null,
        route_name: alertData.route_name || null,
        metric_value: alertData.metric_value || null,
        threshold_value: null,
        impact_score: null,
        confidence: null,
        metadata: alertData.metadata || {}
      };
      memoryStore.alerts.set(newAlert.id, newAlert);
      return newAlert;
    }
  }

  async updateAlertStatus(id: string, status: string): Promise<void> {
    try {
      await db.update(alertsTable)
        .set({ 
          status,
          resolved_at: status === 'resolved' ? new Date() : null
        })
        .where(eq(alertsTable.id, id));
    } catch (error) {
      console.error('Error updating alert status:', error);
      const alert = memoryStore.alerts.get(id);
      if (alert) {
        alert.status = status;
        if (status === 'resolved') {
          alert.resolved_at = new Date();
        }
        memoryStore.alerts.set(id, alert);
      }
    }
  }

  async getAgents(): Promise<Agent[]> {
    try {
      const result = await db.select().from(agentsTable);
      console.log(`[Storage] Successfully fetched ${result.length} agents from database`);
      if (result.length > 0) {
        return result.map(agent => ({
          id: agent.id,
          name: agent.name,
          status: agent.status,
          accuracy: agent.accuracy || '0.00',
          totalAnalyses: agent.totalAnalyses || 0,
          successfulPredictions: agent.successfulPredictions || 0,
          configuration: agent.configuration || {},
          lastActive: agent.lastActive || new Date(),
          updatedAt: agent.updatedAt || new Date()
        }));
      } else {
        console.log('[Storage] agents table empty, populating with default agents and using memory store');
        return Array.from(memoryStore.agents.values());
      }
    } catch (error) {
      console.error('[Storage] Error fetching agents from database:', error);
      console.log('[Storage] agents table does not exist, using memory store');
      return Array.from(memoryStore.agents.values());
    }
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    try {
      // Check if agents table exists first
      const tableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'agents'
        );
      `);
      
      if (!(tableExists as any).rows?.[0]?.exists) {
        console.warn('[Storage] agents table does not exist, using memory store');
        return memoryStore.agents.get(id);
      }

      const result = await db.select().from(agents).where(eq(agents.id, id));
      if (result.length > 0) {
        const agent = result[0];
        return {
          id: agent.id,
          name: agent.name,
          status: agent.status,
          accuracy: agent.accuracy || '0.00',
          totalAnalyses: agent.totalAnalyses || 0,
          successfulPredictions: agent.successfulPredictions || 0,
          configuration: agent.configuration || {},
          lastActive: agent.lastActive || new Date(),
          updatedAt: agent.updatedAt || new Date()
        };
      }
    } catch (error) {
      console.error('Error fetching agent from database:', error);
    }
    
    return memoryStore.agents.get(id);
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<void> {
    try {
      await db.update(agents)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(agents.id, id));
    } catch (error) {
      console.error('Error updating agent:', error);
      const agent = memoryStore.agents.get(id);
      if (agent) {
        Object.assign(agent, updates, { updatedAt: new Date() });
        memoryStore.agents.set(id, agent);
      }
    }
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<void> {
    try {
      await db.insert(feedback).values([feedbackData]);
    } catch (error) {
      console.error('Error creating feedback:', error);
      const id = `feedback-${Date.now()}`;
      memoryStore.feedback.set(id, { id, ...feedbackData, createdAt: new Date() });
    }
  }

  async getFeedbackByAgent(agentId: string): Promise<any[]> {
    try {
      const result = await db.select().from(feedback).where(eq(feedback.agent_id, agentId));
      return result;
    } catch (error) {
      console.error('Error fetching feedback:', error);
      return Array.from(memoryStore.feedback.values())
        .filter(fb => fb.agentId === agentId)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
  }

  async getRoutePerformance(route?: string, days = 7): Promise<RoutePerformance[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    let routes = Array.from(memoryStore.routePerformance.values())
      .filter(rp => rp.date && new Date(rp.date) >= since);
    
    if (route) {
      routes = routes.filter(rp => rp.route === route);
    }
    
    return routes.sort((a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : 0;
      const bTime = b.date ? new Date(b.date).getTime() : 0;
      return bTime - aTime;
    });
  }

  async createRoutePerformance(data: InsertRoutePerformance): Promise<void> {
    const id = `route-${Date.now()}`;
    const newRoute: RoutePerformance = {
      id,
      ...data,
      createdAt: new Date()
    };
    memoryStore.routePerformance.set(newRoute.id, newRoute);
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return Array.from(memoryStore.conversations.values())
      .filter(conv => conv.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      ...conversation,
      createdAt: new Date(),
      updatedAt: new Date(),
      title: conversation.title ?? null
    };
    memoryStore.conversations.set(newConv.id, newConv);
    return newConv;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    const conversation = memoryStore.conversations.get(id);
    if (conversation) {
      Object.assign(conversation, updates, { updatedAt: new Date() });
      memoryStore.conversations.set(id, conversation);
    }
  }

  async getSystemMetrics(type?: string, hours = 24): Promise<SystemMetric[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    let metrics = Array.from(memoryStore.systemMetrics.values())
      .filter(metric => metric.timestamp && new Date(metric.timestamp) >= since);
    
    if (type) {
      metrics = metrics.filter(metric => metric.metricType === type);
    }
    
    return metrics.sort((a, b) => {
      const aTime = metric.timestamp ? new Date(metric.timestamp).getTime() : 0;
      const bTime = metrics[b].timestamp ? new Date(metrics[b].timestamp).getTime() : 0;
      return bTime - aTime;
    });
  }

  async createSystemMetric(metric: InsertSystemMetric): Promise<void> {
    const newMetric: SystemMetric = {
      id: `metric-${Date.now()}`,
      ...metric,
      timestamp: new Date(),
      metadata: metric.metadata ?? {}
    };
    memoryStore.systemMetrics.set(newMetric.id, newMetric);
  }

  async getRecentActivities(limit = 20): Promise<Activity[]> {
    return Array.from(memoryStore.activities.values())
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, limit);
  }

  async createActivity(activity: InsertActivity): Promise<void> {
    const newActivity: Activity = {
      id: `activity-${Date.now()}`,
      ...activity,
      createdAt: new Date(),
      description: activity.description ?? null,
      metadata: activity.metadata ?? {},
      userId: activity.userId ?? null,
      agentId: activity.agentId ?? null
    };
    memoryStore.activities.set(newActivity.id, newActivity);
  }
}

export const storage = new MemoryStorage();