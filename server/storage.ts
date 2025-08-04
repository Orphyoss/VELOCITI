import { 
  type Alert, type Agent, type User, type RoutePerformance,
  type Conversation, type SystemMetric, type Activity,
  type InsertAlert, type InsertAgent, type InsertUser,
  type InsertRoutePerformance, type InsertConversation,
  type InsertSystemMetric, type InsertActivity, type InsertFeedback
} from '@shared/schema';

// PostgreSQL-first architecture with Supabase database
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

// PostgreSQL-only storage class - no memory fallbacks
export class PostgresStorage implements IStorage {
  
  async getUser(id: string): Promise<User | undefined> {
    try {
      const { db } = await import('./services/supabase.js');
      const { users } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0] || undefined;
    } catch (error) {
      console.error('[PostgresStorage] Error fetching user:', error);
      throw new Error(`Failed to fetch user ${id}: ${error.message}`);
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const { db } = await import('./services/supabase.js');
      const { users } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const result = await db.select().from(users).where(eq(users.email, username));
      return result[0] || undefined;
    } catch (error) {
      console.error('[PostgresStorage] Error fetching user by username:', error);
      throw new Error(`Failed to fetch user by username ${username}: ${error.message}`);
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const { db } = await import('./services/supabase.js');
      const { users } = await import('@shared/schema');
      
      const result = await db.insert(users).values([{
        username: user.username,
        email: user.email,
        role: user.role || 'analyst'
      }]).returning();
      
      return result[0];
    } catch (error) {
      console.error('[PostgresStorage] Error creating user:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async getAlerts(limit = 10): Promise<Alert[]> {
    try {
      const { client } = await import('./services/supabase.js');
      
      console.log(`[DEBUG] [Storage] getAlerts: Starting: Fetching ${limit} alerts from database`);
      console.log('  Data:', JSON.stringify({ limit }, null, 2));
      
      // Use raw SQL to avoid Drizzle syntax issues
      const result = await client`
        SELECT * FROM alerts 
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `;
      
      // Convert PostgreSQL response to expected format
      const alerts = result.map((alert: any) => ({
        id: alert.id,
        type: alert.type || 'alert',
        priority: alert.priority,
        title: alert.title,
        description: alert.description,
        agentId: alert.agent_id,
        scenario: alert.scenario || {},
        data: alert.data || {},
        impact: alert.impact_score || 0,
        confidence: alert.confidence || 0,
        recommendations: alert.recommendations || {},
        status: alert.status,
        createdAt: alert.created_at,
        updatedAt: alert.updated_at
      }));

      const enhancedScenarios = alerts.filter(alert => 
        alert.scenario && typeof alert.scenario === 'object' && Object.keys(alert.scenario).length > 0
      ).length;
      
      const priorities = alerts.reduce((acc, alert) => {
        const priority = alert.priority || 'medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const agents = alerts.reduce((acc, alert) => {
        const agent = alert.agentId || 'unknown';
        acc[agent] = (acc[agent] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log(`[DEBUG] [Storage] getAlerts: Successfully fetched alerts from database`);
      console.log('  Data:', JSON.stringify({
        alertCount: alerts.length,
        enhancedScenarios,
        priorities,
        agents
      }, null, 2));
      
      return alerts;
    } catch (error) {
      console.error('[PostgresStorage] Error fetching alerts:', error);
      throw new Error(`Failed to fetch alerts: ${error.message}`);
    }
  }

  async getAlertsByPriority(priority: string): Promise<Alert[]> {
    try {
      const { client } = await import('./services/supabase.js');
      
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
        agentId: alert.agent_id,
        scenario: alert.scenario || {},
        data: alert.data || {},
        impact: alert.impact || {},
        recommendations: alert.recommendations || {},
        status: alert.status,
        createdAt: alert.created_at,
        updatedAt: alert.updated_at
      }));
    } catch (error) {
      console.error('[PostgresStorage] Error fetching alerts by priority:', error);
      throw new Error(`Failed to fetch alerts by priority ${priority}: ${error.message}`);
    }
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    try {
      const { db } = await import('./services/supabase.js');
      const { alerts } = await import('@shared/schema');
      
      const result = await db.insert(alerts).values([{
        agentId: alert.agentId,
        type: alert.type || 'system',
        priority: alert.priority,
        title: alert.title,
        description: alert.description,
        data: alert.data || {},
        scenario: alert.scenario || {},
        impact: alert.impact || {},
        recommendations: alert.recommendations || {}
      }]).returning();
      
      console.log(`[PostgresStorage] Successfully created alert: ${alert.title}`);
      return result[0];
    } catch (error) {
      console.error('[PostgresStorage] Error creating alert in database:', error);
      throw new Error(`Failed to create alert: ${error.message}`);
    }
  }

  async updateAlertStatus(id: string, status: string): Promise<void> {
    try {
      const { db } = await import('./services/supabase.js');
      const { alerts } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      await db.update(alerts)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(alerts.id, id));
      
      console.log(`[PostgresStorage] Updated alert ${id} status to ${status}`);
    } catch (error) {
      console.error('[PostgresStorage] Error updating alert status:', error);
      throw new Error(`Failed to update alert status: ${error.message}`);
    }
  }

