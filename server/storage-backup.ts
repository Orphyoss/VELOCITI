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

// OLD MemoryStorage class removed - now using PostgreSQL-only storage
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
          const { client } = await import('./services/supabase.js');
          
          const result = await client`
            SELECT * FROM alerts 
            ORDER BY created_at DESC 
            LIMIT ${limit}
          `;
          
          const alerts = result.map((alert: any) => ({
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
            alertCount: alerts.length,
            enhancedScenarios: alerts.filter(a => a.metadata?.scenario_generated).length,
            priorities: alerts.reduce((acc: any, alert) => {
              acc[alert.priority] = (acc[alert.priority] || 0) + 1;
              return acc;
            }, {}),
            agents: alerts.reduce((acc: any, alert) => {
              acc[alert.agent_id] = (acc[alert.agent_id] || 0) + 1;
              return acc;
            }, {})
          });
          
          return alerts;
          
        } catch (error) {
          logger.error('Storage', 'getAlerts', 'Database query failed, falling back to memory store', error, { limit });
          
          // Fallback to memory store
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
      // Query database directly using raw SQL for priority alerts
      const { client } = await import('./services/supabase.js');
      
      const result = await client`
        SELECT * FROM alerts 
        WHERE priority = ${priority}
        ORDER BY created_at DESC
      `;
      
      // Convert database format to expected format
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
      // Fallback to memory store
      return Array.from(memoryStore.alerts.values())
        .filter(alert => alert.priority === priority)
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    try {
      const { db } = await import('./services/supabase.js');
      const { alerts } = await import('@shared/schema');
      
      const alertData = {
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
        category: alert.category
      };
      
      const result = await db.insert(alerts).values([alertData]).returning();
      
      return {
        id: result[0].id,
        type: result[0].type || 'alert',
        priority: result[0].priority,
        title: result[0].title,
        description: result[0].description,
        route: result[0].route,
        route_name: result[0].route_name,
        metric_value: result[0].metric_value,
        threshold_value: result[0].threshold_value,
        impact_score: result[0].impact_score,
        confidence: result[0].confidence,
        agent_id: result[0].agent_id,
        metadata: result[0].metadata || {},
        status: result[0].status,
        created_at: result[0].created_at || new Date(),
        acknowledged_at: result[0].acknowledged_at,
        resolved_at: result[0].resolved_at,
        category: result[0].category
      };
    } catch (error) {
      console.error('[Storage] Error creating alert in database:', error);
      // Fallback to memory store
      const id = `alert-${Date.now()}`;
      const newAlert: Alert = {
        id,
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
      memoryStore.alerts.set(newAlert.id, newAlert);
      return newAlert;
    }
  }

  async updateAlertStatus(id: string, status: string): Promise<void> {
    try {
      const { db } = await import('./services/supabase.js');
      const { alerts } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      await db.update(alerts)
        .set({ status })
        .where(eq(alerts.id, id));
    } catch (error) {
      console.error('[Storage] Error updating alert status in database:', error);
      // Fallback to memory store
      const alert = memoryStore.alerts.get(id);
      if (alert) {
        alert.status = status;
        memoryStore.alerts.set(id, alert);
      }
    }
  }

  async getAgents(): Promise<Agent[]> {
    try {
      const { db } = await import('./services/supabase.js');
      const { agents } = await import('@shared/schema');
      
      const result = await db.select().from(agents);
      
      return result.map((agent: any) => ({
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
    } catch (error) {
      console.error('[Storage] Error fetching agents from database:', error);
      // Fallback to memory store
      return Array.from(memoryStore.agents.values());
    }
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    try {
      const { db } = await import('./services/supabase.js');
      const { agents } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const result = await db.select().from(agents).where(eq(agents.id, id));
      
      if (result.length === 0) return undefined;
      
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
    } catch (error) {
      console.error('[Storage] Error fetching agent from database:', error);
      return memoryStore.agents.get(id);
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
      console.error('[Storage] Error updating agent in database:', error);
      // Fallback to memory store
      const agent = memoryStore.agents.get(id);
      if (agent) {
        Object.assign(agent, updates, { updatedAt: new Date() });
        memoryStore.agents.set(id, agent);
      }
    }
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<void> {
    try {
      const { db } = await import('./services/supabase.js');
      const { feedback } = await import('@shared/schema');
      
      await db.insert(feedback).values([feedbackData]);
    } catch (error) {
      console.error('[Storage] Error creating feedback in database:', error);
      // Fallback to memory store
      const feedbackRecord = {
        id: `feedback-${Date.now()}`,
        ...feedbackData,
        createdAt: new Date()
      };
      memoryStore.feedback.set(feedbackRecord.id, feedbackRecord);
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
      console.error('[Storage] Error fetching feedback from database:', error);
      // Fallback to memory store
      return Array.from(memoryStore.feedback.values())
        .filter(feedback => feedback.agentId === agentId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
      
      return result.map((rp: any) => ({
        id: rp.id,
        route: rp.route,
        routeName: rp.routeName,
        date: rp.date,
        performance: rp.performance,
        yield: rp.yield,
        loadFactor: rp.loadFactor,
        competitorPrice: rp.competitorPrice,
        ourPrice: rp.ourPrice,
        demandIndex: rp.demandIndex,
        createdAt: rp.createdAt
      }));
    } catch (error) {
      console.error('[Storage] Error fetching route performance from database:', error);
      // Fallback to memory store
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      let routes = Array.from(memoryStore.routePerformance.values())
        .filter(rp => new Date(rp.date).getTime() >= since.getTime());
      
      if (route) {
        routes = routes.filter(rp => rp.route === route);
      }
      
      return routes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
      console.error('[Storage] Error creating route performance in database:', error);
      // Fallback to memory store
      const routePerf: RoutePerformance = {
        id: `route-${Date.now()}`,
        route: data.route,
        routeName: data.routeName,
        date: data.date,
        createdAt: new Date(),
        loadFactor: data.loadFactor ?? null,
        yield: data.yield ?? null,
        performance: data.performance ?? null,
        competitorPrice: data.competitorPrice ?? null,
        ourPrice: data.ourPrice ?? null,
        demandIndex: data.demandIndex ?? null,
      };
      memoryStore.routePerformance.set(routePerf.id, routePerf);
    }
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const { db } = await import('./services/supabase.js');
      const { conversations } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      
      const result = await db.select().from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.createdAt));
      
      return result.map((conv: any) => ({
        id: conv.id,
        type: conv.type,
        title: conv.title,
        userId: conv.userId,
        messages: conv.messages || {},
        context: conv.context || {},
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      }));
    } catch (error) {
      console.error('[Storage] Error fetching conversations from database:', error);
      // Fallback to memory store
      return Array.from(memoryStore.conversations.values())
        .filter(conv => conv.userId === userId)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
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
      
      return {
        id: result[0].id,
        type: result[0].type,
        title: result[0].title,
        userId: result[0].userId,
        messages: result[0].messages || {},
        context: result[0].context || {},
        createdAt: result[0].createdAt,
        updatedAt: result[0].updatedAt
      };
    } catch (error) {
      console.error('[Storage] Error creating conversation in database:', error);
      // Fallback to memory store
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        type: conversation.type,
        title: conversation.title ?? null,
        userId: conversation.userId ?? null,
        messages: conversation.messages ?? {},
        context: conversation.context ?? {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.conversations.set(newConv.id, newConv);
      return newConv;
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
      console.error('[Storage] Error updating conversation in database:', error);
      // Fallback to memory store
      const conv = memoryStore.conversations.get(id);
      if (conv) {
        Object.assign(conv, updates, { 
          updatedAt: new Date(),
          createdAt: conv.createdAt || new Date() 
        });
        memoryStore.conversations.set(id, conv);
      }
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
      
      return result.map((metric: any) => ({
        id: metric.id,
        metricType: metric.metricType,
        value: metric.value,
        timestamp: metric.timestamp,
        metadata: metric.metadata || {}
      }));
    } catch (error) {
      console.error('[Storage] Error fetching system metrics from database:', error);
      // Fallback to memory store
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      let metrics = Array.from(memoryStore.systemMetrics.values())
        .filter(metric => metric.timestamp && new Date(metric.timestamp) >= since);
      
      if (type) {
        metrics = metrics.filter(metric => metric.metricType === type);
      }
      
      return metrics.sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bTime - aTime;
      });
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
      console.error('[Storage] Error creating system metric in database:', error);
      // Fallback to memory store
      const newMetric: SystemMetric = {
        id: `metric-${Date.now()}`,
        metricType: metric.metricType,
        value: metric.value,
        timestamp: new Date(),
        metadata: metric.metadata ?? {},
      };
      memoryStore.systemMetrics.set(newMetric.id, newMetric);
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
      
      return result.map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        metadata: activity.metadata || {},
        userId: activity.userId,
        agentId: activity.agentId,
        createdAt: activity.createdAt
      }));
    } catch (error) {
      console.error('[Storage] Error fetching activities from database:', error);
      // Fallback to memory store
      return Array.from(memoryStore.activities.values())
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, limit);
    }
  }

  async createActivity(activity: InsertActivity): Promise<void> {
    try {
      const { db } = await import('./services/supabase.js');
      const { activities } = await import('@shared/schema');
      
      await db.insert(activities).values([{
        type: activity.type,
        title: activity.title,
        description: activity.description ?? null,
        metadata: activity.metadata ?? {},
        userId: activity.userId ?? null,
        agentId: activity.agentId ?? null
      }]);
    } catch (error) {
      console.error('[Storage] Error creating activity in database:', error);
      // Fallback to memory store
      const newActivity: Activity = {
        id: `activity-${Date.now()}`,
        ...activity,
        createdAt: new Date(),
        description: activity.description ?? null,
        metadata: activity.metadata ?? {},
        userId: activity.userId ?? null,
        agentId: activity.agentId ?? null,
      };
      memoryStore.activities.set(newActivity.id, newActivity);
    }
  }
}

