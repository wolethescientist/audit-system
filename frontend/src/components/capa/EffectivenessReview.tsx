'use client';

import React, { useState, useRef } from 'react';
import { EffectivenessReviewUpdate } from '@/lib/types';

interface EffectivenessReviewProps {
  capaId: string;
  initialData?: {
    verification_method?: string;
    verification_evidence?: string;
    effectiveness_confirmed?: boolean;
    effectiveness_notes?: string;
    actual_cost?: number;
  };
  onSubmit: (data: EffectivenessReviewUpdate) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

const VERIFICATION_METHODS = [
  { 
    value: 'document_review', 
    label: 'Document Review', 
    description: 'Review of updated procedures, policies, or work instructions' 
  },
  { 
    value: 'audit_verification', 
    label: 'Audit Verification', 
    description: 'Follow-up audit to verify implementation and effectiveness' 
  },
  { 
    value: 'performance_monitoring', 
    label: 'Performance Monitoring', 
    description: 'Monitoring of KPIs and metrics to confirm improvement' 
  },
  { 
    value: 'observation', 
    label: 'Direct Observation', 
    description: 'On-site observation of processes and practices' 
  },
  { 
    value: 'testing', 
    label: 'Testing and Validation', 
    description: 'Testing of controls, systems, or processes' 
  },
  { 
    value: 'interview', 
    label: 'Staff Interviews', 
    description: 'Interviews with staff to confirm understanding and implementation' 
  },
  { 
    value: 'data_analysis', 
    label: 'Data Analysis', 
    description: 'Analysis of incident data, complaints, or performance data' 
  },
  { 
    value: 'customer_feedback', 
    label: 'Customer Feedback', 
    description: 'Customer satisfaction surveys or feedback analysis' 
  }
];

export default function EffectivenessReview({
  capaId,
  initialData,
  onSubmit,
  onCancel,
  readOnly = false
}: EffectivenessReviewProps) {
  const [formData, setFormData] = useState<EffectivenessReviewUpdate>({
    verification_method: initialData?.verification_method || '',
    verification_evidence: initialData?.verification_evidence || '',
    effectiveness_confirmed: initialData?.effectiveness_confirmed || false,
    effectiveness_notes: initialData?.effectiveness_notes || '',
    actual_cost: initialData?.actual_cost
  });

  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.verification_method) {
      newErrors.verification_method = 'Verification method is required';
    }

    if (!formData.verification_evidence.trim()) {
      newErrors.verification_evidence = 'Verification evidence is required';
    }

    if (formData.actual_cost !== undefined && formData.actual_cost < 0) {
      newErrors.actual_cost = 'Actual cost cannot be negative';
    }