  async getAgents(): Promise<Agent[]> {
    try {
      const { db } = await import('./services/supabase.js');
      const { agents } = await import('@shared/schema');
      
      const result = await db.select().from(agents);
      return result;
    } catch (error) {
      console.error('[PostgresStorage] Error fetching agents:', error);
      throw new Error(`Failed to fetch agents: ${error.message}`);
    }
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    try {
      const { db } = await import('./services/supabase.js');
      const { agents } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const result = await db.select().from(agents).where(eq(agents.id, id));
      return result[0] || undefined;
    } catch (error) {
      console.error('[PostgresStorage] Error fetching agent:', error);
      throw new Error(`Failed to fetch agent ${id}: ${error.message}`);
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<void> {
    try {
      const { db } = await import('./services/supabase.js');
      const { agents } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      await db.update(agents)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(agents.id, id));
    } catch (error) {
      console.error('[PostgresStorage] Error updating agent:', error);
      throw new Error(`Failed to update agent ${id}: ${error.message}`);
    }
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<void> {
    try {
      const { db } = await import('./services/supabase.js');
      const { feedback } = await import('@shared/schema');
      
      await db.insert(feedback).values([feedbackData]);
    } catch (error) {
      console.error('[PostgresStorage] Error creating feedback:', error);
      throw new Error(`Failed to create feedback: ${error.message}`);
    }
  }

  async getFeedbackByAgent(agentId: string): Promise<any[]> {
    try {
      const { db } = await import('./services/supabase.js');
      const { feedback } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      
      const result = await db.select().from(feedback)
        .where(eq(feedback.agent_id, agentId))
        .orderBy(desc(feedback.created_at));
      
      return result;
    } catch (error) {
      console.error('[PostgresStorage] Error fetching feedback:', error);
      throw new Error(`Failed to fetch feedback for agent ${agentId}: ${error.message}`);
    }
  }

  async getRoutePerformance(route?: string, days = 7): Promise<RoutePerformance[]> {
    try {
      const { db } = await import('./services/supabase.js');
      const { routePerformance } = await import('@shared/schema');
      const { gte, eq, desc, and } = await import('drizzle-orm');
      
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
      console.error('[PostgresStorage] Error fetching route performance:', error);
      throw new Error(`Failed to fetch route performance: ${error.message}`);
    }
  }

  async createRoutePerformance(data: InsertRoutePerformance): Promise<void> {
    try {
      const { db } = await import('./services/supabase.js');
      const { routePerformance } = await import('@shared/schema');
      
      await db.insert(routePerformance).values([{
        route: data.route,
        routeName: data.routeName,
        date: data.date,
        performance: data.performance ?? null,
        yield: data.yield ?? null,
        loadFactor: data.loadFactor ?? null,
        competitorPrice: data.competitorPrice ?? null,
        ourPrice: data.ourPrice ?? null,
        demandIndex: data.demandIndex ?? null
      }]);
    } catch (error) {
      console.error('[PostgresStorage] Error creating route performance:', error);
      throw new Error(`Failed to create route performance: ${error.message}`);
    }
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const { db } = await import('./services/supabase.js');
      const { conversations } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      
      const result = await db.select().from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.updatedAt));
      
      return result;
    } catch (error) {
      console.error('[PostgresStorage] Error fetching conversations:', error);
      throw new Error(`Failed to fetch conversations for user ${userId}: ${error.message}`);
    }
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    try {
      const { db } = await import('./services/supabase.js');
      const { conversations } = await import('@shared/schema');
      
      const result = await db.insert(conversations).values([{
        type: conversation.type,
        title: conversation.title ?? null,
        userId: conversation.userId ?? null,
        messages: conversation.messages ?? {},
        context: conversation.context ?? {}
      }]).returning();
      
      return result[0];
    } catch (error) {
      console.error('[PostgresStorage] Error creating conversation:', error);
      throw new Error(`Failed to create conversation: ${error.message}`);
    }
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    try {
      const { db } = await import('./services/supabase.js');
      const { conversations } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      await db.update(conversations)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(conversations.id, id));
    } catch (error) {
      console.error('[PostgresStorage] Error updating conversation:', error);
      throw new Error(`Failed to update conversation ${id}: ${error.message}`);
    }
  }

  async getSystemMetrics(type?: string, hours = 24): Promise<SystemMetric[]> {
    try {
      const { db } = await import('./services/supabase.js');
      const { systemMetrics } = await import('@shared/schema');
      const { gte, eq, desc, and } = await import('drizzle-orm');
      
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
      console.error('[PostgresStorage] Error fetching system metrics:', error);
      throw new Error(`Failed to fetch system metrics: ${error.message}`);
    }
  }

  async createSystemMetric(metric: InsertSystemMetric): Promise<void> {
    try {
      const { db } = await import('./services/supabase.js');
      const { systemMetrics } = await import('@shared/schema');
      
      await db.insert(systemMetrics).values([{
        metricType: metric.metricType,
        value: metric.value,
        metadata: metric.metadata ?? {}
      }]);
    } catch (error) {
      console.error('[PostgresStorage] Error creating system metric:', error);
      throw new Error(`Failed to create system metric: ${error.message}`);
    }
  }

  async getRecentActivities(limit = 20): Promise<Activity[]> {
    try {
      const { db } = await import('./services/supabase.js');
      const { activities } = await import('@shared/schema');
      const { desc } = await import('drizzle-orm');
      
      const result = await db.select().from(activities)
        .orderBy(desc(activities.createdAt))
        .limit(limit);
      
      return result;
    } catch (error) {
      console.error('[PostgresStorage] Error fetching recent activities:', error);
      throw new Error(`Failed to fetch recent activities: ${error.message}`);
    }
  }

  async createActivity(activity: InsertActivity): Promise<void> {
    try {
      const { db } = await import('./services/supabase.js');
      const { activities } = await import('@shared/schema');
      
      await db.insert(activities).values([{
        type: activity.type,
        title: activity.title,
        description: activity.description,
        userId: activity.userId,
        metadata: activity.metadata || {}
      }]);
    } catch (error) {
      console.error('[PostgresStorage] Error creating activity:', error);
      throw new Error(`Failed to create activity: ${error.message}`);
    }
  }
}

// Export PostgreSQL-only storage instance
export const storage = new PostgresStorage();