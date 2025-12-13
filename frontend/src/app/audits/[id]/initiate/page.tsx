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
import { CheckCircle, AlertCircle, Users, FileText, Target, Settings } from 'lucide-react';
import { api } from '@/lib/api';

interface AuditInitiationData {
  audit_objectives: string;
  audit_criteria: string;
  audit_scope_detailed: string;
  audit_methodology: string;
  auditee_organization: string;
  auditee_contact_person_id: string;
  auditee_location: string;
  feasibility_confirmed: boolean;
  feasibility_notes: string;
  audit_programme_id: string;
  risk_based_selection: boolean;
  audit_priority: string;
}

interface InitiationStatus {
  audit_id: string;
  status: string;
  initiation_checklist: Record<string, boolean>;
  completion_percentage: number;
  can_proceed_to_preparation: boolean;
}

export default function AuditInitiatePage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;

  const [audit, setAudit] = useState<any>(null);
  const [initiationData, setInitiationData] = useState<AuditInitiationData>({
    audit_objectives: '',
    audit_criteria: '',
    audit_scope_detailed: '',
    audit_methodology: '',
    auditee_organization: '',
    auditee_contact_person_id: '',
    auditee_location: '',
    feasibility_confirmed: false,
    feasibility_notes: '',
    audit_programme_id: '',
    risk_based_selection: false,
    audit_priority: 'medium'
  });
  const [initiationStatus, setInitiationStatus] = useState<InitiationStatus | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAuditDetails();
    fetchInitiationStatus();
    fetchUsers();
    fetchProgrammes();
  }, [auditId]);

  const fetchAuditDetails = async () => {
    try {
      const response = await api.get(`/audits/${auditId}`);
      setAudit(response.data);
      
      // Pre-populate form with existing data
      if (response.data) {
        setInitiationData(prev => ({
          ...prev,
          audit_objectives: response.data.audit_objectives || '',
          audit_criteria: response.data.audit_criteria || '',
          audit_scope_detailed: response.data.audit_scope_detailed || '',
          audit_methodology: response.data.audit_methodology || '',
          auditee_organization: response.data.auditee_organization || '',
          auditee_contact_person_id: response.data.auditee_contact_person_id || '',
          auditee_location: response.data.auditee_location || '',
          feasibility_confirmed: response.data.feasibility_confirmed || false,
          feasibility_notes: response.data.feasibility_notes || '',
          audit_programme_id: response.data.audit_programme_id || '',
          risk_based_selection: response.data.risk_based_selection || false,
          audit_priority: response.data.audit_priority || 'medium'
        }));
      }
    } catch (err) {
      setError('Failed to fetch audit details');
    }
  };

  const fetchInitiationStatus = async () => {
    try {
      const response = await api.get(`/audits/${auditId}/initiation-status`);
      setInitiationStatus(response.data);
    } catch (err) {
      console.error('Failed to fetch initiation status:', err);
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

  const fetchProgrammes = async () => {
    try {
      const response = await api.get('/audit-programmes');
      setProgrammes(response.data || []);
    } catch (err) {
      console.error('Failed to fetch programmes:', err);
    }
  };

  const handleInputChange = (field: keyof AuditInitiationData, value: any) => {
    setInitiationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInitiateAudit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/audits/${auditId}/initiate`, initiationData);
      setSuccess('Audit initiation completed successfully per ISO 19011 Clause 6.2');
      await fetchInitiationStatus();
      await fetchAuditDetails();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to initiate audit');
    } finally {
      setLoading(false);
    }
  };

  const getChecklistIcon = (completed: boolean) => {
    return completed ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertCircle className="h-5 w-5 text-yellow-500" />
    );
  };

  if (!audit) {
    return <div className="p-6">Loading audit details...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Initiation</h1>
          <p className="text-gray-600 mt-2">ISO 19011 Clause 6.2 - Initiating the audit</p>
          <p className="text-sm text-gray-500">Audit: {audit.title} ({audit.year})</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/audits/${auditId}`)}
        >
          Back to Audit
        </Button>
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

      {/* Initiation Status Overview */}
      {initiationStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Initiation Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Completion Progress</span>
                  <span>{Math.round(initiationStatus.completion_percentage)}%</span>
                </div>
                <Progress value={initiationStatus.completion_percentage} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(initiationStatus.initiation_checklist).map(([key, completed]) => (
                  <div key={key} className="flex items-center gap-2">
                    {getChecklistIcon(completed)}
                    <span className="text-sm capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>

              {initiationStatus.can_proceed_to_preparation && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Initiation requirements met. Ready to proceed to preparation phase.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audit Objectives and Criteria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Audit Objectives & Criteria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="objectives">Audit Objectives *</Label>
              <Textarea
                id="objectives"
                placeholder="Define clear, measurable audit objectives per ISO 19011 6.2..."
                value={initiationData.audit_objectives}
                onChange={(e) => handleInputChange('audit_objectives', e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="criteria">Audit Criteria *</Label>
              <Textarea
                id="criteria"
                placeholder="Specify standards, procedures, and requirements to audit against..."
                value={initiationData.audit_criteria}
                onChange={(e) => handleInputChange('audit_criteria', e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Scope and Methodology */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Scope & Methodology
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="scope">Detailed Audit Scope *</Label>
              <Textarea
                id="scope"
                placeholder="Define physical and organizational boundaries, processes, and time period..."
                value={initiationData.audit_scope_detailed}
                onChange={(e) => handleInputChange('audit_scope_detailed', e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="methodology">Audit Methodology *</Label>
              <Textarea
                id="methodology"
                placeholder="Describe audit methods, techniques, and approaches to be used..."
                value={initiationData.audit_methodology}
                onChange={(e) => handleInputChange('audit_methodology', e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Auditee Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Auditee Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="organization">Auditee Organization</Label>
              <Input
                id="organization"
                placeholder="Organization or department being audited"
                value={initiationData.auditee_organization}
                onChange={(e) => handleInputChange('auditee_organization', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="contact">Auditee Contact Person</Label>
              <Select
                value={initiationData.auditee_contact_person_id}
                onValueChange={(value) => handleInputChange('auditee_contact_person_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contact person" />
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
              <Label htmlFor="location">Auditee Location</Label>
              <Input
                id="location"
                placeholder="Physical location or address"
                value={initiationData.auditee_location}
                onChange={(e) => handleInputChange('auditee_location', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Programme and Risk Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Programme & Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="programme">Audit Programme</Label>
              <Select
                value={initiationData.audit_programme_id}
                onValueChange={(value) => handleInputChange('audit_programme_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select audit programme" />
                </SelectTrigger>
                <SelectContent>
                  {programmes.map((programme) => (
                    <SelectItem key={programme.id} value={programme.id}>
                      {programme.programme_name} ({programme.programme_year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Audit Priority</Label>
              <Select
                value={initiationData.audit_priority}
                onValueChange={(value) => handleInputChange('audit_priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="risk-based"
                checked={initiationData.risk_based_selection}
                onCheckedChange={(checked) => handleInputChange('risk_based_selection', checked)}
              />
              <Label htmlFor="risk-based">Risk-based audit selection (ISO 19011 5.4)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="feasibility"
                checked={initiationData.feasibility_confirmed}
                onCheckedChange={(checked) => handleInputChange('feasibility_confirmed', checked)}
              />
              <Label htmlFor="feasibility">Audit feasibility confirmed</Label>
            </div>

            {initiationData.feasibility_confirmed && (
              <div>
                <Label htmlFor="feasibility-notes">Feasibility Notes</Label>
                <Textarea
                  id="feasibility-notes"
                  placeholder="Document feasibility assessment results..."
                  value={initiationData.feasibility_notes}
                  onChange={(e) => handleInputChange('feasibility_notes', e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/audits/${auditId}/team`)}
          disabled={!initiationStatus?.can_proceed_to_preparation}
        >
          Assign Team
        </Button>
        <Button
          onClick={handleInitiateAudit}
          disabled={loading}
        >
          {loading ? 'Initiating...' : 'Complete Initiation'}
        </Button>
      </div>
    </div>
  );
}