    // If effectiveness is not confirmed, notes should explain why
    if (!formData.effectiveness_confirmed && !formData.effectiveness_notes?.trim()) {
      newErrors.effectiveness_notes = 'Please explain why effectiveness is not confirmed';
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
      console.error('Failed to submit effectiveness review:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof EffectivenessReviewUpdate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEvidenceFiles(prev => [...prev, ...files]);
    
    // Add file names to evidence description
    const fileNames = files.map(f => f.name).join(', ');
    const currentEvidence = formData.verification_evidence;
    const newEvidence = currentEvidence 
      ? `${currentEvidence}\n\nAttached files: ${fileNames}`
      : `Attached files: ${fileNames}`;
    
    handleInputChange('verification_evidence', newEvidence);
  };

  const removeFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const selectedMethod = VERIFICATION_METHODS.find(m => m.value === formData.verification_method);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Effectiveness Review</h2>
        <div className="text-sm text-gray-500">
          ISO 9001 Clause 10.2.1(d) - Review effectiveness of corrective action
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">ISO 9001 Effectiveness Review Requirements</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Verify that corrective actions have been implemented as planned</li>
          <li>• Confirm that the actions have eliminated the root cause</li>
          <li>• Ensure that similar nonconformities have not recurred</li>
          <li>• Validate that the actions are sustainable and effective</li>
          <li>• Document objective evidence of effectiveness</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Verification Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Method <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.verification_method}
            onChange={(e) => handleInputChange('verification_method', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.verification_method ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={readOnly}
          >
            <option value="">Select verification method</option>
            {VERIFICATION_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
          {errors.verification_method && (
            <p className="mt-1 text-sm text-red-600">{errors.verification_method}</p>
          )}
          
          {/* Method Description */}
          {selectedMethod && (
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">{selectedMethod.description}</p>
            </div>
          )}
        </div>

        {/* Verification Evidence */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Evidence <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.verification_evidence}
            onChange={(e) => handleInputChange('verification_evidence', e.target.value)}
            rows={6}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.verification_evidence ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe the objective evidence that demonstrates the effectiveness of the corrective action. Include specific details such as:
- What was verified and how
- Results of verification activities
- Data or metrics that support effectiveness
- Observations made during verification
- Any supporting documentation or records"
            readOnly={readOnly}
          />
          {errors.verification_evidence && (
            <p className="mt-1 text-sm text-red-600">{errors.verification_evidence}</p>
          )}
        </div>

        {/* Evidence File Upload */}
        {!readOnly && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supporting Evidence Files
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
              />
              <div className="text-center">
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Upload evidence files
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, Word, Excel, Images (Max 10MB each)
                </p>
              </div>
            </div>

            {/* Uploaded Files List */}
            {evidenceFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {evidenceFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actual Cost */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Actual Cost (Optional)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.actual_cost || ''}
            onChange={(e) => handleInputChange('actual_cost', parseFloat(e.target.value) || undefined)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.actual_cost ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter actual cost incurred for implementation"
            readOnly={readOnly}
          />
          {errors.actual_cost && (
            <p className="mt-1 text-sm text-red-600">{errors.actual_cost}</p>
          )}
        </div>

        {/* Effectiveness Confirmation */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="effectiveness_confirmed"
              checked={formData.effectiveness_confirmed}
              onChange={(e) => handleInputChange('effectiveness_confirmed', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={readOnly}
            />
            <label htmlFor="effectiveness_confirmed" className="text-sm font-medium text-gray-700">
              I confirm that the corrective action has been effective in eliminating the root cause and preventing recurrence
            </label>
          </div>

          {/* Effectiveness Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Effectiveness Review Notes
              {!formData.effectiveness_confirmed && <span className="text-red-500"> *</span>}
            </label>
            <textarea
              value={formData.effectiveness_notes || ''}
              onChange={(e) => handleInputChange('effectiveness_notes', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.effectiveness_notes ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={
                formData.effectiveness_confirmed
                  ? "Provide additional notes about the effectiveness review, lessons learned, or recommendations for future improvements"
                  : "Explain why the corrective action is not considered effective and what additional actions are required"
              }
              readOnly={readOnly}
            />
            {errors.effectiveness_notes && (
              <p className="mt-1 text-sm text-red-600">{errors.effectiveness_notes}</p>
            )}
          </div>
        </div>

        {/* Effectiveness Criteria Checklist */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Effectiveness Review Checklist</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" disabled={readOnly} />
              <span className="text-gray-700">Root cause has been eliminated</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" disabled={readOnly} />
              <span className="text-gray-700">Similar nonconformities have not recurred</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" disabled={readOnly} />
              <span className="text-gray-700">Corrective actions are sustainable</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" disabled={readOnly} />
              <span className="text-gray-700">Process improvements are measurable</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" disabled={readOnly} />
              <span className="text-gray-700">Staff are trained on new procedures</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" disabled={readOnly} />
              <span className="text-gray-700">Documentation has been updated</span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        {!readOnly && (
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
              className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                formData.effectiveness_confirmed
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {loading ? 'Saving...' : (formData.effectiveness_confirmed ? 'Confirm Effectiveness & Close CAPA' : 'Save Review')}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}