import { 
  type Alert, type Agent, type User, type RoutePerformance,
  type Conversation, type SystemMetric, type Activity,
  type InsertAlert, type InsertAgent, type InsertUser,
  type InsertRoutePerformance, type InsertConversation,
  type InsertSystemMetric, type InsertActivity, type InsertFeedback
} from '@shared/schema';
import { db } from './services/supabase';
import { eq, desc, gte, lte, and } from 'drizzle-orm';
import { alerts, agents, users, feedback, routePerformance, conversations, systemMetrics, activities } from '@shared/schema';

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

export class PostgreSQLStorage implements IStorage {
  
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('[Storage] Error fetching user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, username)).limit(1);
      return result[0];
    } catch (error) {
      console.error('[Storage] Error fetching user by username:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const newUser = {
        id: `user-${Date.now()}`,
        username: user.username,
        email: user.email,
        role: user.role || 'analyst',
        preferences: user.preferences || {},
        createdAt: new Date()
      };
      
      await db.insert(users).values(newUser);
      return newUser as User;
    } catch (error) {
      console.error('[Storage] Error creating user:', error);
      throw error;
    }
  }

  async getAlerts(limit = 50): Promise<Alert[]> {
    const { logger } = await import('./services/logger.js');
    
    return await logger.logOperation(
      'Storage',
      'getAlerts',
      `Fetching ${limit} alerts from database`,
      async () => {
        try {
          const result = await db.select().from(alerts).orderBy(desc(alerts.created_at)).limit(limit);
          
          const alertsData = result.map((alert: any) => ({
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
          logger.error('Storage', 'getAlerts', 'Database query failed', error, { limit });
          throw error;
        }
      },
      { limit }
    );
  }

  async getAlertsByPriority(priority: string): Promise<Alert[]> {
    try {
      const result = await db.select().from(alerts)
        .where(eq(alerts.priority, priority))
        .orderBy(desc(alerts.created_at));
      
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
      console.error('[Storage] Error fetching priority alerts from database:', error);
      throw error;
    }
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    try {
      const newAlert = {
        id: `alert-${Date.now()}`,
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
        status: alert.status || 'active',
        created_at: new Date(),
        acknowledged_at: null,
        resolved_at: null,
        category: alert.category
      };
      
      await db.insert(alerts).values(newAlert);
      return newAlert as Alert;
    } catch (error) {
      console.error('[Storage] Error creating alert:', error);
      throw error;
    }
  }

  async updateAlertStatus(id: string, status: string): Promise<void> {
    try {
      await db.update(alerts)
        .set({ status })
        .where(eq(alerts.id, id));
    } catch (error) {
      console.error('[Storage] Error updating alert status:', error);
      throw error;
    }
  }

  async getAgents(): Promise<Agent[]> {
    try {
      const result = await db.select().from(agents);
      return result;
    } catch (error) {
      console.error('[Storage] Error fetching agents:', error);
      throw error;
    }
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    try {
      const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('[Storage] Error fetching agent:', error);
      return undefined;
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<void> {
    try {
      await db.update(agents)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(agents.id, id));
    } catch (error) {
      console.error('[Storage] Error updating agent:', error);
      throw error;
    }
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<void> {
    try {
      const feedbackRecord = {
        id: `feedback-${Date.now()}`,
        ...feedbackData,
        createdAt: new Date()
      };
      await db.insert(feedback).values(feedbackRecord);
    } catch (error) {
      console.error('[Storage] Error creating feedback:', error);
      throw error;
    }
  }

  async getFeedbackByAgent(agentId: string): Promise<any[]> {
    try {
      const result = await db.select().from(feedback)
        .where(eq(feedback.agent_id, agentId))
        .orderBy(desc(feedback.created_at));
      return result;
    } catch (error) {
      console.error('[Storage] Error fetching feedback by agent:', error);
      return [];
    }
  }

  async getRoutePerformance(route?: string, days = 7): Promise<RoutePerformance[]> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      let query = db.select().from(routePerformance)
        .where(gte(routePerformance.date, since))
        .orderBy(desc(routePerformance.date));
      
      if (route) {
        query = db.select().from(routePerformance)
          .where(and(
            gte(routePerformance.date, since),
            eq(routePerformance.route, route)
          ))
          .orderBy(desc(routePerformance.date));
      }
      
      const result = await query;
      return result;
    } catch (error) {
      console.error('[Storage] Error fetching route performance:', error);
      return [];
    }
  }

  async createRoutePerformance(data: InsertRoutePerformance): Promise<void> {
    try {
      const routePerf = {
        ...data,
        createdAt: new Date(),
        loadFactor: data.loadFactor ?? null,
        yield: data.yield ?? null,
        performance: data.performance ?? null,
        competitorPrice: data.competitorPrice ?? null,
        ourPrice: data.ourPrice ?? null,
        demandIndex: data.demandIndex ?? null,
      };
      await db.insert(routePerformance).values(routePerf);
    } catch (error) {
      console.error('[Storage] Error creating route performance:', error);
      throw error;
    }
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const result = await db.select().from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.createdAt));
      return result;
    } catch (error) {
      console.error('[Storage] Error fetching conversations:', error);
      return [];
    }
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    try {
      const newConv = {
        ...conversation,
        createdAt: new Date(),
        updatedAt: new Date(),
        title: conversation.title ?? null,
        userId: conversation.userId ?? null,
        messages: conversation.messages ?? {},
        context: conversation.context ?? {},
      };
      await db.insert(conversations).values(newConv);
      return newConv as Conversation;
    } catch (error) {
      console.error('[Storage] Error creating conversation:', error);
      throw error;
    }
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    try {
      await db.update(conversations)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(conversations.id, id));
    } catch (error) {
      console.error('[Storage] Error updating conversation:', error);
      throw error;
    }
  }

  async getSystemMetrics(type?: string, hours = 24): Promise<SystemMetric[]> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      let query = db.select().from(systemMetrics)
        .where(gte(systemMetrics.timestamp, since))
        .orderBy(desc(systemMetrics.timestamp));
      
      if (type) {
        query = db.select().from(systemMetrics)
          .where(and(
            gte(systemMetrics.timestamp, since),
            eq(systemMetrics.metricType, type)
          ))
          .orderBy(desc(systemMetrics.timestamp));
      }
      
      const result = await query;
      return result;
    } catch (error) {
      console.error('[Storage] Error fetching system metrics:', error);
      return [];
    }
  }

  async createSystemMetric(metric: InsertSystemMetric): Promise<void> {
    try {
      const newMetric = {
        ...metric,
        metadata: metric.metadata ?? {},
      };
      await db.insert(systemMetrics).values(newMetric);
    } catch (error) {
      console.error('[Storage] Error creating system metric:', error);
      throw error;
    }
  }

  async getRecentActivities(limit = 20): Promise<Activity[]> {
    try {
      const result = await db.select().from(activities)
        .orderBy(desc(activities.createdAt))
        .limit(limit);
      return result;
    } catch (error) {
      console.error('[Storage] Error fetching recent activities:', error);
      return [];
    }
  }

  async createActivity(activity: InsertActivity): Promise<void> {
    try {
      const newActivity = {
        id: `activity-${Date.now()}`,
        ...activity,
        createdAt: new Date(),
        description: activity.description ?? null,
        metadata: activity.metadata ?? {},
        userId: activity.userId ?? null,
        agentId: activity.agentId ?? null,
      };
      await db.insert(activities).values(newActivity);
    } catch (error) {
      console.error('[Storage] Error creating activity:', error);
      throw error;
    }
  }
}

export const storage = new PostgreSQLStorage();
