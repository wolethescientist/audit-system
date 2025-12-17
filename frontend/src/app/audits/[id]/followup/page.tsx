'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Audit, User as UserType } from '@/lib/types';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AuditNavigation from '@/components/audit/AuditNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Plus,
  X,
  Upload,
  FileText
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

interface Finding {
  id: string;
  title: string;
  severity: string;
}

export default function FollowUpPage() {
  const params = useParams();
  const auditId = params.id as string;
  const queryClient = useQueryClient();
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newFollowup, setNewFollowup] = useState({
    finding_id: '',
    assigned_to_id: '',
    due_date: ''
  });
  const [editFollowup, setEditFollowup] = useState<{
    id: string;
    status: string;
    evidence_url: string;
    completion_notes: string;
  } | null>(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: audit } = useQuery<Audit>({
    queryKey: ['audit', auditId],
    queryFn: async () => {
      const response = await api.get(`/audits/${auditId}`);
      return response.data;
    },
  });

  // Fetch users for assignment dropdown
  const { data: users } = useQuery<UserType[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users/');
      return response.data;
    },
  });

  // Fetch findings for this audit
  const { data: findings } = useQuery<Finding[]>({
    queryKey: ['audit-findings', auditId],
    queryFn: async () => {
      const response = await api.get(`/audits/${auditId}/findings`);
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

  // Create follow-up mutation
  const createFollowupMutation = useMutation({
    mutationFn: async (data: { finding_id: string; assigned_to_id: string; due_date: string }) => {
      const response = await api.post(`/followups/audit/${auditId}`, {
        finding_id: data.finding_id || null,
        assigned_to_id: data.assigned_to_id,
        due_date: data.due_date
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-followups-navigation', auditId] });
      setShowAddModal(false);
      setNewFollowup({ finding_id: '', assigned_to_id: '', due_date: '' });
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
      alert(`Successfully auto-closed all completed follow-ups`);
    },
  });

  // Update follow-up mutation
  const updateFollowupMutation = useMutation({
    mutationFn: async (data: { id: string; status?: string; evidence_url?: string; completion_notes?: string }) => {
      const response = await api.put(`/followups/${data.id}`, {
        status: data.status,
        evidence_url: data.evidence_url,
        completion_notes: data.completion_notes
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-followups-navigation', auditId] });
      setShowEditModal(false);
      setEditFollowup(null);
    },
  });

  const handleAddFollowup = () => {
    if (!newFollowup.assigned_to_id || !newFollowup.due_date) {
      alert('Please fill in required fields (Assigned To and Due Date)');
      return;
    }
    createFollowupMutation.mutate(newFollowup);
  };

  const handleEditFollowup = (followup: typeof followupData.followups[0]) => {
    setEditFollowup({
      id: followup.id,
      status: followup.status,
      evidence_url: followup.evidence_url || '',
      completion_notes: followup.completion_notes || ''
    });
    setSelectedFile(null);
    setShowEditModal(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadEvidence = async () => {
    if (!selectedFile || !editFollowup) return;
    
    setUploadingEvidence(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('description', `Follow-up evidence for ${editFollowup.id}`);
      formData.append('evidence_type', 'document');

      const response = await api.post(
        `/audits/${auditId}/evidence/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      // Update the evidence URL with the uploaded file URL
      setEditFollowup({
        ...editFollowup,
        evidence_url: response.data.file_url
      });
      setSelectedFile(null);
    } catch (error) {
      alert('Failed to upload evidence. Please try again.');
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleUpdateFollowup = () => {
    if (editFollowup) {
      updateFollowupMutation.mutate(editFollowup);
    }
  };

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
      <AuditNavigation auditId={auditId} audit={audit} />

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

      {/* Edit Follow-up Modal */}
      {showEditModal && editFollowup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Update Follow-up</h2>
              <button onClick={() => { setShowEditModal(false); setEditFollowup(null); }} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFollowup.status}
                  onChange={(e) => setEditFollowup({ ...editFollowup, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Evidence
                </label>
                {editFollowup.evidence_url ? (
                  <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <FileText className="w-4 h-4 text-green-600" />
                    <a 
                      href={editFollowup.evidence_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-green-700 hover:underline flex-1 truncate"
                    >
                      Evidence uploaded
                    </a>
                    <button
                      type="button"
                      onClick={() => setEditFollowup({ ...editFollowup, evidence_url: '' })}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.csv"
                    />
                    {selectedFile ? (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-700 flex-1 truncate">{selectedFile.name}</span>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleUploadEvidence}
                          disabled={uploadingEvidence}
                        >
                          {uploadingEvidence ? 'Uploading...' : 'Upload'}
                        </Button>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Select Evidence File
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Completion Notes
                </label>
                <textarea
                  value={editFollowup.completion_notes}
                  onChange={(e) => setEditFollowup({ ...editFollowup, completion_notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 min-h-[100px]"
                  placeholder="Add notes about the follow-up progress or completion..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => { setShowEditModal(false); setEditFollowup(null); }}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateFollowup}
                disabled={updateFollowupMutation.isPending}
              >
                {updateFollowupMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Follow-up Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Follow-up Action</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Related Finding (Optional)
                </label>
                <select
                  value={newFollowup.finding_id}
                  onChange={(e) => setNewFollowup({ ...newFollowup, finding_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select a finding...</option>
                  {findings?.map((finding) => (
                    <option key={finding.id} value={finding.id}>
                      {finding.title} ({finding.severity})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To <span className="text-red-500">*</span>
                </label>
                <select
                  value={newFollowup.assigned_to_id}
                  onChange={(e) => setNewFollowup({ ...newFollowup, assigned_to_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select a user...</option>
                  {users?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={newFollowup.due_date}
                  onChange={(e) => setNewFollowup({ ...newFollowup, due_date: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddFollowup}
                disabled={createFollowupMutation.isPending}
              >
                {createFollowupMutation.isPending ? 'Creating...' : 'Create Follow-up'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Follow-up Actions</CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={() => bulkAutoCloseMutation.mutate()}
                disabled={bulkAutoCloseMutation.isPending || (followupData?.summary.completed === 0)}
                variant="outline"
                size="sm"
              >
                {bulkAutoCloseMutation.isPending ? 'Processing...' : 'Bulk Auto-Close Completed'}
              </Button>
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Follow-up
              </Button>
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
                        onClick={() => handleEditFollowup(followup)}
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
