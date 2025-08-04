import { useEffect, useState } from 'react';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { api } from '@/services/api';
import { Bell, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  hidePageTitle?: boolean;
}

export default function Header({ onMobileMenuToggle, hidePageTitle }: HeaderProps) {
  const { currentModule, llmProvider, setLLMProvider, isConnected, dashboardSummary } = useVelocitiStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: alerts } = useQuery({
    queryKey: ['/api/alerts', 'critical'],
    queryFn: () => api.getAlerts('critical', 10), // Get critical alerts to match the bell count
    enabled: showNotifications, // Only fetch when dropdown is open
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications && !(event.target as Element).closest('.notifications-dropdown')) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

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
    <header className="bg-dark-900 border-b border-dark-800 px-2 sm:px-6 py-2 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-dark-400 hover:text-white p-1"
            onClick={onMobileMenuToggle}
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          
          {!hidePageTitle && (
            <div>
              <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-dark-50">{getModuleTitle()}</h2>
              <p className="text-xs sm:text-sm text-dark-400 hidden sm:block">
                {formatTime(currentTime)} • Last updated 2 minutes ago
              </p>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-6">
          {/* Real-time Status - Hidden on mobile */}
          <div className="hidden sm:flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm text-dark-300">
              {isConnected ? 'Real-time Active' : 'Disconnected'}
            </span>
          </div>
          
          {/* Alert Count - Clickable */}
          <div className="relative notifications-dropdown">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2 hover:bg-dark-800 rounded-md"
            >
              <Bell className="text-aviation-500 w-4 h-4 sm:w-5 sm:h-5" />
              <span className="bg-red-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                {dashboardSummary?.alerts.critical || 0}
              </span>
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50">
                <Card className="bg-dark-900 border-dark-700 shadow-xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-dark-50">
                        Recent Notifications
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNotifications(false)}
                        className="p-1 hover:bg-dark-800"
                      >
                        <X className="w-4 h-4 text-dark-400" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 max-h-96 overflow-y-auto">
                    {alerts && alerts.length > 0 ? (
                      <div className="space-y-2 p-4">
                        {alerts.map((alert: any) => (
                          <div key={alert.id} className="border-b border-dark-800 pb-3 last:border-b-0">
                            <div className="flex items-start justify-between space-x-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs px-2 py-0.5 ${
                                      alert.priority === 'critical' ? 'bg-red-600/20 text-red-400 border-red-500/40' :
                                      alert.priority === 'high' ? 'bg-orange-600/20 text-orange-400 border-orange-500/40' :
                                      alert.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-400 border-yellow-500/40' :
                                      'bg-green-600/20 text-green-400 border-green-500/40'
                                    }`}
                                  >
                                    {alert.priority?.toUpperCase() || 'UNKNOWN'}
                                  </Badge>
                                  <span className="text-xs text-dark-400">
                                    {(alert.agentName || alert.agent || alert.agentId || alert.agent_id) ? (alert.agentName || alert.agent || alert.agentId || alert.agent_id).charAt(0).toUpperCase() + (alert.agentName || alert.agent || alert.agentId || alert.agent_id).slice(1) : 'System'}
                                  </span>
                                </div>
                                <h4 className="text-sm font-medium text-dark-50 line-clamp-2">
                                  {alert.title || 'Untitled Alert'}
                                </h4>
                                <p className="text-xs text-dark-400 mt-1 line-clamp-2">
                                  {alert.description || 'No description available'}
                                </p>
                                {alert.route && (
                                  <span className="text-xs text-aviation-400 mt-1 block">
                                    Route: {alert.route}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <Bell className="w-8 h-8 text-dark-600 mx-auto mb-2" />
                        <p className="text-sm text-dark-400">No recent notifications</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          
          {/* LLM Provider Selector - Compact on mobile */}
          <div className="hidden sm:block">
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
      </div>
    </header>
  );
}
