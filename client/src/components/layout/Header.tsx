import { useEffect, useState } from 'react';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { api } from '@/services/api';
import { Bell } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Header() {
  const { currentModule, llmProvider, setLLMProvider, isConnected, dashboardSummary } = useVelocitiStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const handleProviderChange = async (provider: 'openai' | 'writer') => {
    try {
      await api.setLLMProvider(provider);
      setLLMProvider(provider);
    } catch (error) {
      console.error('Failed to change LLM provider:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { 
      hour12: false, 
      timeZone: 'Europe/London' 
    }) + ' GMT';
  };

  const getModuleTitle = () => {
    switch (currentModule) {
      case 'dashboard': return 'Dashboard';
      case 'workbench': return 'Analyst Workbench';
      case 'agents': return 'AI Agents';
      case 'genie': return 'Databricks Genie';
      case 'strategic': return 'Strategic Analysis';
      case 'admin': return 'Admin Dashboard';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="bg-dark-900 border-b border-dark-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-50">{getModuleTitle()}</h2>
          <p className="text-dark-400">
            {formatTime(currentTime)} • Last updated 2 minutes ago
          </p>
        </div>
        
        <div className="flex items-center space-x-6">
          {/* Real-time Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm text-dark-300">
              {isConnected ? 'Real-time Active' : 'Disconnected'}
            </span>
          </div>
          
          {/* Alert Count */}
          <div className="flex items-center space-x-2">
            <Bell className="text-aviation-500" />
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {dashboardSummary?.alerts.critical || 0}
            </span>
          </div>
          
          {/* LLM Provider Selector */}
          <Select value={llmProvider} onValueChange={handleProviderChange}>
            <SelectTrigger className="w-48 bg-dark-800 border-dark-700 text-dark-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="writer">Writer (Palmyra X5)</SelectItem>
              <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