// Create PostgreSQL-only storage class
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
      const { db } = await import('./services/supabase.js');
      const { alerts } = await import('@shared/schema');
      const { desc } = await import('drizzle-orm');
      
      console.log(`[DEBUG] [Storage] getAlerts: Starting: Fetching ${limit} alerts from database`);
      console.log('  Data:', JSON.stringify({ limit }, null, 2));
      
      const result = await db.select().from(alerts)
        .orderBy(desc(alerts.createdAt))
        .limit(limit);
      
      const enhancedScenarios = result.filter(alert => 
        alert.scenario && typeof alert.scenario === 'object' && Object.keys(alert.scenario).length > 0
      ).length;
      
      const priorities = result.reduce((acc, alert) => {
        const priority = alert.priority || 'medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const agents = result.reduce((acc, alert) => {
        const agent = alert.agentId || 'unknown';
        acc[agent] = (acc[agent] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log(`[DEBUG] [Storage] getAlerts: Successfully fetched alerts from database`);
      console.log('  Data:', JSON.stringify({
        alertCount: result.length,
        enhancedScenarios,
        priorities,
        agents
      }, null, 2));
      
      return result;
    } catch (error) {
      console.error('[PostgresStorage] Error fetching alerts:', error);
      throw new Error(`Failed to fetch alerts: ${error.message}`);
    }
  }

  async getAlertsByPriority(priority: string): Promise<Alert[]> {
    try {
      const { db } = await import('./services/supabase.js');
      const { alerts } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      
      const result = await db.select().from(alerts)
        .where(eq(alerts.priority, priority))
        .orderBy(desc(alerts.createdAt));
      
      return result;
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
        type: alert.type,
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

  // Add remaining methods with PostgreSQL-only implementation...
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
