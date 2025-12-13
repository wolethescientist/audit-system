'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Database,
  Zap,
  Settings
} from 'lucide-react';

interface WorkflowAnalytics {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  overview: {
    total_workflows: number;
    completed_workflows: number;
    in_progress_workflows: number;
    completion_rate: number;
    average_completion_time_hours: number;
  };
  bottlenecks: Array<{
    step_type: string;
    average_duration_hours: number;
    total_instances: number;
    max_duration_hours: number;
    min_duration_hours: number;
  }>;
  department_performance: Array<{
    department_id: string;
    total_steps: number;
    average_duration_hours: number;
  }>;
  performance_trends: {
    workflows_per_day: number;
    completion_velocity: number;
  };
  query_execution_time_seconds: number;
}

interface PerformanceMonitoring {
  timestamp: string;
  active_workflows: {
    count: number;
    details: Array<{
      workflow_id: string;
      reference_number: string;
      audit_id: string;
      current_step: number;
      current_step_action: string;
      total_duration_hours: number;
      current_step_duration_hours: number;
      is_overdue: boolean;
      assigned_to: string;
    }>;
  };
  daily_metrics: {
    workflows_created_today: number;
    workflows_completed_today: number;
    completion_rate_today: number;
  };
  system_performance: {
    database_response_time_seconds: number;
    api_execution_time_seconds: number;
    performance_status: string;
  };
  alerts: Array<{
    type: string;
    count: number;
    message: string;
  }>;
}

export default function WorkflowAnalyticsDashboard() {
  const [daysBack, setDaysBack] = useState(30);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch workflow analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<WorkflowAnalytics>({
    queryKey: ['workflow-analytics', daysBack],
    queryFn: async () => {
      const response = await api.get(`/workflows/performance-analytics?days_back=${daysBack}`);
      return response.data;
    },
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds if enabled
  });

  // Fetch real-time performance monitoring
  const { data: monitoring, isLoading: monitoringLoading } = useQuery<PerformanceMonitoring>({
    queryKey: ['workflow-monitoring'],
    queryFn: async () => {
      const response = await api.get('/workflows/performance-monitoring');
      return response.data;
    },
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds if enabled
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const getPerformanceStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${Math.round(hours * 10) / 10}h`;
    } else {
      return `${Math.round(hours / 24 * 10) / 10}d`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Workflow Performance Analytics</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Period:</label>
            <select 
              value={daysBack} 
              onChange={(e) => setDaysBack(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {monitoring?.alerts && monitoring.alerts.some(alert => alert.count > 0) && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {monitoring.alerts.map(alert => alert.count > 0 && (
              <div key={alert.type}>{alert.message}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Real-time Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Workflows</p>
                <p className="text-2xl font-bold">{monitoring?.active_workflows.count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold">{monitoring?.daily_metrics.workflows_completed_today || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">DB Response</p>
                <p className="text-2xl font-bold">
                  {monitoring?.system_performance.database_response_time_seconds 
                    ? `${Math.round(monitoring.system_performance.database_response_time_seconds * 1000)}ms`
                    : '0ms'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Zap className={`h-8 w-8 ${monitoring?.system_performance.performance_status === 'good' ? 'text-green-600' : 'text-yellow-600'}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <Badge className={getPerformanceStatusColor(monitoring?.system_performance.performance_status || 'unknown')}>
                  {monitoring?.system_performance.performance_status || 'Unknown'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview Statistics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{analytics.overview.total_workflows}</p>
                <p className="text-sm text-gray-600">Total Workflows</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{analytics.overview.completed_workflows}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{analytics.overview.in_progress_workflows}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{analytics.overview.completion_rate}%</p>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <Progress value={analytics.overview.completion_rate} className="mt-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{formatDuration(analytics.overview.average_completion_time_hours)}</p>
                <p className="text-sm text-gray-600">Avg. Completion Time</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bottlenecks Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Performance Bottlenecks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.bottlenecks && analytics.bottlenecks.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.bottlenecks}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="step_type" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatDuration(value), 'Avg Duration']}
                  />
                  <Bar dataKey="average_duration_hours" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No bottleneck data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Department Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.department_performance && analytics.department_performance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.department_performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department_id" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatDuration(value), 'Avg Duration']}
                  />
                  <Bar dataKey="average_duration_hours" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No department performance data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Workflows Details */}
      {monitoring?.active_workflows.details && monitoring.active_workflows.details.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Active Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monitoring.active_workflows.details.map((workflow) => (
                <div 
                  key={workflow.workflow_id} 
                  className={`p-4 border rounded-lg ${
                    workflow.is_overdue ? 'border-red-200 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          {workflow.reference_number}
                        </Badge>
                        <Badge className={workflow.current_step_action === 'review' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                          Step {workflow.current_step}: {workflow.current_step_action}
                        </Badge>
                        {workflow.is_overdue && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            OVERDUE
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Total Duration: {formatDuration(workflow.total_duration_hours)} | 
                        Current Step: {formatDuration(workflow.current_step_duration_hours)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/workflows/${workflow.workflow_id}`, '_blank')}
                    >
                      View Workflow
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Trends */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-lg font-semibold">{analytics.performance_trends.workflows_per_day.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Workflows per Day</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{analytics.performance_trends.completion_velocity.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Completions per Day</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{analytics.query_execution_time_seconds.toFixed(3)}s</p>
                <p className="text-sm text-gray-600">Query Execution Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}