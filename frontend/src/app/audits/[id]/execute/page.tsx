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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, AlertCircle, Calendar, 
  Plus, Trash2, Eye, MessageSquare,
  Upload, Target, Shield
} from 'lucide-react';
import { api } from '@/lib/api';
import AuditNavigation from '@/components/audit/AuditNavigation';

interface InterviewNote {
  id?: string;
  interview_title: string;
  interviewee_id: string;
  interview_date: string;
  interview_duration_minutes: number;
  interview_objective: string;
  questions_asked: Array<{question: string, response: string}>;
  key_findings: string;
  follow_up_actions: string[];
  interview_method: string;
  interview_location: string;
}

interface SamplingPlan {
  id?: string;
  sampling_name: string;
  population_description: string;
  population_size: number;
  sample_size: number;
  sampling_method: string;
  sampling_rationale: string;
  confidence_level: number;
  margin_of_error: number;
  selection_criteria: string[];
}

interface Observation {
  id?: string;
  observation_title: string;
  observation_area: string;
  observation_date: string;
  observation_duration_minutes: number;
  observation_objective: string;
  process_observed: string;
  personnel_observed: string[];
  observations_made: string;
  compliance_status: string;
  deviations_noted: string;
  observation_method: string;
  observation_announced: boolean;
  requires_follow_up: boolean;
  follow_up_actions: string[];
}

