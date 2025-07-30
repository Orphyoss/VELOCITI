import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { api } from '@/services/api';

export default function AgentStatus() {
  const { agents, setAgents } = useVelocitiStore();

  const { data: agentsData } = useQuery({
    queryKey: ['/api/agents'],
    queryFn: () => api.getAgents(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (agentsData) {
      setAgents(agentsData);
    }
  }, [agentsData, setAgents]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'learning': return 'bg-yellow-500';
      case 'maintenance': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'learning': return 'Learning';
      case 'maintenance': return 'Maintenance';
      default: return 'Unknown';
    }
  };

  return (
    <div className="pt-6 mt-6 border-t border-dark-800 px-4">
      <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">
        Agent Status
      </h3>
      <div className="space-y-2">
        {agents.map((agent) => (
          <div key={agent.id} className="flex items-center justify-between text-sm">
            <span className="text-dark-300 capitalize">{agent.id}</span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
              <span className={`text-xs ${
                agent.status === 'active' ? 'text-green-400' :
                agent.status === 'learning' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {getStatusLabel(agent.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
