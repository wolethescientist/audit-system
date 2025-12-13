'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import WorkflowAnalyticsDashboard from '@/components/workflows/WorkflowAnalyticsDashboard';
import { 
  Settings, 
  Zap, 
  Database, 
  TrendingUp, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity
} from 'lucide-react';

interface AutomationRule {
  rule_id: string;
  name: string;
  description: string;
  trigger: string;
  condition: string;
  action: string;
  is_active: boolean;
  created_at: string;
}

interface AutomationRulesResponse {
  automation_rules: AutomationRule[];
  total_rules: number;
  active_rules: number;
  rule_categories: {
    time_based: number;
    event_based: number;
    immediate: number;
  };
}

interface OptimizationResult {
  optimization_summary: {
    total_optimizations: number;
    execution_time_seconds: number;
    status: string;
  };
  optimizations: Array<{
    type: string;
    description: string;
    estimated_improvement?: string;
    execution_time_seconds?: number;
    status?: string;
  }>;
  performance_impact: {
    estimated_query_improvement: string;
    estimated_throughput_increase: string;
    memory_usage_reduction: string;
  };
  recommendations: string[];
}

export default function WorkflowAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'automation' | 'optimization'>('analytics');
  const queryClient = useQueryClient();

  // Fetch automation rules
  const { data: automationRules } = useQuery<AutomationRulesResponse>({
    queryKey: ['workflow-automation-rules'],
    queryFn: async () => {
      const response = await api.get('/workflows/automation-rules');
      return response.data;
    },
  });

  // Database optimization mutation
  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/workflows/optimize-database-queries');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-monitoring'] });
    },
  });

  const getTriggerBadgeColor = (trigger: string) => {
    switch (trigger) {
      case 'time_based': return 'bg-blue-100 text-blue-800';
      case 'event_based': return 'bg-green-100 text-green-800';
      case 'immediate': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'time_based': return Clock;
      case 'event_based': return Activity;
      case 'immediate': return Zap;
      default: return Settings;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Workflow Performance & Optimization</h1>
        <p className="text-gray-600">Monitor workflow performance, manage automation rules, and optimize system performance</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 border-b-2 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent hover:border-primary-600'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Analytics Dashboard
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`px-4 py-2 border-b-2 whitespace-nowrap ${
              activeTab === 'automation'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent hover:border-primary-600'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Automation Rules
          </button>
          <button
            onClick={() => setActiveTab('optimization')}
            className={`px-4 py-2 border-b-2 whitespace-nowrap ${
              activeTab === 'optimization'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent hover:border-primary-600'
            }`}
          >
            <Database className="w-4 h-4 inline mr-2" />
            System Optimization
          </button>
        </div>
      </div>

      {/* Analytics Dashboard Tab */}
      {activeTab === 'analytics' && (
        <WorkflowAnalyticsDashboard />
      )}

      {/* Automation Rules Tab */}
      {activeTab === 'automation' && (
        <div className="space-y-6">
          {/* Automation Rules Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Settings className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Rules</p>
                    <p className="text-2xl font-bold">{automationRules?.total_rules || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Rules</p>
                    <p className="text-2xl font-bold">{automationRules?.active_rules || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Time-based</p>
                    <p className="text-2xl font-bold">{automationRules?.rule_categories.time_based || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Event-based</p>
                    <p className="text-2xl font-bold">{automationRules?.rule_categories.event_based || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Automation Rules List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Automation Rules Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {automationRules?.automation_rules && automationRules.automation_rules.length > 0 ? (
                <div className="space-y-4">
                  {automationRules.automation_rules.map((rule) => {
                    const TriggerIcon = getTriggerIcon(rule.trigger);
                    return (
                      <div key={rule.rule_id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{rule.name}</h3>
                              <Badge className={getTriggerBadgeColor(rule.trigger)}>
                                <TriggerIcon className="w-3 h-3 mr-1" />
                                {rule.trigger.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <Badge className={rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {rule.is_active ? 'ACTIVE' : 'INACTIVE'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                            <div className="text-xs text-gray-500">
                              <p><strong>Condition:</strong> {rule.condition}</p>
                              <p><strong>Action:</strong> {rule.action}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant={rule.is_active ? "destructive" : "default"}
                            >
                              {rule.is_active ? 'Disable' : 'Enable'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No automation rules configured</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Optimization Tab */}
      {activeTab === 'optimization' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database & Query Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Optimize database queries and system performance for improved workflow execution times.
                </p>
                
                <Button 
                  onClick={() => optimizeMutation.mutate()}
                  disabled={optimizeMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {optimizeMutation.isPending ? 'Optimizing...' : 'Run Optimization'}
                </Button>

                {optimizeMutation.data && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <div className="space-y-2">
                        <p><strong>Optimization completed successfully!</strong></p>
                        <p>Applied {optimizeMutation.data.optimization_summary.total_optimizations} optimizations in {optimizeMutation.data.optimization_summary.execution_time_seconds}s</p>
                        
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2">Performance Impact:</h4>
                          <ul className="text-sm space-y-1">
                            <li>• Query improvement: {optimizeMutation.data.performance_impact.estimated_query_improvement}</li>
                            <li>• Throughput increase: {optimizeMutation.data.performance_impact.estimated_throughput_increase}</li>
                            <li>• Memory usage reduction: {optimizeMutation.data.performance_impact.memory_usage_reduction}</li>
                          </ul>
                        </div>

                        {optimizeMutation.data.recommendations && optimizeMutation.data.recommendations.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold mb-2">Recommendations:</h4>
                            <ul className="text-sm space-y-1">
                              {optimizeMutation.data.recommendations.map((rec, index) => (
                                <li key={index}>• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {optimizeMutation.isError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Failed to run optimization. Please try again or contact system administrator.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Optimization History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Optimizations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No optimization history available</p>
                <p className="text-sm">Run optimizations to see history here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}