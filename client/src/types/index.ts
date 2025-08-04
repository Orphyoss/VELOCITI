export interface Alert {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'competitive' | 'performance' | 'network';
  route?: string;
  impact?: number;
  confidence?: number;
  agentId: string;
  status: 'active' | 'dismissed' | 'escalated';
  metadata?: any;
  created_at: string; // Database field name
  createdAt?: string; // Legacy support
  updatedAt?: string;
}

export interface Agent {
  id: string;
  name: string;
  status: 'active' | 'learning' | 'maintenance';
  accuracy: string;
  totalAnalyses: number;
  successfulPredictions: number;
  configuration: any;
  lastActive: string;
  updatedAt: string;
}

export interface RoutePerformance {
  id: string;
  route: string;
  routeName: string;
  date: string;
  yield?: number;
  loadFactor?: number;
  performance?: number;
  competitorPrice?: number;
  ourPrice?: number;
  demandIndex?: number;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  agentId?: string;
  userId?: string;
  metadata?: any;
  createdAt: string;
}

export interface SystemMetric {
  id: string;
  metricType: string;
  value: number;
  timestamp: string;
  metadata?: any;
}

export interface Conversation {
  id: string;
  userId: string;
  type: 'genie' | 'strategic';
  title?: string;
  messages: any[];
  context?: any;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  alerts: {
    total: number;
    critical: number;
    recent: Alert[];
  };
  agents: {
    id: string;
    name: string;
    status: string;
    accuracy: string;
  }[];
  metrics: {
    networkYield: number;
    loadFactor: number;
    agentAccuracy: string;
  };
  activities: Activity[];
}

export interface LLMResponse {
  analysis?: string;
  confidence?: number;
  recommendations?: string[];
  sql?: string;
  explanation?: string;
  results?: any[];
}
