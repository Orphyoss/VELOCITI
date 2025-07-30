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

// Initialize with sample data
const initializeData = () => {
  // Sample agents
  const sampleAgents: Agent[] = [
    {
      id: 'competitive',
      name: 'Competitive Intelligence Agent',
      status: 'active',
      accuracy: '87.50',
      totalAnalyses: 234,
      successfulPredictions: 205,
      configuration: { threshold: 0.05, monitoring_frequency: 'hourly' },
      lastActive: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'performance',
      name: 'Route Performance Agent',
      status: 'active',
      accuracy: '92.30',
      totalAnalyses: 189,
      successfulPredictions: 174,
      configuration: { variance_threshold: 0.03, lookback_days: 7 },
      lastActive: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'network',
      name: 'Network Optimization Agent',
      status: 'active',
      accuracy: '89.75',
      totalAnalyses: 156,
      successfulPredictions: 140,
      configuration: { efficiency_threshold: 0.02, analysis_depth: 'comprehensive' },
      lastActive: new Date(),
      updatedAt: new Date()
    }
  ];

  // Sample alerts
  const sampleAlerts: Alert[] = [
    {
      id: 'alert-1',
      type: 'competitive',
      priority: 'high',
      title: 'Price Undercut Detected - LGW→BCN',
      description: 'Competitor pricing 12% below our rates on Barcelona route',
      route: 'LGW→BCN',
      routeName: 'London Gatwick → Barcelona',
      metricValue: '285.50',
      thresholdValue: '325.00',
      impactScore: '8.5',
      confidence: '0.92',
      agentId: 'competitive',
      metadata: { competitor: 'Vueling', price_diff: '-12%' },
      status: 'active',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      acknowledgedAt: null,
      resolvedAt: null
    },
    {
      id: 'alert-2',
      type: 'performance',
      priority: 'critical',
      title: 'Load Factor Drop - LHR→CDG',
      description: 'Load factor dropped to 68% vs 85% forecast for premium route',
      route: 'LHR→CDG',
      routeName: 'London Heathrow → Paris Charles de Gaulle',
      metricValue: '68.0',
      thresholdValue: '85.0',
      impactScore: '9.2',
      confidence: '0.88',
      agentId: 'performance',
      metadata: { forecast_miss: '17%', revenue_impact: '-£45k' },
      status: 'active',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      acknowledgedAt: null,
      resolvedAt: null
    },
    {
      id: 'alert-3',
      type: 'network',
      priority: 'medium',
      title: 'Network Efficiency Opportunity',
      description: 'Amsterdam hub showing optimization potential for connecting flights',
      route: 'AMS→*',
      routeName: 'Amsterdam Hub Operations',
      metricValue: '75.5',
      thresholdValue: '80.0',
      impactScore: '6.8',
      confidence: '0.79',
      agentId: 'network',
      metadata: { efficiency_gain: '4.5%', affected_routes: 12 },
      status: 'active',
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      acknowledgedAt: null,
      resolvedAt: null
    }
  ];

  // Sample route performance data
  const sampleRoutes: RoutePerformance[] = [
    {
      id: 'route-1',
      route: 'LGW→BCN',
      routeName: 'London Gatwick → Barcelona',
      date: new Date(),
      yield: '285.50',
      loadFactor: '78.5',
      performance: '-5.2',
      competitorPrice: '285.00',
      ourPrice: '325.00',
      demandIndex: '1.15',
      createdAt: new Date()
    },
    {
      id: 'route-2',
      route: 'LHR→CDG',
      routeName: 'London Heathrow → Paris Charles de Gaulle',
      date: new Date(),
      yield: '425.75',
      loadFactor: '68.0',
      performance: '-17.0',
      competitorPrice: '420.00',
      ourPrice: '450.00',
      demandIndex: '0.92',
      createdAt: new Date()
    }
  ];

  // Sample activities
  const sampleActivities: Activity[] = [
    {
      id: 'activity-1',
      type: 'alert',
      title: 'New Critical Alert Generated',
      description: 'Performance agent detected load factor drop on LHR→CDG',
      metadata: { alertId: 'alert-2', severity: 'critical' },
      userId: 'system',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      id: 'activity-2',
      type: 'analysis',
      title: 'Morning Briefing Generated',
      description: 'AI generated comprehensive morning briefing for network performance',
      metadata: { briefingType: 'morning', itemsCount: 8 },
      userId: 'system',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
    }
  ];

  // Sample system metrics
  const sampleMetrics: SystemMetric[] = [
    {
      id: 'metric-1',
      metricType: 'network_yield',
      value: '342.85',
      timestamp: new Date(),
      metadata: { currency: 'GBP', period: 'daily' }
    },
    {
      id: 'metric-2',
      metricType: 'load_factor',
      value: '82.3',
      timestamp: new Date(),
      metadata: { unit: 'percentage', network_wide: true }
    }
  ];

  // Populate stores
  sampleAgents.forEach(agent => memoryStore.agents.set(agent.id, agent));
  sampleAlerts.forEach(alert => memoryStore.alerts.set(alert.id, alert));
  sampleRoutes.forEach(route => memoryStore.routePerformance.set(route.id, route));
  sampleActivities.forEach(activity => memoryStore.activities.set(activity.id, activity));
  sampleMetrics.forEach(metric => memoryStore.systemMetrics.set(metric.id, metric));
};

// Initialize data when module loads
initializeData();

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
    for (const user of memoryStore.users.values()) {
      if (user.email === username) return user;
    }
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: user.id || `user-${Date.now()}`,
      email: user.email,
      name: user.name,
      role: user.role || 'analyst',
      preferences: user.preferences || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.users.set(newUser.id, newUser);
    return newUser;
  }

  async getAlerts(limit = 50): Promise<Alert[]> {
    const allAlerts = Array.from(memoryStore.alerts.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    return allAlerts;
  }

  async getAlertsByPriority(priority: string): Promise<Alert[]> {
    return Array.from(memoryStore.alerts.values())
      .filter(alert => alert.priority === priority)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const newAlert: Alert = {
      id: alert.id || `alert-${Date.now()}`,
      type: alert.type,
      priority: alert.priority,
      title: alert.title,
      description: alert.description,
      route: alert.route,
      routeName: alert.routeName,
      metricValue: alert.metricValue,
      thresholdValue: alert.thresholdValue,
      impactScore: alert.impactScore,
      confidence: alert.confidence,
      agentId: alert.agentId,
      metadata: alert.metadata || {},
      status: alert.status || 'active',
      createdAt: new Date(),
      acknowledgedAt: null,
      resolvedAt: null
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
