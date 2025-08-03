import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Play, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap,
  BarChart3,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const SCENARIO_TYPES = [
  { value: 'auto', label: 'Auto-select Realistic Scenario', icon: '🎯' },
  { value: 'competitive_attack', label: 'Competitive Attack', icon: '⚔️' },
  { value: 'demand_surge', label: 'Demand Surge', icon: '📈' },
  { value: 'operational_disruption', label: 'Operational Disruption', icon: '⚠️' },
  { value: 'economic_shock', label: 'Economic Shock', icon: '💰' },
  { value: 'seasonal_shift', label: 'Seasonal Shift', icon: '🌍' },
  { value: 'system_anomaly', label: 'System Anomaly', icon: '🔧' },
  { value: 'normal_operations', label: 'Normal Operations', icon: '✅' }
];

interface DataGenerationJob {
  id: string;
  date: string;
  scenario: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  recordCounts?: Record<string, number>;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export default function DataGeneration() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedScenario, setSelectedScenario] = useState('auto');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recent data generation jobs
  const { data: recentJobs, isLoading } = useQuery({
    queryKey: ['/api/admin/data-generation/jobs'],
    queryFn: () => api.request('GET', '/api/admin/data-generation/jobs'),
    refetchInterval: 5000, // Refresh every 5 seconds to show progress
  });

  // Mutation to trigger data generation
  const generateDataMutation = useMutation({
    mutationFn: async (params: { date: string; scenario: string }) => {
      return api.request('POST', '/api/admin/data-generation/generate', params);
    },
    onSuccess: (data) => {
      toast({
        title: "Data Generation Started",
        description: `Job ${data.jobId} initiated for ${selectedDate}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/data-generation/jobs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to start data generation",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    generateDataMutation.mutate({
      date: selectedDate,
      scenario: selectedScenario
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      running: 'default',
      completed: 'default',
      failed: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Daily Data Generation</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Generate realistic airline intelligence data for specific dates and scenarios
        </p>
      </div>

      {/* Data Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Generate Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date">Target Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Scenario Selection */}
            <div className="space-y-2">
              <Label htmlFor="scenario">Market Scenario</Label>
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scenario type" />
                </SelectTrigger>
                <SelectContent>
                  {SCENARIO_TYPES.map((scenario) => (
                    <SelectItem key={scenario.value} value={scenario.value}>
                      <div className="flex items-center space-x-2">
                        <span>{scenario.icon}</span>
                        <span>{scenario.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleGenerate}
              disabled={generateDataMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {generateDataMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate Data
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Generation Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : recentJobs && recentJobs.length > 0 ? (
            <div className="space-y-3">
              {recentJobs.map((job: DataGenerationJob) => (
                <div
                  key={job.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {job.date}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Scenario: {job.scenario.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(job.status)}
                    </div>
                  </div>
                  
                  {job.recordCounts && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      {Object.entries(job.recordCounts).map(([table, count]) => (
                        <div key={table} className="text-center">
                          <div className="text-lg font-semibold text-blue-600">{count}</div>
                          <div className="text-xs text-gray-500">{table.replace('_', ' ')}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {job.error && (
                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
                      {job.error}
                    </div>
                  )}
                  
                  {job.completedAt && (
                    <div className="mt-2 text-xs text-gray-500">
                      Completed: {new Date(job.completedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Generation Jobs</p>
              <p className="text-sm">Start your first data generation above</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}