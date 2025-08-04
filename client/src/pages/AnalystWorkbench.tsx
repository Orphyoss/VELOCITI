import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVelocitiStore } from '@/stores/useVelocitiStore';
import { api } from '@/services/api';
import AppShell from '@/components/layout/AppShell';
import AlertCard from '@/components/alerts/AlertCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Filter, Search, Calendar, AlertTriangle, MessageSquare } from 'lucide-react';
import { Alert } from '@/types';
import AgentFeedbackTab from '@/components/workbench/AgentFeedbackTab';

export default function AnalystWorkbench() {
  const { setCurrentModule } = useVelocitiStore();
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setCurrentModule('workbench');
  }, [setCurrentModule]);

  const { data: allAlerts, isLoading } = useQuery({
    queryKey: ['/api/alerts', 100],
    queryFn: () => api.getAlerts(undefined, 100),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const { data: criticalAlerts } = useQuery({
    queryKey: ['/api/alerts', 'critical'],
    queryFn: () => api.getAlerts('critical'),
  });

  const { data: highAlerts } = useQuery({
    queryKey: ['/api/alerts', 'high'],
    queryFn: () => api.getAlerts('high'),
  });

  // Priority order for sorting
  const priorityOrder = { 'critical': 1, 'high': 2, 'medium': 3, 'low': 4 };

  // Filter and sort alerts by criticality then date
  const filteredAlerts = allAlerts?.filter((alert: Alert) => {
    if (priorityFilter !== 'all' && alert.priority !== priorityFilter) return false;
    if (categoryFilter !== 'all' && alert.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
    if (searchQuery && !alert.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !alert.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a: Alert, b: Alert) => {
    // First sort by priority (critical first)
    const priorityDiff = (priorityOrder[a.priority as keyof typeof priorityOrder] || 5) - 
                        (priorityOrder[b.priority as keyof typeof priorityOrder] || 5);
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then sort by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }) || [];

  // Apply same sorting to other alert lists
  const sortAlerts = (alerts: Alert[]) => {
    return alerts.sort((a: Alert, b: Alert) => {
      const priorityDiff = (priorityOrder[a.priority as keyof typeof priorityOrder] || 5) - 
                          (priorityOrder[b.priority as keyof typeof priorityOrder] || 5);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const activeAlerts = sortAlerts(allAlerts?.filter((alert: Alert) => alert.status === 'active') || []);
  const nightshiftAlerts = sortAlerts(allAlerts?.filter((alert: Alert) => {
    const createdDate = new Date(alert.createdAt);
    const hour = createdDate.getHours();
    return hour >= 22 || hour <= 6; // 10 PM to 6 AM
  }) || []);

  const realtimeAlerts = sortAlerts(allAlerts?.filter((alert: Alert) => {
    const createdDate = new Date(alert.createdAt);
    const hour = createdDate.getHours();
    return hour > 6 && hour < 22; // 6 AM to 10 PM
  }) || []);

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-dark-800 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-dark-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header with Filters */}
        <Card className="bg-dark-900 border-dark-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-dark-50 flex items-center">
              <ClipboardList className="text-aviation-500 mr-2" />
              Alert Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
                <Input
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-dark-800 border-dark-700 text-dark-50"
                />
              </div>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="bg-dark-800 border-dark-700 text-dark-50">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-dark-800 border-dark-700 text-dark-50">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="competitive">Competitive</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="network">Network</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-dark-800 border-dark-700 text-dark-50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setPriorityFilter('all');
                  setCategoryFilter('all');
                  setStatusFilter('active');
                  setSearchQuery('');
                }}
                className="bg-dark-800 hover:bg-dark-700 text-dark-50 border-dark-600"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alert Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-dark-900 border border-dark-800">
            <TabsTrigger value="all" className="data-[state=active]:bg-aviation-600">
              All Alerts ({filteredAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="nightshift" className="data-[state=active]:bg-aviation-600">
              Nightshift ({nightshiftAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="realtime" className="data-[state=active]:bg-aviation-600">
              Real-time ({realtimeAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-aviation-600">
              Active ({activeAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-aviation-600">
              <MessageSquare className="w-4 h-4 mr-2" />
              Agent Feedback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredAlerts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredAlerts.map((alert: Alert) => (
                  <AlertCard key={alert.id} alert={alert} showDetails />
                ))}
              </div>
            ) : (
              <Card className="bg-dark-900 border-dark-800">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-dark-300 mb-2">
                    No Alerts Found
                  </h4>
                  <p className="text-dark-400">
                    {searchQuery || priorityFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all'
                      ? 'Try adjusting your filters to see more alerts.'
                      : 'All systems are running smoothly.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="nightshift" className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-dark-50 mb-2">Overnight Analysis Results</h3>
              <p className="text-dark-400">
                Alerts generated by our AI agents during overnight processing (10 PM - 6 AM GMT)
              </p>
            </div>
            {nightshiftAlerts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {nightshiftAlerts.map((alert: Alert) => (
                  <AlertCard key={alert.id} alert={alert} showDetails />
                ))}
              </div>
            ) : (
              <Card className="bg-dark-900 border-dark-800">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-dark-300 mb-2">
                    No Nightshift Alerts
                  </h4>
                  <p className="text-dark-400">
                    No issues detected during overnight processing.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="realtime" className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-dark-50 mb-2">Live Market Intelligence</h3>
              <p className="text-dark-400">
                Real-time alerts generated during business hours (6 AM - 10 PM GMT)
              </p>
            </div>
            {realtimeAlerts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {realtimeAlerts.map((alert: Alert) => (
                  <AlertCard key={alert.id} alert={alert} showDetails />
                ))}
              </div>
            ) : (
              <Card className="bg-dark-900 border-dark-800">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-dark-300 mb-2">
                    No Real-time Alerts
                  </h4>
                  <p className="text-dark-400">
                    No significant market changes detected during business hours.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-dark-50 mb-2">Active Alerts Requiring Action</h3>
              <p className="text-dark-400">
                Alerts that haven't been dismissed or escalated and may require your attention
              </p>
            </div>
            {activeAlerts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeAlerts.map((alert: Alert) => (
                  <AlertCard key={alert.id} alert={alert} showDetails />
                ))}
              </div>
            ) : (
              <Card className="bg-dark-900 border-dark-800">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-dark-300 mb-2">
                    No Active Alerts
                  </h4>
                  <p className="text-dark-400">
                    All alerts have been addressed. Great work!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <AgentFeedbackTab alerts={allAlerts || []} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
