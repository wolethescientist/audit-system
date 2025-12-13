'use client';

import React, { useState, useEffect } from 'react';
import { GapAnalysis, CAPAItem, User, GapCAPALinkingRequest } from '@/lib/types';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface GapRemediationProps {
  selectedGaps?: GapAnalysis[];
  onGapUpdate?: (gap: GapAnalysis) => void;
  onCAPACreated?: (capa: CAPAItem) => void;
}

const GapRemediation: React.FC<GapRemediationProps> = ({
  selectedGaps = [],
  onGapUpdate,
  onCAPACreated
}) => {
  const [gaps, setGaps] = useState<GapAnalysis[]>(selectedGaps);
  const [capaItems, setCAPAItems] = useState<CAPAItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // CAPA Creation Form
  const [showCAPAForm, setShowCAPAForm] = useState(false);
  const [selectedGapIds, setSelectedGapIds] = useState<string[]>([]);
  const [capaFormData, setCAPAFormData] = useState({
    title: '',
    description: '',
    corrective_action: '',
    preventive_action: '',
    assigned_to_id: '',
    due_date: '',
    priority: 'medium'
  });

  // Gap Update Form
  const [selectedGap, setSelectedGap] = useState<GapAnalysis | null>(null);
  const [gapUpdateData, setGapUpdateData] = useState({
    gap_status: '',
    compliance_percentage: 0,
    remediation_plan: '',
    evidence_provided: '',
    verification_method: '',
    actual_closure_date: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    setGaps(selectedGaps);
  }, [selectedGaps]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, capaRes] = await Promise.all([
        api.get('/api/v1/users'),
        api.get('/api/v1/capa')
      ]);
      
      setUsers(usersRes.data);
      setCAPAItems(capaRes.data);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      setError('Failed to load remediation data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGapSelection = (gapId: string, selected: boolean) => {
    if (selected) {
      setSelectedGapIds(prev => [...prev, gapId]);
    } else {
      setSelectedGapIds(prev => prev.filter(id => id !== gapId));
    }
  };

  const handleSelectAllGaps = () => {
    if (selectedGapIds.length === gaps.length) {
      setSelectedGapIds([]);
    } else {
      setSelectedGapIds(gaps.map(gap => gap.id));
    }
  };

  const handleCAPAFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCAPAFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGapUpdateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGapUpdateData(prev => ({
      ...prev,
      [name]: name === 'compliance_percentage' ? parseInt(value) : value
    }));
  };

  const createCAPAForGaps = async () => {
    if (selectedGapIds.length === 0) {
      setError('Please select at least one gap to create CAPA');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const linkingRequest: GapCAPALinkingRequest = {
        gap_ids: selectedGapIds,
        create_new_capa: true,
        capa_details: capaFormData
      };

      const response = await api.post('/api/v1/gap-analysis/link-capa', linkingRequest);
      
      setSuccess(`Successfully created CAPA ${response.data.capa_number} and linked ${response.data.total_gaps_linked} gaps`);
      setShowCAPAForm(false);
      setSelectedGapIds([]);
      setCAPAFormData({
        title: '',
        description: '',
        corrective_action: '',
        preventive_action: '',
        assigned_to_id: '',
        due_date: '',
        priority: 'medium'
      });

      // Refresh gaps to show updated status
      await fetchGapsData();
      
      if (onCAPACreated) {
        onCAPACreated(response.data);
      }
    } catch (error) {
      console.error('Failed to create CAPA:', error);
      setError('Failed to create CAPA for selected gaps');
    } finally {
      setIsLoading(false);
    }
  };

  const linkToExistingCAPA = async (capaId: string) => {
    if (selectedGapIds.length === 0) {
      setError('Please select at least one gap to link');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const linkingRequest: GapCAPALinkingRequest = {
        gap_ids: selectedGapIds,
        capa_id: capaId
      };

      const response = await api.post('/api/v1/gap-analysis/link-capa', linkingRequest);
      
      setSuccess(`Successfully linked ${response.data.total_gaps_linked} gaps to existing CAPA`);
      setSelectedGapIds([]);
      
      // Refresh gaps to show updated status
      await fetchGapsData();
    } catch (error) {
      console.error('Failed to link gaps to CAPA:', error);
      setError('Failed to link gaps to existing CAPA');
    } finally {
      setIsLoading(false);
    }
  };

  const updateGap = async () => {
    if (!selectedGap) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.put(`/api/v1/gap-analysis/${selectedGap.id}`, gapUpdateData);
      
      setSuccess('Gap updated successfully');
      setSelectedGap(null);
      setGapUpdateData({
        gap_status: '',
        compliance_percentage: 0,
        remediation_plan: '',
        evidence_provided: '',
        verification_method: '',
        actual_closure_date: ''
      });

      // Update local state
      setGaps(prev => prev.map(gap => 
        gap.id === selectedGap.id ? { ...gap, ...response.data } : gap
      ));

      if (onGapUpdate) {
        onGapUpdate(response.data);
      }
    } catch (error) {
      console.error('Failed to update gap:', error);
      setError('Failed to update gap');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGapsData = async () => {
    try {
      const response = await api.get('/api/v1/gap-analysis');
      setGaps(response.data);
    } catch (error) {
      console.error('Failed to fetch gaps:', error);
    }
  };

  const openGapUpdateForm = (gap: GapAnalysis) => {
    setSelectedGap(gap);
    setGapUpdateData({
      gap_status: gap.gap_status,
      compliance_percentage: gap.compliance_percentage,
      remediation_plan: gap.remediation_plan || '',
      evidence_provided: gap.evidence_provided || '',
      verification_method: gap.verification_method || '',
      actual_closure_date: gap.actual_closure_date || ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'identified': return 'text-red-600 bg-red-100';
      case 'in_progress': return 'text-yellow-600 bg-yellow-100';
      case 'closed': return 'text-green-600 bg-green-100';
      case 'not_applicable': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gap Remediation</h2>
        <p className="text-gray-600">
          Manage gap remediation through CAPA integration and track progress to closure.
        </p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <div className="text-red-800">{error}</div>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <div className="text-green-800">{success}</div>
        </Alert>
      )}

      {/* Gap Selection and Actions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Gap Remediation Actions ({selectedGapIds.length} selected)
          </h3>
          <div className="flex space-x-2">
            <Button
              onClick={handleSelectAllGaps}
              variant="outline"
              size="sm"
            >
              {selectedGapIds.length === gaps.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              onClick={() => setShowCAPAForm(true)}
              disabled={selectedGapIds.length === 0}
              size="sm"
            >
              Create CAPA
            </Button>
          </div>
        </div>

        {/* Existing CAPA Options */}
        {selectedGapIds.length > 0 && capaItems.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Link to Existing CAPA</h4>
            <div className="flex flex-wrap gap-2">
              {capaItems
                .filter(capa => capa.status !== 'closed')
                .slice(0, 5)
                .map(capa => (
                <Button
                  key={capa.id}
                  onClick={() => linkToExistingCAPA(capa.id)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {capa.capa_number}: {capa.title.substring(0, 30)}...
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Gap List */}
        <div className="space-y-3">
          {gaps.map((gap) => (
            <div
              key={gap.id}
              className={`border rounded-lg p-4 transition-colors ${
                selectedGapIds.includes(gap.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={selectedGapIds.includes(gap.id)}
                  onChange={(e) => handleGapSelection(gap.id, e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                
                <div className="ml-3 flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getSeverityColor(gap.gap_severity)}>
                      {gap.gap_severity.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(gap.gap_status)}>
                      {gap.gap_status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-600">{gap.requirement_clause}</span>
                    {gap.capa_id && (
                      <Badge className="text-blue-600 bg-blue-100">
                        CAPA Linked
                      </Badge>
                    )}
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-1">{gap.requirement_title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{gap.gap_description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Compliance: {gap.compliance_percentage}%</span>
                      {gap.target_closure_date && (
                        <span>Target: {new Date(gap.target_closure_date).toLocaleDateString()}</span>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => openGapUpdateForm(gap)}
                      variant="outline"
                      size="sm"
                    >
                      Update
                    </Button>
                  </div>
                  
                  <div className="mt-2">
                    <Progress value={gap.compliance_percentage} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* CAPA Creation Form */}
      {showCAPAForm && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Create CAPA for Selected Gaps</h3>
            <Button
              onClick={() => setShowCAPAForm(false)}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); createCAPAForGaps(); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CAPA Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={capaFormData.title}
                  onChange={handleCAPAFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter CAPA title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned To
                </label>
                <select
                  name="assigned_to_id"
                  value={capaFormData.assigned_to_id}
                  onChange={handleCAPAFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select assignee</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={capaFormData.description}
                onChange={handleCAPAFormChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the CAPA objectives and scope"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Corrective Action
              </label>
              <textarea
                name="corrective_action"
                value={capaFormData.corrective_action}
                onChange={handleCAPAFormChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Actions to address the root cause"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preventive Action
              </label>
              <textarea
                name="preventive_action"
                value={capaFormData.preventive_action}
                onChange={handleCAPAFormChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Actions to prevent recurrence"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={capaFormData.due_date}
                  onChange={handleCAPAFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={capaFormData.priority}
                  onChange={handleCAPAFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                onClick={() => setShowCAPAForm(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create CAPA'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Gap Update Form */}
      {selectedGap && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Update Gap: {selectedGap.requirement_clause}
            </h3>
            <Button
              onClick={() => setSelectedGap(null)}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); updateGap(); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="gap_status"
                  value={gapUpdateData.gap_status}
                  onChange={handleGapUpdateChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="identified">Identified</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                  <option value="not_applicable">Not Applicable</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compliance Percentage
                </label>
                <input
                  type="number"
                  name="compliance_percentage"
                  value={gapUpdateData.compliance_percentage}
                  onChange={handleGapUpdateChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remediation Plan
              </label>
              <textarea
                name="remediation_plan"
                value={gapUpdateData.remediation_plan}
                onChange={handleGapUpdateChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the remediation approach"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidence Provided
              </label>
              <textarea
                name="evidence_provided"
                value={gapUpdateData.evidence_provided}
                onChange={handleGapUpdateChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe evidence of remediation"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Method
                </label>
                <input
                  type="text"
                  name="verification_method"
                  value={gapUpdateData.verification_method}
                  onChange={handleGapUpdateChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="How will closure be verified?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Closure Date
                </label>
                <input
                  type="date"
                  name="actual_closure_date"
                  value={gapUpdateData.actual_closure_date}
                  onChange={handleGapUpdateChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                onClick={() => setSelectedGap(null)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Gap'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default GapRemediation;