import { 
  type Alert, type Agent, type User, type RoutePerformance,
  type Conversation, type SystemMetric, type Activity,
  type InsertAlert, type InsertAgent, type InsertUser,
  type InsertRoutePerformance, type InsertConversation,
  type InsertSystemMetric, type InsertActivity, type InsertFeedback
} from '@shared/schema';

// Temporary memory storage while database connection is being established
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

// Initialize agents with real configuration
const initializeAgents = () => {
  // Initialize required agents for system operation
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

  // Only populate agents if store is empty
  if (memoryStore.agents.size === 0) {
    requiredAgents.forEach(agent => memoryStore.agents.set(agent.id, agent));
  }
};

// Initialize only essential system components
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
    try {
      // Query database directly using raw SQL for all alerts including enhanced scenarios
      const { client } = await import('../services/supabase');
      
      const result = await client`
        SELECT * FROM alerts 
        ORDER BY created_at DESC 
        LIMIT ${limit}
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
      console.error('[Storage] Error fetching alerts from database:', error);
      // Fallback to memory store
      const allAlerts = Array.from(memoryStore.alerts.values())
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, limit);
      return allAlerts;
    }
  }

  async getAlertsByPriority(priority: string): Promise<Alert[]> {
    try {
      // Query database directly using raw SQL for priority alerts
      const { client } = await import('../services/supabase');
      
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

  async updateAlertStatus(id: string, status: string): Promise<void> {
    const alert = memoryStore.alerts.get(id);
    if (alert) {
      alert.status = status;
      memoryStore.alerts.set(id, alert);
    }
  }

  async getAgents(): Promise<Agent[]> {
    return Array.from(memoryStore.agents.values());
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    return memoryStore.agents.get(id);
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<void> {
    const agent = memoryStore.agents.get(id);
    if (agent) {
      Object.assign(agent, updates, { updatedAt: new Date() });
      memoryStore.agents.set(id, agent);
    }
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<void> {
    const feedback = {
      id: `feedback-${Date.now()}`,
      ...feedbackData,
      createdAt: new Date()
    };
    memoryStore.feedback.set(feedback.id, feedback);
  }

  async getFeedbackByAgent(agentId: string): Promise<any[]> {
    return Array.from(memoryStore.feedback.values())
      .filter(feedback => feedback.agentId === agentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getRoutePerformance(route?: string, days = 7): Promise<RoutePerformance[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    let routes = Array.from(memoryStore.routePerformance.values())
      .filter(rp => new Date(rp.date) >= since);
    
    if (route) {
      routes = routes.filter(rp => rp.route === route);
    }
    
    return routes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createRoutePerformance(data: InsertRoutePerformance): Promise<void> {
    const routePerf: RoutePerformance = {
      id: data.id || `route-${Date.now()}`,
      ...data,
      createdAt: new Date()
    };
    memoryStore.routePerformance.set(routePerf.id, routePerf);
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return Array.from(memoryStore.conversations.values())
      .filter(conv => conv.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const newConv: Conversation = {
      id: conversation.id || `conv-${Date.now()}`,
      ...conversation,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.conversations.set(newConv.id, newConv);
    return newConv;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    const conv = memoryStore.conversations.get(id);
    if (conv) {
      Object.assign(conv, updates, { updatedAt: new Date() });
      memoryStore.conversations.set(id, conv);
    }
  }

  async getSystemMetrics(type?: string, hours = 24): Promise<SystemMetric[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    let metrics = Array.from(memoryStore.systemMetrics.values())
      .filter(metric => new Date(metric.timestamp) >= since);
    
    if (type) {
      metrics = metrics.filter(metric => metric.metricType === type);
    }
    
    return metrics.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createSystemMetric(metric: InsertSystemMetric): Promise<void> {
    const newMetric: SystemMetric = {
      id: `metric-${Date.now()}`,
      ...metric,
      timestamp: metric.timestamp || new Date()
    };
    memoryStore.systemMetrics.set(newMetric.id, newMetric);
  }

  async getRecentActivities(limit = 20): Promise<Activity[]> {
    return Array.from(memoryStore.activities.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async createActivity(activity: InsertActivity): Promise<void> {
    const newActivity: Activity = {
      id: `activity-${Date.now()}`,
      ...activity,
      createdAt: new Date()
    };
    memoryStore.activities.set(newActivity.id, newActivity);
  }
}

export const storage = new MemoryStorage();
