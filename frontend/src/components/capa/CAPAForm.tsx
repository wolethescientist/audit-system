'use client';

import React, { useState, useEffect } from 'react';
import { CAPACreate, CAPAType, User, Department, Audit, AuditFinding, RiskAssessment } from '@/lib/types';
import { api } from '@/lib/api';

interface CAPAFormProps {
  onSubmit: (data: CAPACreate) => void;
  onCancel: () => void;
  initialData?: Partial<CAPACreate>;
  auditId?: string;
  findingId?: string;
  riskId?: string;
}

// Helper function to format date for HTML date input (yyyy-MM-dd)
const formatDateForInput = (dateValue: string | undefined | null): string => {
  if (!dateValue) return '';
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

// Process initial data to format dates correctly
const processInitialData = (data: Partial<CAPACreate> | undefined): Partial<CAPACreate> => {
  if (!data) return {};
  return {
    ...data,
    due_date: formatDateForInput(data.due_date),
    target_completion_date: formatDateForInput(data.target_completion_date),
  };
};

export default function CAPAForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  auditId, 
  findingId, 
  riskId 
}: CAPAFormProps) {
  const processedInitialData = processInitialData(initialData);
  
  const [formData, setFormData] = useState<CAPACreate>({
    title: '',
    description: '',
    capa_type: CAPAType.CORRECTIVE,
    audit_id: auditId,
    finding_id: findingId,
    risk_id: riskId,
    priority: 'medium',
    ...processedInitialData
  });

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [risks, setRisks] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      const [usersRes, departmentsRes, auditsRes] = await Promise.all([
        api.get('/users'),
        api.get('/departments'),
        api.get('/audits')
      ]);

      setUsers(usersRes.data);
      setDepartments(departmentsRes.data);
      setAudits(auditsRes.data);

      // Load findings if audit is selected
      if (formData.audit_id) {
        const findingsRes = await api.get(`/audits/${formData.audit_id}/findings`);
        setFindings(findingsRes.data);
      }

      // Load risks if audit is selected
      if (formData.audit_id) {
        const risksRes = await api.get(`/api/v1/risks?audit_id=${formData.audit_id}`);
        setRisks(risksRes.data);
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
    }
  };

  const handleAuditChange = async (auditId: string) => {
    setFormData(prev => ({ ...prev, audit_id: auditId, finding_id: undefined, risk_id: undefined }));
    
    if (auditId) {
      try {
        const [findingsRes, risksRes] = await Promise.all([
          api.get(`/audits/${auditId}/findings`),
          api.get(`/api/v1/risks?audit_id=${auditId}`)
        ]);
        setFindings(findingsRes.data);
        setRisks(risksRes.data);
      } catch (error) {
        console.error('Failed to load audit-related data:', error);
      }
    } else {
      setFindings([]);
      setRisks([]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.capa_type) {
      newErrors.capa_type = 'CAPA type is required';
    }

    if (formData.due_date && formData.target_completion_date) {
      const dueDate = new Date(formData.due_date);
      const targetDate = new Date(formData.target_completion_date);
      if (targetDate > dueDate) {
        newErrors.target_completion_date = 'Target completion date cannot be after due date';
      }
    }

    if (formData.estimated_cost && formData.estimated_cost < 0) {
      newErrors.estimated_cost = 'Estimated cost cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to submit CAPA:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CAPACreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {initialData ? 'Edit CAPA Item' : 'Create New CAPA Item'}
        </h2>
        <div className="text-sm text-gray-500">
          ISO 9001 Clause 10.2 - Corrective and Preventive Actions
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter CAPA title"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CAPA Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.capa_type}
              onChange={(e) => handleInputChange('capa_type', e.target.value as CAPAType)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.capa_type ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value={CAPAType.CORRECTIVE}>Corrective Action</option>
              <option value={CAPAType.PREVENTIVE}>Preventive Action</option>
              <option value={CAPAType.BOTH}>Both Corrective & Preventive</option>
            </select>
            {errors.capa_type && <p className="mt-1 text-sm text-red-600">{errors.capa_type}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the nonconformity or issue requiring CAPA"
          />
        </div>

        {/* Context Linking */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Related Audit
            </label>
            <select
              value={formData.audit_id || ''}
              onChange={(e) => handleAuditChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select audit (optional)</option>
              {audits.map((audit) => (
                <option key={audit.id} value={audit.id}>
                  {audit.title} ({audit.year})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Related Finding
            </label>
            <select
              value={formData.finding_id || ''}
              onChange={(e) => handleInputChange('finding_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!formData.audit_id}
            >
              <option value="">Select finding (optional)</option>
              {findings.map((finding) => (
                <option key={finding.id} value={finding.id}>
                  {finding.title} ({finding.severity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Related Risk
            </label>
            <select
              value={formData.risk_id || ''}
              onChange={(e) => handleInputChange('risk_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!formData.audit_id}
            >
              <option value="">Select risk (optional)</option>
              {risks.map((risk) => (
                <option key={risk.id} value={risk.id}>
                  {risk.risk_title} ({risk.risk_category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Assignment and Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned To
            </label>
            <select
              value={formData.assigned_to_id || ''}
              onChange={(e) => handleInputChange('assigned_to_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select assignee</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsible Department
            </label>
            <select
              value={formData.responsible_department_id || ''}
              onChange={(e) => handleInputChange('responsible_department_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={formData.due_date || ''}
              onChange={(e) => handleInputChange('due_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Completion Date
            </label>
            <input
              type="date"
              value={formData.target_completion_date || ''}
              onChange={(e) => handleInputChange('target_completion_date', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.target_completion_date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.target_completion_date && (
              <p className="mt-1 text-sm text-red-600">{errors.target_completion_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority || 'medium'}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Cost Estimation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Cost
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.estimated_cost || ''}
            onChange={(e) => handleInputChange('estimated_cost', parseFloat(e.target.value) || undefined)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.estimated_cost ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter estimated cost"
          />
          {errors.estimated_cost && (
            <p className="mt-1 text-sm text-red-600">{errors.estimated_cost}</p>
          )}
        </div>

        {/* Initial Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Initial Actions (ISO 9001 Clause 10.2.1)</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Immediate Action (Containment)
            </label>
            <textarea
              value={formData.immediate_action || ''}
              onChange={(e) => handleInputChange('immediate_action', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe immediate actions taken to contain the issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Corrective Action (Address Root Cause)
            </label>
            <textarea
              value={formData.corrective_action || ''}
              onChange={(e) => handleInputChange('corrective_action', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe actions to eliminate the root cause"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preventive Action (Prevent Recurrence)
            </label>
            <textarea
              value={formData.preventive_action || ''}
              onChange={(e) => handleInputChange('preventive_action', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe actions to prevent similar issues in the future"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : (initialData ? 'Update CAPA' : 'Create CAPA')}
          </button>
        </div>
      </form>
    </div>
  );
}