import { apiRequest } from '../lib/queryClient';
import { Alert, Agent, Activity, DashboardSummary, LLMResponse } from '../types';

export const api = {
  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await apiRequest('GET', '/api/dashboard/summary');
    return response.json();
  },

  // Alerts
  getAlerts: async (priority?: string, limit?: number): Promise<Alert[]> => {
    const params = new URLSearchParams();
    if (priority) params.append('priority', priority);
    if (limit) params.append('limit', limit.toString());
    
    const response = await apiRequest('GET', `/api/alerts?${params}`);
    return response.json();
  },

  createAlert: async (alertData: Partial<Alert>): Promise<Alert> => {
    const response = await apiRequest('POST', '/api/alerts', alertData);
    return response.json();
  },

  updateAlertStatus: async (id: string, status: string): Promise<void> => {
    await apiRequest('PATCH', `/api/alerts/${id}/status`, { status });
  },

  // Agents
  getAgents: async (): Promise<Agent[]> => {
    const response = await apiRequest('GET', '/api/agents');
    return response.json();
  },

  submitFeedback: async (agentId: string, feedbackData: {
    alertId: string;
    rating: number;
    comment?: string;
    actionTaken: boolean;
    impactRealized?: number;
  }): Promise<void> => {
    await apiRequest('POST', `/api/agents/${agentId}/feedback`, feedbackData);
  },

  runAgent: async (agentId: string): Promise<void> => {
    await apiRequest('POST', `/api/agents/run/${agentId}`);
  },

  // LLM
  queryLLM: async (query: string, type: 'genie' | 'strategic' = 'genie'): Promise<LLMResponse> => {
    const response = await apiRequest('POST', '/api/llm/query', { query, type });
    return response.json();
  },

  setLLMProvider: async (provider: 'openai' | 'writer'): Promise<void> => {
    await apiRequest('POST', '/api/llm/provider', { provider });
  },

  // Activities
  getActivities: async (limit?: number): Promise<Activity[]> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiRequest('GET', `/api/activities${params}`);
    return response.json();
  },

  // Route Performance
  getRoutePerformance: async (route?: string, days?: number) => {
    const params = new URLSearchParams();
    if (route) params.append('route', route);
    if (days) params.append('days', days.toString());
    
    const response = await apiRequest('GET', `/api/routes/performance?${params}`);
    return response.json();
  },

  // Generic request method for Data Generation
  request: async (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, data?: any) => {
    const response = await apiRequest(method, url, data);
    return response.json();
  },

  // Conversations
  getConversations: async () => {
    const response = await apiRequest('GET', '/api/conversations');
    return response.json();
  },

  createConversation: async (conversationData: any) => {
    const response = await apiRequest('POST', '/api/conversations', conversationData);
    return response.json();
  },
};
