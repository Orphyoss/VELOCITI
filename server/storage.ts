import { db } from './services/supabase';
import { 
  alerts, agents, feedback, routePerformance, conversations, 
  systemMetrics, activities, users,
  type Alert, type Agent, type User, type RoutePerformance,
  type Conversation, type SystemMetric, type Activity,
  type InsertAlert, type InsertAgent, type InsertUser,
  type InsertRoutePerformance, type InsertConversation,
  type InsertSystemMetric, type InsertActivity, type InsertFeedback
} from '@shared/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

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

export class DatabaseStorage implements IStorage {
  
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getAlerts(limit = 50): Promise<Alert[]> {
    return await db.select()
      .from(alerts)
      .orderBy(desc(alerts.createdAt))
      .limit(limit);
  }

  async getAlertsByPriority(priority: string): Promise<Alert[]> {
    return await db.select()
      .from(alerts)
      .where(eq(alerts.priority, priority))
      .orderBy(desc(alerts.createdAt));
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const result = await db.insert(alerts).values(alert).returning();
    return result[0];
  }

  async updateAlertStatus(id: string, status: string): Promise<void> {
    await db.update(alerts)
      .set({ status, updatedAt: new Date() })
      .where(eq(alerts.id, id));
  }

  async getAgents(): Promise<Agent[]> {
    return await db.select().from(agents);
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
    return result[0];
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<void> {
    await db.update(agents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(agents.id, id));
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<void> {
    await db.insert(feedback).values(feedbackData);
  }

  async getFeedbackByAgent(agentId: string): Promise<any[]> {
    return await db.select()
      .from(feedback)
      .where(eq(feedback.agentId, agentId))
      .orderBy(desc(feedback.createdAt));
  }

  async getRoutePerformance(route?: string, days = 7): Promise<RoutePerformance[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    let query = db.select().from(routePerformance);
    
    if (route) {
      query = query.where(and(
        eq(routePerformance.route, route),
        gte(routePerformance.date, since)
      ));
    } else {
      query = query.where(gte(routePerformance.date, since));
    }
    
    return await query.orderBy(desc(routePerformance.date));
  }

  async createRoutePerformance(data: InsertRoutePerformance): Promise<void> {
    await db.insert(routePerformance).values(data);
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return await db.select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const result = await db.insert(conversations).values(conversation).returning();
    return result[0];
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    await db.update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id));
  }

  async getSystemMetrics(type?: string, hours = 24): Promise<SystemMetric[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    let query = db.select().from(systemMetrics);
    
    if (type) {
      query = query.where(and(
        eq(systemMetrics.metricType, type),
        gte(systemMetrics.timestamp, since)
      ));
    } else {
      query = query.where(gte(systemMetrics.timestamp, since));
    }
    
    return await query.orderBy(desc(systemMetrics.timestamp));
  }

  async createSystemMetric(metric: InsertSystemMetric): Promise<void> {
    await db.insert(systemMetrics).values(metric);
  }

  async getRecentActivities(limit = 20): Promise<Activity[]> {
    return await db.select()
      .from(activities)
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<void> {
    await db.insert(activities).values(activity);
  }
}

export const storage = new DatabaseStorage();