export default function AuditExecutePage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;

  const [audit, setAudit] = useState<any>(null);
  const [executionStatus, setExecutionStatus] = useState<any>(null);
  const [interviewNotes, setInterviewNotes] = useState<any[]>([]);
  const [samplingPlans, setSamplingPlans] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [evidenceItems, setEvidenceItems] = useState<any[]>([]);
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
  const [newInterview, setNewInterview] = useState<InterviewNote>({
    interview_title: '',
    interviewee_id: '',
    interview_date: '',
    interview_duration_minutes: 60,
    interview_objective: '',
    questions_asked: [],
    key_findings: '',
    follow_up_actions: [],
    interview_method: 'structured',
    interview_location: ''
  });

  const [newSampling, setNewSampling] = useState<SamplingPlan>({
    sampling_name: '',
    population_description: '',
    population_size: 0,
    sample_size: 0,
    sampling_method: 'random',
    sampling_rationale: '',
    confidence_level: 95,
    margin_of_error: 5,
    selection_criteria: []
  });

  const [newObservation, setNewObservation] = useState<Observation>({
    observation_title: '',
    observation_area: '',
    observation_date: '',
    observation_duration_minutes: 30,
    observation_objective: '',
    process_observed: '',
    personnel_observed: [],
    observations_made: '',
    compliance_status: 'compliant',
    deviations_noted: '',
    observation_method: 'direct',
    observation_announced: true,
    requires_follow_up: false,
    follow_up_actions: []
  });

  const [newEvidence, setNewEvidence] = useState<{
    file: File | null;
    description: string;
    evidence_type: string;
    evidence_source: string;
  }>({
    file: null,
    description: '',
    evidence_type: 'document',
    evidence_source: 'auditee'
  });

  useEffect(() => {
    fetchAuditDetails();
    fetchExecutionStatus();
    fetchInterviewNotes();
    fetchSamplingPlans();
    fetchObservations();
    fetchEvidenceItems();
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

  const fetchExecutionStatus = async () => {
    try {
      const response = await api.get(`/audits/${auditId}/execution-status`);
      setExecutionStatus(response.data);
    } catch (err) {
      console.error('Failed to fetch execution status:', err);
    }
  };

  const fetchInterviewNotes = async () => {
    try {
      const response = await api.get(`/audits/${auditId}/interview-notes`);
      setInterviewNotes(response.data);
    } catch (err) {
      console.error('Failed to fetch interview notes:', err);
    }
  };

  const fetchSamplingPlans = async () => {
    try {
      const response = await api.get(`/audits/${auditId}/sampling`);
      setSamplingPlans(response.data);
    } catch (err) {
      console.error('Failed to fetch sampling plans:', err);
    }
  };

  const fetchObservations = async () => {
    try {
      const response = await api.get(`/audits/${auditId}/observations`);
      setObservations(response.data);
    } catch (err) {
      console.error('Failed to fetch observations:', err);
    }
  };

  const fetchEvidenceItems = async () => {
    try {
      const response = await api.get(`/audits/${auditId}/evidence`);
      setEvidenceItems(response.data);
    } catch (err) {
      console.error('Failed to fetch evidence items:', err);
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

  const createInterviewNote = async () => {
    if (!newInterview.interview_title || !newInterview.interviewee_id) {
      setError('Interview title and interviewee are required');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/audits/${auditId}/interview-notes`, newInterview);
      setSuccess('Interview note created successfully');
      setNewInterview({
        interview_title: '',
        interviewee_id: '',
        interview_date: '',
        interview_duration_minutes: 60,
        interview_objective: '',
        questions_asked: [],
        key_findings: '',
        follow_up_actions: [],
        interview_method: 'structured',
        interview_location: ''
      });
      await fetchInterviewNotes();
      await fetchExecutionStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create interview note');
    } finally {
      setLoading(false);
    }
  };

  const createSamplingPlan = async () => {
    if (!newSampling.sampling_name || !newSampling.population_description) {
      setError('Sampling name and population description are required');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/audits/${auditId}/sampling`, newSampling);
      setSuccess('Sampling plan created successfully');
      setNewSampling({
        sampling_name: '',
        population_description: '',
        population_size: 0,
        sample_size: 0,
        sampling_method: 'random',
        sampling_rationale: '',
        confidence_level: 95,
        margin_of_error: 5,
        selection_criteria: []
      });
      await fetchSamplingPlans();
      await fetchExecutionStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create sampling plan');
    } finally {
      setLoading(false);
    }
  };

  const createObservation = async () => {
    if (!newObservation.observation_title || !newObservation.observation_area) {
      setError('Observation title and area are required');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/audits/${auditId}/observations`, newObservation);
      setSuccess('Observation created successfully');
      setNewObservation({
        observation_title: '',
        observation_area: '',
        observation_date: '',
        observation_duration_minutes: 30,
        observation_objective: '',
        process_observed: '',
        personnel_observed: [],
        observations_made: '',
        compliance_status: 'compliant',
        deviations_noted: '',
        observation_method: 'direct',
        observation_announced: true,
        requires_follow_up: false,
        follow_up_actions: []
      });
      await fetchObservations();
      await fetchExecutionStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create observation');
    } finally {
      setLoading(false);
    }
  };

  const uploadEvidence = async () => {
    if (!newEvidence.file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', newEvidence.file);
      formData.append('description', newEvidence.description);
      formData.append('evidence_type', newEvidence.evidence_type);
      formData.append('evidence_source', newEvidence.evidence_source);

      await api.post(`/audits/${auditId}/evidence/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess('Evidence uploaded successfully');
      setNewEvidence({
        file: null,
        description: '',
        evidence_type: 'document',
        evidence_source: 'auditee'
      });
      // Reset file input
      const fileInput = document.getElementById('evidence-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      await fetchEvidenceItems();
      await fetchExecutionStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload evidence');
    } finally {
      setLoading(false);
    }
  };

  const viewEvidence = (evidenceId: string) => {
    const evidence = evidenceItems.find(e => e.id === evidenceId);
    if (evidence?.file_url) {
      window.open(evidence.file_url, '_blank');
    } else {
      setError('File URL not available');
    }
  };

  const addQuestionToInterview = () => {
    setNewInterview(prev => ({
      ...prev,
      questions_asked: [...prev.questions_asked, { question: '', response: '' }]
    }));
  };

  const updateQuestion = (index: number, field: 'question' | 'response', value: string) => {
    setNewInterview(prev => ({
      ...prev,
      questions_asked: prev.questions_asked.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeQuestion = (index: number) => {
    setNewInterview(prev => ({
      ...prev,
      questions_asked: prev.questions_asked.filter((_, i) => i !== index)
    }));
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      case 'partially_compliant': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSamplingMethodColor = (method: string) => {
    switch (method) {
      case 'statistical': return 'bg-blue-100 text-blue-800';
      case 'random': return 'bg-green-100 text-green-800';
      case 'systematic': return 'bg-purple-100 text-purple-800';
      case 'judgmental': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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
          <h2 className="text-xl font-semibold">Audit Execution</h2>
          <p className="text-gray-600 mt-1">ISO 19011 Clause 6.4 - Conducting audit activities</p>
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

      {/* Execution Status Overview */}
      {executionStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Execution Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {executionStatus.interview_notes_count}
                </div>
                <div className="text-sm text-gray-600">Interview Notes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {executionStatus.observations_count}
                </div>
                <div className="text-sm text-gray-600">Observations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {executionStatus.evidence_items_count}
                </div>
                <div className="text-sm text-gray-600">Evidence Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(executionStatus.evidence_integrity_percentage ?? 0)}%
                </div>
                <div className="text-sm text-gray-600">Evidence Integrity</div>
              </div>
            </div>

            {executionStatus.can_proceed_to_reporting && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Sufficient evidence collected. Ready to proceed to reporting phase.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="interviews" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="interviews">Interview Notes</TabsTrigger>
          <TabsTrigger value="observations">Observations</TabsTrigger>
          <TabsTrigger value="sampling">Audit Sampling</TabsTrigger>
          <TabsTrigger value="evidence">Enhanced Evidence</TabsTrigger>
        </TabsList>

        {/* Interview Notes Tab */}
        <TabsContent value="interviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Interview Notes (ISO 19011 Clause 6.4.4)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create New Interview Note */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-4">Create Interview Note</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="interview-title">Interview Title *</Label>
                    <Input
                      id="interview-title"
                      value={newInterview.interview_title}
                      onChange={(e) => setNewInterview(prev => ({
                        ...prev,
                        interview_title: e.target.value
                      }))}
                      placeholder="Enter interview title"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="interviewee">Interviewee *</Label>
                    <Select
                      value={newInterview.interviewee_id}
                      onValueChange={(value) => setNewInterview(prev => ({
                        ...prev,
                        interviewee_id: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select interviewee">
                          {userDisplayMap[newInterview.interviewee_id] || 'Select interviewee'}
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
                    <Label htmlFor="interview-date">Interview Date</Label>
                    <Input
                      id="interview-date"
                      type="datetime-local"
                      value={newInterview.interview_date}
                      onChange={(e) => setNewInterview(prev => ({
                        ...prev,
                        interview_date: e.target.value
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newInterview.interview_duration_minutes}
                      onChange={(e) => setNewInterview(prev => ({
                        ...prev,
                        interview_duration_minutes: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="method">Interview Method</Label>
                    <Select
                      value={newInterview.interview_method}
                      onValueChange={(value) => setNewInterview(prev => ({
                        ...prev,
                        interview_method: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="structured">Structured</SelectItem>
                        <SelectItem value="semi_structured">Semi-Structured</SelectItem>
                        <SelectItem value="unstructured">Unstructured</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newInterview.interview_location}
                      onChange={(e) => setNewInterview(prev => ({
                        ...prev,
                        interview_location: e.target.value
                      }))}
                      placeholder="Interview location"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="objective">Interview Objective</Label>
                    <Textarea
                      id="objective"
                      value={newInterview.interview_objective}
                      onChange={(e) => setNewInterview(prev => ({
                        ...prev,
                        interview_objective: e.target.value
                      }))}
                      placeholder="Purpose and objectives of the interview"
                      rows={3}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label>Questions and Responses</Label>
                    <div className="space-y-3 mt-2">
                      {newInterview.questions_asked.map((qa, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <div className="flex-1">
                            <Input
                              placeholder="Question"
                              value={qa.question}
                              onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                              className="mb-2"
                            />
                            <Textarea
                              placeholder="Response"
                              value={qa.response}
                              onChange={(e) => updateQuestion(index, 'response', e.target.value)}
                              rows={2}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeQuestion(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={addQuestionToInterview}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="findings">Key Findings</Label>
                    <Textarea
                      id="findings"
                      value={newInterview.key_findings}
                      onChange={(e) => setNewInterview(prev => ({
                        ...prev,
                        key_findings: e.target.value
                      }))}
                      placeholder="Summary of key findings from the interview"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button onClick={createInterviewNote} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Interview Note
                  </Button>
                </div>
              </div>

              {/* Existing Interview Notes */}
              <div className="space-y-4">
                {interviewNotes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{note.interview_title}</h4>
                        <p className="text-sm text-gray-600">
                          Interviewee: {users.find(u => u.id === note.interviewee_id)?.full_name || 'Unknown'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {note.interview_method}
                        </Badge>
                        <Badge variant="outline">
                          {note.interview_duration_minutes} min
                        </Badge>
                      </div>
                    </div>
                    
                    {note.interview_objective && (
                      <div className="mb-3">
                        <h5 className="font-medium text-sm mb-1">Objective:</h5>
                        <p className="text-sm text-gray-700">{note.interview_objective}</p>
                      </div>
                    )}
                    
                    {note.key_findings && (
                      <div className="mb-3">
                        <h5 className="font-medium text-sm mb-1">Key Findings:</h5>
                        <p className="text-sm text-gray-700">{note.key_findings}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(note.interview_date).toLocaleDateString()}
                      </span>
                      {note.interview_location && (
                        <span>Location: {note.interview_location}</span>
                      )}
                      <span>Questions: {note.questions_asked?.length || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Observations Tab */}
        <TabsContent value="observations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Audit Observations (ISO 19011 Clause 6.4.2)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create New Observation */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-4">Create Observation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="obs-title">Observation Title *</Label>
                    <Input
                      id="obs-title"
                      value={newObservation.observation_title}
                      onChange={(e) => setNewObservation(prev => ({
                        ...prev,
                        observation_title: e.target.value
                      }))}
                      placeholder="Enter observation title"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="obs-area">Observation Area *</Label>
                    <Input
                      id="obs-area"
                      value={newObservation.observation_area}
                      onChange={(e) => setNewObservation(prev => ({
                        ...prev,
                        observation_area: e.target.value
                      }))}
                      placeholder="Location or process area"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="obs-date">Observation Date</Label>
                    <Input
                      id="obs-date"
                      type="datetime-local"
                      value={newObservation.observation_date}
                      onChange={(e) => setNewObservation(prev => ({
                        ...prev,
                        observation_date: e.target.value
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="obs-duration">Duration (minutes)</Label>
                    <Input
                      id="obs-duration"
                      type="number"
                      value={newObservation.observation_duration_minutes}
                      onChange={(e) => setNewObservation(prev => ({
                        ...prev,
                        observation_duration_minutes: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="obs-method">Observation Method</Label>
                    <Select
                      value={newObservation.observation_method}
                      onValueChange={(value) => setNewObservation(prev => ({
                        ...prev,
                        observation_method: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">Direct</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="continuous">Continuous</SelectItem>
                        <SelectItem value="spot_check">Spot Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="compliance-status">Compliance Status</Label>
                    <Select
                      value={newObservation.compliance_status}
                      onValueChange={(value) => setNewObservation(prev => ({
                        ...prev,
                        compliance_status: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compliant">Compliant</SelectItem>
                        <SelectItem value="partially_compliant">Partially Compliant</SelectItem>
                        <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="process-observed">Process Observed</Label>
                    <Input
                      id="process-observed"
                      value={newObservation.process_observed}
                      onChange={(e) => setNewObservation(prev => ({
                        ...prev,
                        process_observed: e.target.value
                      }))}
                      placeholder="Specific process or activity observed"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="observations-made">Observations Made *</Label>
                    <Textarea
                      id="observations-made"
                      value={newObservation.observations_made}
                      onChange={(e) => setNewObservation(prev => ({
                        ...prev,
                        observations_made: e.target.value
                      }))}
                      placeholder="Detailed observations and findings"
                      rows={4}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="deviations">Deviations Noted</Label>
                    <Textarea
                      id="deviations"
                      value={newObservation.deviations_noted}
                      onChange={(e) => setNewObservation(prev => ({
                        ...prev,
                        deviations_noted: e.target.value
                      }))}
                      placeholder="Any deviations from expected procedures"
                      rows={3}
                    />
                  </div>
                  
                  <div className="md:col-span-2 flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="announced"
                        checked={newObservation.observation_announced}
                        onCheckedChange={(checked) => setNewObservation(prev => ({
                          ...prev,
                          observation_announced: checked as boolean
                        }))}
                      />
                      <Label htmlFor="announced">Observation was announced</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="follow-up"
                        checked={newObservation.requires_follow_up}
                        onCheckedChange={(checked) => setNewObservation(prev => ({
                          ...prev,
                          requires_follow_up: checked as boolean
                        }))}
                      />
                      <Label htmlFor="follow-up">Requires follow-up</Label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button onClick={createObservation} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Observation
                  </Button>
                </div>
              </div>

              {/* Existing Observations */}
              <div className="space-y-4">
                {observations.map((obs) => (
                  <div key={obs.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{obs.observation_title}</h4>
                        <p className="text-sm text-gray-600">Area: {obs.observation_area}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getComplianceStatusColor(obs.compliance_status)}>
                          {obs.compliance_status?.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">
                          {obs.observation_method}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <h5 className="font-medium text-sm mb-1">Observations:</h5>
                      <p className="text-sm text-gray-700">{obs.observations_made}</p>
                    </div>
                    
                    {obs.deviations_noted && (
                      <div className="mb-3 p-3 bg-yellow-50 rounded">
                        <h5 className="font-medium text-sm mb-1">Deviations Noted:</h5>
                        <p className="text-sm text-gray-700">{obs.deviations_noted}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(obs.observation_date).toLocaleDateString()}
                      </span>
                      <span>Duration: {obs.observation_duration_minutes} min</span>
                      <span>Process: {obs.process_observed}</span>
                      {obs.requires_follow_up && (
                        <Badge variant="outline" className="text-orange-600">
                          Follow-up Required
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sampling Tab */}
        <TabsContent value="sampling" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Audit Sampling (ISO 19011 Clause 6.4.3)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create New Sampling Plan */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-4">Create Sampling Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sampling-name">Sampling Name *</Label>
                    <Input
                      id="sampling-name"
                      value={newSampling.sampling_name}
                      onChange={(e) => setNewSampling(prev => ({
                        ...prev,
                        sampling_name: e.target.value
                      }))}
                      placeholder="Enter sampling plan name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sampling-method">Sampling Method</Label>
                    <Select
                      value={newSampling.sampling_method}
                      onValueChange={(value) => setNewSampling(prev => ({
                        ...prev,
                        sampling_method: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="random">Random</SelectItem>
                        <SelectItem value="systematic">Systematic</SelectItem>
                        <SelectItem value="statistical">Statistical</SelectItem>
                        <SelectItem value="judgmental">Judgmental</SelectItem>
                        <SelectItem value="block">Block</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="population-size">Population Size</Label>
                    <Input
                      id="population-size"
                      type="number"
                      value={newSampling.population_size}
                      onChange={(e) => setNewSampling(prev => ({
                        ...prev,
                        population_size: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sample-size">Sample Size</Label>
                    <Input
                      id="sample-size"
                      type="number"
                      value={newSampling.sample_size}
                      onChange={(e) => setNewSampling(prev => ({
                        ...prev,
                        sample_size: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confidence">Confidence Level (%)</Label>
                    <Input
                      id="confidence"
                      type="number"
                      value={newSampling.confidence_level}
                      onChange={(e) => setNewSampling(prev => ({
                        ...prev,
                        confidence_level: parseInt(e.target.value) || 95
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="margin-error">Margin of Error (%)</Label>
                    <Input
                      id="margin-error"
                      type="number"
                      value={newSampling.margin_of_error}
                      onChange={(e) => setNewSampling(prev => ({
                        ...prev,
                        margin_of_error: parseInt(e.target.value) || 5
                      }))}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="population-desc">Population Description *</Label>
                    <Textarea
                      id="population-desc"
                      value={newSampling.population_description}
                      onChange={(e) => setNewSampling(prev => ({
                        ...prev,
                        population_description: e.target.value
                      }))}
                      placeholder="Describe the population being sampled"
                      rows={3}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="sampling-rationale">Sampling Rationale</Label>
                    <Textarea
                      id="sampling-rationale"
                      value={newSampling.sampling_rationale}
                      onChange={(e) => setNewSampling(prev => ({
                        ...prev,
                        sampling_rationale: e.target.value
                      }))}
                      placeholder="Justification for the sampling approach"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button onClick={createSamplingPlan} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Sampling Plan
                  </Button>
                </div>
              </div>

              {/* Existing Sampling Plans */}
              <div className="space-y-4">
                {samplingPlans.map((plan) => (
                  <div key={plan.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{plan.sampling_name}</h4>
                        <p className="text-sm text-gray-600">{plan.population_description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getSamplingMethodColor(plan.sampling_method)}>
                          {plan.sampling_method}
                        </Badge>
                        <Badge variant="outline">
                          {plan.completion_percentage || 0}% Complete
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Population:</span>
                        <span className="ml-1 font-medium">{plan.population_size}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Sample:</span>
                        <span className="ml-1 font-medium">{plan.sample_size}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Confidence:</span>
                        <span className="ml-1 font-medium">{plan.confidence_level}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Error Rate:</span>
                        <span className="ml-1 font-medium">{plan.error_rate || 0}%</span>
                      </div>
                    </div>
                    
                    {plan.completion_percentage > 0 && (
                      <Progress value={plan.completion_percentage} className="mb-3" />
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Tested: {plan.samples_tested || 0}/{plan.sample_size}</span>
                      <span>Passed: {plan.samples_passed || 0}</span>
                      <span>Failed: {plan.samples_failed || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Evidence Tab */}
        <TabsContent value="evidence" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Enhanced Evidence Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Evidence Upload Form */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-4">Upload Evidence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="evidence-file">Select File *</Label>
                    <Input
                      id="evidence-file"
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewEvidence(prev => ({ ...prev, file }));
                        }
                      }}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="evidence-description">Description</Label>
                    <Textarea
                      id="evidence-description"
                      value={newEvidence.description}
                      onChange={(e) => setNewEvidence(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the evidence and its relevance to the audit"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="evidence-type">Evidence Type</Label>
                    <Select
                      value={newEvidence.evidence_type}
                      onValueChange={(value) => setNewEvidence(prev => ({ ...prev, evidence_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="record">Record</SelectItem>
                        <SelectItem value="interview">Interview Transcript</SelectItem>
                        <SelectItem value="observation">Observation Notes</SelectItem>
                        <SelectItem value="photo">Photo/Image</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="evidence-source">Evidence Source</Label>
                    <Select
                      value={newEvidence.evidence_source}
                      onValueChange={(value) => setNewEvidence(prev => ({ ...prev, evidence_source: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auditee">Auditee</SelectItem>
                        <SelectItem value="auditor">Auditor</SelectItem>
                        <SelectItem value="system">System Generated</SelectItem>
                        <SelectItem value="external">External Source</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button onClick={uploadEvidence} disabled={loading || !newEvidence.file}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Evidence
                  </Button>
                </div>
              </div>

              {/* Evidence List */}
              <div className="space-y-4">
                {evidenceItems.map((evidence) => (
                  <div key={evidence.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{evidence.file_name}</h4>
                        <p className="text-sm text-gray-600">{evidence.description}</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge variant="outline">
                          {evidence.evidence_type || 'document'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewEvidence(evidence.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Source:</span>
                        <span className="ml-1 font-medium capitalize">
                          {evidence.evidence_source?.replace('_', ' ') || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Relevance:</span>
                        <span className="ml-1 font-medium">{evidence.relevance_score || '-'}/5</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Reliability:</span>
                        <span className="ml-1 font-medium">{evidence.reliability_score || '-'}/5</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Size:</span>
                        <span className="ml-1 font-medium">
                          {evidence.file_size ? `${Math.round(evidence.file_size / 1024)} KB` : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {evidenceItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No evidence items uploaded yet. Upload files using the form above.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/audits/${auditId}/report`)}
          disabled={!(executionStatus?.can_proceed_to_reporting || interviewNotes.length > 0 || observations.length > 0 || evidenceItems.length > 0)}
        >
          Proceed to Reporting
        </Button>
      </div>
    </div>
  );
}