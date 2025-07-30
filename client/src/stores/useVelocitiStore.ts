import { create } from 'zustand';
import { Alert, Agent, Activity, DashboardSummary } from '../types';

interface VelocitiState {
  // Data
  dashboardSummary: DashboardSummary | null;
  alerts: Alert[];
  agents: Agent[];
  activities: Activity[];
  
  // UI State
  currentModule: 'dashboard' | 'workbench' | 'agents' | 'genie' | 'strategic' | 'admin';
  llmProvider: 'openai' | 'writer';
  isConnected: boolean;
  
  // Actions
  setDashboardSummary: (summary: DashboardSummary) => void;
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  updateAlertStatus: (id: string, status: string) => void;
  setAgents: (agents: Agent[]) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  setActivities: (activities: Activity[]) => void;
  addActivity: (activity: Activity) => void;
  setCurrentModule: (module: 'dashboard' | 'workbench' | 'agents' | 'genie' | 'strategic' | 'admin') => void;
  setLLMProvider: (provider: 'openai' | 'writer') => void;
  setConnectionStatus: (connected: boolean) => void;
}

export const useVelocitiStore = create<VelocitiState>((set, get) => ({
  // Initial state
  dashboardSummary: null,
  alerts: [],
  agents: [],
  activities: [],
  currentModule: 'dashboard',
  llmProvider: 'writer',
  isConnected: false,

  // Actions
  setDashboardSummary: (summary) => set({ dashboardSummary: summary }),
  
  setAlerts: (alerts) => set({ alerts }),
  
  addAlert: (alert) => set(state => ({ 
    alerts: [alert, ...state.alerts]
  })),
  
  updateAlertStatus: (id, status) => set(state => ({
    alerts: state.alerts.map(alert => 
      alert.id === id ? { ...alert, status } : alert
    )
  })),
  
  setAgents: (agents) => set({ agents }),
  
  updateAgent: (id, updates) => set(state => ({
    agents: state.agents.map(agent =>
      agent.id === id ? { ...agent, ...updates } : agent
    )
  })),
  
  setActivities: (activities) => set({ activities }),
  
  addActivity: (activity) => set(state => ({
    activities: [activity, ...state.activities.slice(0, 19)] // Keep only 20 most recent
  })),
  
  setCurrentModule: (module) => set({ currentModule: module }),
  
  setLLMProvider: (provider) => set({ llmProvider: provider }),
  
  setConnectionStatus: (connected) => set({ isConnected: connected }),
}));
