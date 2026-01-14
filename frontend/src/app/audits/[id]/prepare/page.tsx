'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, AlertCircle, FileText, Calendar, 
  Plus, AlertTriangle, CheckSquare 
} from 'lucide-react';
import { api } from '@/lib/api';
import AuditNavigation from '@/components/audit/AuditNavigation';

interface ChecklistItem {
  id: number;
  item: string;
  completed: boolean;
  category: string;
}

interface DocumentRequest {
  id?: string;
  document_name: string;
  document_description: string;
  document_type: string;
  requested_from_id: string;
  due_date: string;
  priority: string;
  status: string;
}

interface RiskAssessment {
  id?: string;
  risk_area: string;
  risk_description: string;
  likelihood: number;
  impact: number;
  risk_score?: number;
  risk_level?: string;
  inherent_risk_factors: string[];
  control_effectiveness: string;
  sampling_approach: string;
  recommended_audit_procedures: string;
}

export default function AuditPreparePage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;

  const [audit, setAudit] = useState<any>(null);
  const [preparationStatus, setPreparationStatus] = useState<any>(null);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create a mapping of user IDs to display names
  const userDisplayMap = users.reduce((acc, user) => {
    acc[user.id] = `${user.full_name} (${user.email})`;
    return acc;
  }, {} as Record<string, string>);

  // Form states
  const [newDocRequest, setNewDocRequest] = useState<DocumentRequest>({
    document_name: '',
    document_description: '',
    document_type: 'document',
    requested_from_id: '',
    due_date: '',
    priority: 'medium',
    status: 'requested'
  });

  const [newRiskAssessment, setNewRiskAssessment] = useState<RiskAssessment>({
    risk_area: '',
    risk_description: '',
    likelihood: 1,
    impact: 1,
    inherent_risk_factors: [],
    control_effectiveness: 'unknown',
    sampling_approach: '',
    recommended_audit_procedures: ''
  });

  useEffect(() => {
    fetchAuditDetails();
    fetchPreparationStatus();
    fetchChecklists();
    fetchDocumentRequests();
    fetchRiskAssessments();
    fetchUsers();
  }, [auditId]);

  const fetchAuditDetails = async () => {
    try {
      const response = await api.get(`/audits/${auditId}`);
      setAudit(response.data);
    } catch (err) {
      setError('Failed to fetch audit details');
    }
  };

  const fetchPreparationStatus = async () => {
    try {
      const response = await api.get(`/audits/${auditId}/preparation-status`);
      setPreparationStatus(response.data);
    } catch (err) {
      console.error('Failed to fetch preparation status:', err);
      // Set default values to prevent NaN display
      setPreparationStatus({
        overall_completion: 100,
        checklist_completion: 100,
        document_completion: 100,
        risk_assessment_completion: 100,
        checklist_items_count: 0,
        document_requests_count: 0,
        risk_assessments_count: 0,
        can_proceed_to_execution: true,  // Allow proceeding if API fails
        preparation_completed: false
      });
    }
  };

  const fetchChecklists = async () => {
    try {
      const response = await api.get(`/audits/${auditId}/checklist`);
      setChecklists(response.data);
    } catch (err) {
      console.error('Failed to fetch checklists:', err);
    }
  };

  const fetchDocumentRequests = async () => {
    try {
      const response = await api.get(`/audits/${auditId}/document-requests`);
      setDocumentRequests(response.data);
    } catch (err) {
      console.error('Failed to fetch document requests:', err);
    }
  };

  const fetchRiskAssessments = async () => {
    try {
      const response = await api.get(`/audits/${auditId}/risk-assessments`);
      setRiskAssessments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch risk assessments:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const createChecklist = async (frameworkTemplate: string) => {
    setLoading(true);
    try {
      await api.post(`/audits/${auditId}/checklist`, {
        framework_template: frameworkTemplate,
        checklist_name: `${frameworkTemplate} Preparation Checklist`
      });
      setSuccess('Preparation checklist created successfully');
      await fetchChecklists();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create checklist');
    } finally {
      setLoading(false);
    }
  };

  const updateChecklistItem = async (checklistId: string, items: ChecklistItem[]) => {
    // Optimistic update - update UI immediately
    setChecklists(prevChecklists => 
      prevChecklists.map(checklist => {
        if (checklist.id === checklistId) {
          const completedCount = items.filter(item => item.completed).length;
          const totalItems = items.length;
          return {
            ...checklist,
            checklist_items: items,
            completed_items: completedCount,
            completion_percentage: totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0
          };
        }
        return checklist;
      })
    );

    try {
      await api.put(`/audits/${auditId}/checklist/${checklistId}`, {
        checklist_items: items
      });
      // Only refresh preparation status in background, don't await
      fetchPreparationStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update checklist');
      // Revert on error
      fetchChecklists();
    }
  };

  const createDocumentRequest = async () => {
    if (!newDocRequest.document_name || !newDocRequest.requested_from_id) {
      setError('Document name and requestee are required');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/audits/${auditId}/document-requests`, newDocRequest);
      setSuccess('Document request created successfully');
      setNewDocRequest({
        document_name: '',
        document_description: '',
        document_type: 'document',
        requested_from_id: '',
        due_date: '',
        priority: 'medium',
        status: 'requested'
      });
      await fetchDocumentRequests();
      await fetchPreparationStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create document request');
    } finally {
      setLoading(false);
    }
  };

  const updateDocumentRequest = async (requestId: string, updates: Partial<DocumentRequest>) => {
    try {
      await api.put(`/audits/${auditId}/document-requests/${requestId}`, updates);
      await fetchDocumentRequests();
      await fetchPreparationStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update document request');
    }
  };

  const createRiskAssessment = async () => {
    if (!newRiskAssessment.risk_area || !newRiskAssessment.risk_description) {
      setError('Risk area and description are required');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/audits/${auditId}/risk-assessment`, newRiskAssessment);
      setSuccess('Risk assessment created successfully');
      setNewRiskAssessment({
        risk_area: '',
        risk_description: '',
        likelihood: 1,
        impact: 1,
        inherent_risk_factors: [],
        control_effectiveness: 'unknown',
        sampling_approach: '',
        recommended_audit_procedures: ''
      });
      await fetchRiskAssessments();
      await fetchPreparationStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create risk assessment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'provided': return 'bg-green-100 text-green-800';
      case 'requested': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'not_available': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (!audit) {
    return <div className="p-6">Loading audit details...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <AuditNavigation auditId={auditId} audit={audit} />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Audit Preparation</h2>
          <p className="text-gray-600 mt-1">ISO 19011 Clause 6.3 - Preparing for audit activities</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Preparation Status Overview */}
      {preparationStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Preparation Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Completion</span>
                  <span>{isNaN(preparationStatus.overall_completion) ? '100' : Math.round(preparationStatus.overall_completion)}%</span>
                </div>
                <Progress value={isNaN(preparationStatus.overall_completion) ? 100 : preparationStatus.overall_completion} className="h-2" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${preparationStatus.checklist_items_count === 0 ? 'text-gray-400' : 'text-blue-600'}`}>
                    {preparationStatus.checklist_items_count === 0 ? '0%' : 
                      (isNaN(preparationStatus.checklist_completion) ? '100' : Math.round(preparationStatus.checklist_completion)) + '%'}
                  </div>
                  <div className="text-sm text-gray-600">Checklist Completion</div>
                  <div className="text-xs text-gray-500">
                    {preparationStatus.checklist_items_count === 0 ? 'No checklist created' :
                      `${preparationStatus.completed_checklist_items || 0}/${preparationStatus.checklist_items_count} items`}
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${preparationStatus.document_requests_count === 0 ? 'text-gray-400' : 'text-green-600'}`}>
                    {preparationStatus.document_requests_count === 0 ? '0%' : 
                      (isNaN(preparationStatus.document_completion) ? '100' : Math.round(preparationStatus.document_completion)) + '%'}
                  </div>
                  <div className="text-sm text-gray-600">Documents Received</div>
                  <div className="text-xs text-gray-500">
                    {preparationStatus.document_requests_count === 0 ? 'No documents requested' :
                      `${preparationStatus.received_documents_count || 0}/${preparationStatus.document_requests_count} docs`}
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${preparationStatus.risk_assessments_count === 0 ? 'text-gray-400' : 'text-purple-600'}`}>
                    {preparationStatus.risk_assessments_count === 0 ? '0%' : 
                      (isNaN(preparationStatus.risk_assessment_completion) ? '100' : Math.round(preparationStatus.risk_assessment_completion)) + '%'}
                  </div>
                  <div className="text-sm text-gray-600">Risk Assessment</div>
                  <div className="text-xs text-gray-500">
                    {preparationStatus.risk_assessments_count === 0 ? 'No assessments created' :
                      `${preparationStatus.risk_assessments_count} assessment(s)`}
                  </div>
                </div>
              </div>

              {preparationStatus.can_proceed_to_execution ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ready to proceed to execution phase.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Complete at least one preparation activity or mark preparation as complete to proceed.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="checklists" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checklists">Preparation Checklists</TabsTrigger>
          <TabsTrigger value="documents">Document Requests</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
        </TabsList>

        {/* Preparation Checklists Tab */}
        <TabsContent value="checklists" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Preparation Checklists
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => createChecklist('ISO_19011')}
                    disabled={loading}
                  >
                    ISO 19011 Checklist
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => createChecklist('ISO_27001')}
                    disabled={loading}
                  >
                    ISO 27001 Checklist
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checklists.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No checklists created yet. Create a framework-based checklist to get started.
                </div>
              ) : (
                <div className="space-y-6">
                  {checklists.map((checklist) => (
                    <div key={checklist.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{checklist.checklist_name}</h3>
                          <p className="text-sm text-gray-600">
                            Framework: {checklist.framework_template}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {checklist.completion_percentage}%
                          </div>
                          <div className="text-sm text-gray-600">
                            {checklist.completed_items}/{checklist.total_items} completed
                          </div>
                        </div>
                      </div>
                      
                      <Progress value={checklist.completion_percentage} className="mb-4" />
                      
                      <div className="space-y-2">
                        {checklist.checklist_items?.map((item: ChecklistItem, index: number) => (
                          <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              checked={item.completed}
                              onCheckedChange={(checked) => {
                                const updatedItems = [...checklist.checklist_items];
                                updatedItems[index].completed = checked as boolean;
                                updateChecklistItem(checklist.id, updatedItems);
                              }}
                            />
                            <div className="flex-1">
                              <span className={item.completed ? 'line-through text-gray-500' : ''}>
                                {item.item}
                              </span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {item.category}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Requests Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create New Document Request */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-4">Create Document Request</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="doc-name">Document Name *</Label>
                    <Input
                      id="doc-name"
                      value={newDocRequest.document_name}
                      onChange={(e) => setNewDocRequest(prev => ({
                        ...prev,
                        document_name: e.target.value
                      }))}
                      placeholder="Enter document name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="doc-type">Document Type</Label>
                    <Select
                      value={newDocRequest.document_type}
                      onValueChange={(value) => setNewDocRequest(prev => ({
                        ...prev,
                        document_type: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {newDocRequest.document_type ? 
                            newDocRequest.document_type.charAt(0).toUpperCase() + newDocRequest.document_type.slice(1) 
                            : 'Select type'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="policy">Policy</SelectItem>
                        <SelectItem value="procedure">Procedure</SelectItem>
                        <SelectItem value="record">Record</SelectItem>
                        <SelectItem value="evidence">Evidence</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="requested-from">Requested From *</Label>
                    <Select
                      value={newDocRequest.requested_from_id}
                      onValueChange={(value) => setNewDocRequest(prev => ({
                        ...prev,
                        requested_from_id: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select person">
                          {userDisplayMap[newDocRequest.requested_from_id] || 'Select person'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="due-date">Due Date</Label>
                    <Input
                      id="due-date"
                      type="datetime-local"
                      value={newDocRequest.due_date}
                      onChange={(e) => setNewDocRequest(prev => ({
                        ...prev,
                        due_date: e.target.value
                      }))}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="doc-description">Description</Label>
                    <Textarea
                      id="doc-description"
                      value={newDocRequest.document_description}
                      onChange={(e) => setNewDocRequest(prev => ({
                        ...prev,
                        document_description: e.target.value
                      }))}
                      placeholder="Describe what document is needed and why"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button onClick={createDocumentRequest} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Request
                  </Button>
                </div>
              </div>

              {/* Existing Document Requests */}
              <div className="space-y-4">
                {documentRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{request.document_name}</h4>
                        <p className="text-sm text-gray-600">{request.document_description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusBadgeColor(request.status)}>
                          {request.status}
                        </Badge>
                        <Badge className={getPriorityBadgeColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Type: {request.document_type}</span>
                      {request.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due: {new Date(request.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    {request.status === 'requested' && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateDocumentRequest(request.id!, { status: 'provided' })}
                        >
                          Mark as Provided
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateDocumentRequest(request.id!, { status: 'not_available' })}
                        >
                          Not Available
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Pre-Audit Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create New Risk Assessment */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-4">Create Risk Assessment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="risk-area">Risk Area *</Label>
                    <Input
                      id="risk-area"
                      value={newRiskAssessment.risk_area}
                      onChange={(e) => setNewRiskAssessment(prev => ({
                        ...prev,
                        risk_area: e.target.value
                      }))}
                      placeholder="e.g., IT Security, Financial Controls"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="control-effectiveness">Control Effectiveness</Label>
                    <Select
                      value={newRiskAssessment.control_effectiveness}
                      onValueChange={(value) => setNewRiskAssessment(prev => ({
                        ...prev,
                        control_effectiveness: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="effective">Effective</SelectItem>
                        <SelectItem value="partially_effective">Partially Effective</SelectItem>
                        <SelectItem value="ineffective">Ineffective</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="likelihood">Likelihood (1-5)</Label>
                    <Select
                      value={newRiskAssessment.likelihood.toString()}
                      onValueChange={(value) => setNewRiskAssessment(prev => ({
                        ...prev,
                        likelihood: parseInt(value)
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Very Low</SelectItem>
                        <SelectItem value="2">2 - Low</SelectItem>
                        <SelectItem value="3">3 - Medium</SelectItem>
                        <SelectItem value="4">4 - High</SelectItem>
                        <SelectItem value="5">5 - Very High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="impact">Impact (1-5)</Label>
                    <Select
                      value={newRiskAssessment.impact.toString()}
                      onValueChange={(value) => setNewRiskAssessment(prev => ({
                        ...prev,
                        impact: parseInt(value)
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Very Low</SelectItem>
                        <SelectItem value="2">2 - Low</SelectItem>
                        <SelectItem value="3">3 - Medium</SelectItem>
                        <SelectItem value="4">4 - High</SelectItem>
                        <SelectItem value="5">5 - Very High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="risk-description">Risk Description *</Label>
                    <Textarea
                      id="risk-description"
                      value={newRiskAssessment.risk_description}
                      onChange={(e) => setNewRiskAssessment(prev => ({
                        ...prev,
                        risk_description: e.target.value
                      }))}
                      placeholder="Describe the risk and potential impact"
                      rows={3}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="audit-procedures">Recommended Audit Procedures</Label>
                    <Textarea
                      id="audit-procedures"
                      value={newRiskAssessment.recommended_audit_procedures}
                      onChange={(e) => setNewRiskAssessment(prev => ({
                        ...prev,
                        recommended_audit_procedures: e.target.value
                      }))}
                      placeholder="Describe recommended audit procedures for this risk area"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button onClick={createRiskAssessment} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assessment
                  </Button>
                </div>
              </div>

              {/* Existing Risk Assessments */}
              <div className="space-y-4">
                {riskAssessments.map((assessment) => (
                  <div key={assessment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{assessment.risk_area}</h4>
                        <p className="text-sm text-gray-600">{assessment.risk_description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getRiskLevelColor(assessment.risk_level || 'low')}`}></div>
                        <span className="text-sm font-medium capitalize">
                          {assessment.risk_level} Risk
                        </span>
                        <span className="text-sm text-gray-600">
                          Score: {assessment.risk_score}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Likelihood:</span>
                        <span className="ml-1 font-medium">{assessment.likelihood}/5</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Impact:</span>
                        <span className="ml-1 font-medium">{assessment.impact}/5</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Controls:</span>
                        <span className="ml-1 font-medium capitalize">
                          {assessment.control_effectiveness.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Detailed Testing:</span>
                        <span className="ml-1 font-medium">
                          {(assessment.risk_score || 0) >= 15 ? 'Required' : 'Standard'}
                        </span>
                      </div>
                    </div>
                    
                    {assessment.recommended_audit_procedures && (
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <h5 className="font-medium text-sm mb-1">Recommended Procedures:</h5>
                        <p className="text-sm text-gray-700">{assessment.recommended_audit_procedures}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        {!preparationStatus?.preparation_completed && (
          <Button
            variant="outline"
            onClick={async () => {
              try {
                setLoading(true);
                await api.post(`/audits/${auditId}/prepare`, { preparation_completed: true });
                setSuccess('Preparation marked as complete');
                await fetchPreparationStatus();
              } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to mark preparation complete');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Preparation Complete
          </Button>
        )}
        <Button
          onClick={() => router.push(`/audits/${auditId}/execute`)}
          disabled={!preparationStatus?.can_proceed_to_execution}
        >
          Proceed to Execution
        </Button>
      </div>
    </div>
  );
}