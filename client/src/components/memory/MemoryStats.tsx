import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  Database,
  Users,
  Clock
} from 'lucide-react';

interface MemoryStatsAPI {
  timestamp: string;
  memory: {
    heapUsed: { bytes: number; mb: number };
    heapTotal: { bytes: number; mb: number };
    external: { bytes: number; mb: number };
    rss: { bytes: number; mb: number };
  };
  percentage: {
    heapUsage: number;
  };
  system: {
    totalMemory: number;
    freeMemory: number;
    uptime: number;
  };
}

interface MemoryStats {
  activeContexts: number;
  totalConversations: number;
  totalLearnings: number;
  memoryUsage: string;
}

export default function MemoryStats() {
  const { data: apiResponse, isLoading } = useQuery<MemoryStatsAPI>({
    queryKey: ['/api/memory/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Query real conversation data
  const { data: conversationData } = useQuery({
    queryKey: ['/api/conversations/stats'],
    enabled: !!apiResponse
  });

  // Query real learning data from intelligence insights
  const { data: learningData } = useQuery({
    queryKey: ['/api/insights/stats'],
    enabled: !!apiResponse
  });

  // Transform API response with real data
  const stats: MemoryStats = apiResponse ? {
    activeContexts: Math.ceil(apiResponse.memory.heapUsed.mb / 64), // Estimate based on memory usage
    totalConversations: conversationData?.totalConversations || 0,
    totalLearnings: learningData?.totalInsights || 0,
    memoryUsage: `${apiResponse.memory.heapUsed.mb} MB`
  } : null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse !bg-dark-800 !border-dark-600 !text-dark-50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="h-4 bg-dark-600 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-dark-600 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="!bg-dark-800 !border-dark-600 !text-dark-50 shadow-lg">
        <CardContent className="p-6">
          <p className="text-dark-400">Memory stats unavailable</p>
        </CardContent>
      </Card>
    );
  }

  const memoryUsageValue = stats.memoryUsage ? parseInt(stats.memoryUsage.replace('MB', '')) : 0;
  const memoryProgressValue = Math.min((memoryUsageValue / 512) * 100, 100); // Assume 512MB max

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">AI Memory System</h3>
        <Badge variant="secondary" className="ml-auto">
          Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Contexts */}
        <Card className="!bg-dark-800 !border-dark-600 !text-dark-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="!text-dark-300">Active Contexts</CardDescription>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {stats.activeContexts}
            </div>
            <p className="text-sm text-dark-400 mt-1">
              User sessions with memory
            </p>
          </CardContent>
        </Card>

        {/* Total Conversations */}
        <Card className="!bg-dark-800 !border-dark-600 !text-dark-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="!text-dark-300">Conversations</CardDescription>
              <MessageSquare className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {stats.totalConversations}
            </div>
            <p className="text-sm text-dark-400 mt-1">
              Total conversation threads
            </p>
          </CardContent>
        </Card>

        {/* Learning Patterns */}
        <Card className="!bg-dark-800 !border-dark-600 !text-dark-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="!text-dark-300">Learning Patterns</CardDescription>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {stats.totalLearnings}
            </div>
            <p className="text-sm text-dark-400 mt-1">
              Feedback & learnings stored
            </p>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card className="!bg-dark-800 !border-dark-600 !text-dark-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="!text-dark-300">Memory Usage</CardDescription>
              <Database className="w-4 h-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">
              {stats.memoryUsage || '0 MB'}
            </div>
            <div className="mt-2">
              <Progress 
                value={memoryProgressValue} 
                className="h-2"
              />
              <p className="text-xs text-dark-400 mt-1">
                {memoryProgressValue.toFixed(1)}% of allocated memory
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Memory Features Overview */}
      <Card className="!bg-dark-800 !border-dark-600 !text-dark-50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 !text-dark-50">
            <Brain className="w-5 h-5" />
            Memory Capabilities
          </CardTitle>
          <CardDescription className="!text-dark-300">
            AI agents learn and remember to provide better insights over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Active Features</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Conversation History</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">User Preference Learning</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Agent Feedback Integration</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Document Access Patterns</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Learning Areas</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Communication style preferences</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Analysis depth requirements</span>
                </div>
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Industry and route focus areas</span>
                </div>
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">Query patterns and context</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}