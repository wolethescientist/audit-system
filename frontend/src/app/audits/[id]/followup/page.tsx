'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Audit } from '@/lib/types';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';

interface FollowupWithNavigation {
  followups: Array<{
    id: string;
    audit_id: string;
    finding_id?: string;
    assigned_to_id?: string;
    due_date?: string;
    status: string;
    evidence_url?: string;
    completion_notes?: string;
    created_at: string;
  }>;
  navigation: {
    audit_id: string;
    audit_title: string;
    audit_status: string;
    navigation_links: {
      audit_overview: string;
      audit_findings: string;
      audit_evidence: string;
      audit_report: string;
    };
  };
  summary: {
    total_followups: number;
    pending: number;
    in_progress: number;
    completed: number;
    overdue: number;
  };
}

export default function FollowUpPage() {
  const params = useParams();
  const auditId = params.id as string;
  const queryClient = useQueryClient();

  const { data: audit } = useQuery<Audit>({
    queryKey: ['audit', auditId],
    queryFn: async () => {
      const response = await api.get(`/audits/${auditId}`);
      return response.data;
    },
  });

  // Enhanced follow-up data with navigation
  const { data: followupData, isLoading } = useQuery<FollowupWithNavigation>({
    queryKey: ['audit-followups-navigation', auditId],
    queryFn: async () => {
      const response = await api.get(`/followups/audit/${auditId}/followups-with-navigation`);
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
      queryClient.invalidateQueries({ queryKey: ['audit-followups-navigation', auditId] });
    },
  });

  // Bulk auto-close for this audit
  const bulkAutoCloseMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/followups/bulk-auto-close?audit_id=${auditId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-followups-navigation', auditId] });
    },
  });

  const tabs = [
    { name: 'Overview', href: `/audits/${auditId}` },
    { name: 'Work Program', href: `/audits/${auditId}/work-program` },
    { name: 'Evidence', href: `/audits/${auditId}/evidence` },
    { name: 'Findings', href: `/audits/${auditId}/findings` },
    { name: 'Queries', href: `/audits/${auditId}/queries` },
    { name: 'Report', href: `/audits/${auditId}/report` },
    { name: 'Follow-up', href: `/audits/${auditId}/followup`, active: true },
  ];

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

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && !['completed', 'closed'].includes(status);
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
      <div className="mb-6">
        <Link href="/audits" className="text-primary-600 hover:underline mb-2 inline-flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Audits
        </Link>
        <h1 className="text-3xl font-bold">{audit?.title || 'Loading...'}</h1>
        <p className="text-gray-600 mt-2">Audit ID: {audit?.id}</p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`px-4 py-2 border-b-2 whitespace-nowrap ${
                tab.active
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent hover:border-primary-600'
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Navigation Links */}
      {followupData?.navigation && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              Quick Navigation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                asChild
                className="justify-start"
              >
                <Link href={followupData.navigation.navigation_links.audit_overview}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Audit Overview
                </Link>
              </Button>
              <Button 
                variant="outline" 
                asChild
                className="justify-start"
              >
                <Link href={followupData.navigation.navigation_links.audit_findings}>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Findings
                </Link>
              </Button>
              <Button 
                variant="outline" 
                asChild
                className="justify-start"
              >
                <Link href={followupData.navigation.navigation_links.audit_evidence}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Evidence
                </Link>
              </Button>
              <Button 
                variant="outline" 
                asChild
                className="justify-start"
              >
                <Link href={followupData.navigation.navigation_links.audit_report}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Report
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      {followupData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{followupData.summary.total_followups}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{followupData.summary.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{followupData.summary.in_progress}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{followupData.summary.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{followupData.summary.overdue}</p>
                <p className="text-sm text-gray-600">Overdue</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overdue Alert */}
      {followupData?.summary.overdue > 0 && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            This audit has {followupData.summary.overdue} overdue follow-up items that require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Follow-up Actions</CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={() => bulkAutoCloseMutation.mutate()}
                disabled={bulkAutoCloseMutation.isPending}
                variant="outline"
                size="sm"
              >
                Bulk Auto-Close Completed
              </Button>
              <Button size="sm">Add Follow-up</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading follow-up actions...</div>
          ) : !followupData?.followups || followupData.followups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No follow-up actions yet</p>
              <p className="text-sm">Track implementation of audit recommendations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {followupData.followups.map((followup) => (
                <div 
                  key={followup.id} 
                  className={`p-4 border rounded-lg ${
                    followup.due_date && isOverdue(followup.due_date, followup.status)
                      ? 'border-red-200 bg-red-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(followup.status)}
                        {followup.due_date && isOverdue(followup.due_date, followup.status) && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            OVERDUE
                          </Badge>
                        )}
                      </div>
                      {followup.finding_id && (
                        <p className="text-sm text-gray-600">
                          Finding ID: {followup.finding_id}
                        </p>
                      )}
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
                      {followup.evidence_url && (
                        <p className="text-sm text-blue-600 mt-2">
                          <a href={followup.evidence_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            View Evidence
                          </a>
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
                      >
                        Edit
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
