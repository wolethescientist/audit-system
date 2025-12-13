'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, User, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Followup {
  id: string;
  audit_id: string;
  finding_id?: string;
  assigned_to_id?: string;
  due_date?: string;
  status: string;
  evidence_url?: string;
  completion_notes?: string;
  created_at: string;
}

interface FollowupStats {
  total_followups: number;
  by_status: {
    pending: number;
    in_progress: number;
    completed: number;
    closed: number;
  };
  overdue_count: number;
  due_this_week: number;
  completion_rate: number;
}

export default function FollowupsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortBy, setSortBy] = useState('due_date');
  const [sortOrder, setSortOrder] = useState('asc');
  const queryClient = useQueryClient();

  // Fetch user's follow-ups with filtering
  const { data: followups = [], isLoading: followupsLoading } = useQuery<Followup[]>({
    queryKey: ['my-followups', statusFilter, overdueOnly, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (overdueOnly) params.append('overdue_only', 'true');
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);
      
      const response = await api.get(`/followups/my-followups?${params.toString()}`);
      return response.data;
    },
  });

  // Fetch follow-up statistics
  const { data: stats } = useQuery<FollowupStats>({
    queryKey: ['followup-statistics'],
    queryFn: async () => {
      const response = await api.get('/followups/statistics');
      return response.data;
    },
  });

  // Fetch overdue notifications
  const { data: notifications } = useQuery({
    queryKey: ['followup-notifications'],
    queryFn: async () => {
      const response = await api.get('/followups/overdue-notifications');
      return response.data;
    },
  });

  // Auto-transition mutation
  const autoTransitionMutation = useMutation({
    mutationFn: async (followupId: string) => {
      const response = await api.put(`/followups/${followupId}/auto-transition`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-followups'] });
      queryClient.invalidateQueries({ queryKey: ['followup-statistics'] });
    },
  });

  // Bulk auto-close mutation
  const bulkAutoCloseMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/followups/bulk-auto-close');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-followups'] });
      queryClient.invalidateQueries({ queryKey: ['followup-statistics'] });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: User },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      closed: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && !['completed', 'closed'].includes(followups.find(f => f.due_date === dueDate)?.status || '');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Follow-ups</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => bulkAutoCloseMutation.mutate()}
            disabled={bulkAutoCloseMutation.isPending}
            variant="outline"
          >
            Bulk Auto-Close Completed
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {notifications && (notifications.overdue.count > 0 || notifications.upcoming.count > 0) && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You have {notifications.overdue.count} overdue follow-ups and {notifications.upcoming.count} due within 7 days.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats?.total_followups || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats?.by_status.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">{stats?.by_status.in_progress || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{stats?.by_status.completed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold">{stats?.overdue_count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters & Sorting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="due_date">Due Date</SelectItem>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Order</label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant={overdueOnly ? "default" : "outline"}
                onClick={() => setOverdueOnly(!overdueOnly)}
                className="w-full"
              >
                {overdueOnly ? "Show All" : "Overdue Only"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-ups List */}
      <Card>
        <CardHeader>
          <CardTitle>Follow-up Items</CardTitle>
        </CardHeader>
        <CardContent>
          {followupsLoading ? (
            <div className="text-center py-8">Loading follow-ups...</div>
          ) : followups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No follow-ups found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {followups.map((followup) => (
                <div 
                  key={followup.id} 
                  className={`p-4 border rounded-lg ${
                    followup.due_date && isOverdue(followup.due_date) 
                      ? 'border-red-200 bg-red-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(followup.status)}
                        {followup.due_date && isOverdue(followup.due_date) && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            OVERDUE
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Audit ID: {followup.audit_id}
                      </p>
                      {followup.due_date && (
                        <p className="text-sm text-gray-600">
                          Due: {formatDate(followup.due_date)}
                        </p>
                      )}
                      {followup.completion_notes && (
                        <p className="text-sm text-gray-700 mt-2">
                          {followup.completion_notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {followup.status === 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => autoTransitionMutation.mutate(followup.id)}
                          disabled={autoTransitionMutation.isPending}
                        >
                          Auto-Close
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/audits/${followup.audit_id}/followup`, '_blank')}
                      >
                        View Audit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
