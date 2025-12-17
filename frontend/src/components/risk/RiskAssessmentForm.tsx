'use client';

import React, { useState, useEffect } from 'react';
import { RiskAssessmentCreate, ISO31000Scale, User, Asset, Audit } from '@/lib/types';
import { api } from '@/lib/api';

interface RiskAssessmentFormProps {
  auditId?: string;
  assetId?: string;
  onSubmit: (data: RiskAssessmentCreate) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const RiskAssessmentForm: React.FC<RiskAssessmentFormProps> = ({
  auditId,
  assetId,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<RiskAssessmentCreate>({
    audit_id: auditId,
    asset_id: assetId,
    risk_title: '',
    description: '',
    likelihood_score: 1,
    impact_score: 1,
    threat_source: '',
    vulnerability: '',
    existing_controls: '',
    mitigation_plan: '',
    risk_owner_id: '',
    next_review_date: ''
  });

  const [scales, setScales] = useState<{
    likelihood_scale: Record<number, ISO31000Scale>;
    impact_scale: Record<number, ISO31000Scale>;
  } | null>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);

  useEffect(() => {
    fetchScales();
    fetchUsers();
    fetchAssets();
    fetchAudits();
  }, []);

  const fetchScales = async () => {
    try {
      const response = await api.get('/api/v1/risks/scales/iso-compliant');
      setScales(response.data);
    } catch (error) {
      console.error('Failed to fetch ISO scales:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await api.get('/api/v1/assets');
      setAssets(response.data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    }
  };

  const fetchAudits = async () => {
    try {
      const response = await api.get('/audits');
      setAudits(response.data);
    } catch (error) {
      console.error('Failed to fetch audits:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('score') ? parseInt(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const calculateRiskRating = () => {
    return formData.likelihood_score * formData.impact_score;
  };

  const getRiskCategory = (rating: number) => {
    if (rating <= 4) return { category: 'LOW', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (rating <= 9) return { category: 'MEDIUM', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (rating <= 16) return { category: 'HIGH', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { category: 'CRITICAL', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const riskRating = calculateRiskRating();
  const riskCategory = getRiskCategory(riskRating);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Risk Assessment Form</h2>
        <p className="text-gray-600">ISO 31000 & ISO 27005 Compliant Risk Assessment</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="audit_id" className="block text-sm font-medium text-gray-700 mb-2">
              Related Audit
            </label>
            <select
              id="audit_id"
              name="audit_id"
              value={formData.audit_id || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an audit (optional)</option>
              {audits.map(audit => (
                <option key={audit.id} value={audit.id}>
                  {audit.title} ({audit.year})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="asset_id" className="block text-sm font-medium text-gray-700 mb-2">
              Related Asset
            </label>
            <select
              id="asset_id"
              name="asset_id"
              value={formData.asset_id || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an asset (optional)</option>
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.asset_name} ({asset.asset_category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Risk Title */}
        <div>
          <label htmlFor="risk_title" className="block text-sm font-medium text-gray-700 mb-2">
            Risk Title *
          </label>
          <input
            type="text"
            id="risk_title"
            name="risk_title"
            value={formData.risk_title}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a clear, concise risk title"
          />
        </div>

        {/* Risk Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Risk Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Detailed description of the risk scenario"
          />
        </div>

        {/* ISO 31000 Risk Analysis */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ISO 31000 Risk Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Likelihood Score */}
            <div>
              <label htmlFor="likelihood_score" className="block text-sm font-medium text-gray-700 mb-2">
                Likelihood Score (1-5) *
              </label>
              <select
                id="likelihood_score"
                name="likelihood_score"
                value={formData.likelihood_score}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {scales && Object.entries(scales.likelihood_scale).map(([score, scale]) => (
                  <option key={score} value={score}>
                    {score} - {scale.name} ({scale.probability})
                  </option>
                ))}
              </select>
              {scales && (
                <p className="text-sm text-gray-600 mt-1">
                  {scales.likelihood_scale[formData.likelihood_score]?.description}
                </p>
              )}
            </div>

            {/* Impact Score */}
            <div>
              <label htmlFor="impact_score" className="block text-sm font-medium text-gray-700 mb-2">
                Impact Score (1-5) *
              </label>
              <select
                id="impact_score"
                name="impact_score"
                value={formData.impact_score}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {scales && Object.entries(scales.impact_scale).map(([score, scale]) => (
                  <option key={score} value={score}>
                    {score} - {scale.name} ({scale.financial})
                  </option>
                ))}
              </select>
              {scales && (
                <p className="text-sm text-gray-600 mt-1">
                  {scales.impact_scale[formData.impact_score]?.description}
                </p>
              )}
            </div>
          </div>

          {/* Risk Rating Display */}
          <div className="mt-4 p-4 bg-white rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">Risk Rating:</span>
                <span className="ml-2 text-lg font-bold">{riskRating}</span>
                <span className="text-sm text-gray-600 ml-1">
                  ({formData.likelihood_score} × {formData.impact_score})
                </span>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${riskCategory.color} ${riskCategory.bgColor}`}>
                {riskCategory.category}
              </div>
            </div>
          </div>
        </div>

        {/* Risk Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="threat_source" className="block text-sm font-medium text-gray-700 mb-2">
              Threat Source
            </label>
            <input
              type="text"
              id="threat_source"
              name="threat_source"
              value={formData.threat_source}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Human error, Cyber attack, Natural disaster"
            />
          </div>

          <div>
            <label htmlFor="risk_owner_id" className="block text-sm font-medium text-gray-700 mb-2">
              Risk Owner
            </label>
            <select
              id="risk_owner_id"
              name="risk_owner_id"
              value={formData.risk_owner_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select risk owner</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vulnerability */}
        <div>
          <label htmlFor="vulnerability" className="block text-sm font-medium text-gray-700 mb-2">
            Vulnerability
          </label>
          <textarea
            id="vulnerability"
            name="vulnerability"
            value={formData.vulnerability}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the vulnerability that could be exploited"
          />
        </div>

        {/* Existing Controls */}
        <div>
          <label htmlFor="existing_controls" className="block text-sm font-medium text-gray-700 mb-2">
            Existing Controls
          </label>
          <textarea
            id="existing_controls"
            name="existing_controls"
            value={formData.existing_controls}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe current controls in place"
          />
        </div>

        {/* Mitigation Plan */}
        <div>
          <label htmlFor="mitigation_plan" className="block text-sm font-medium text-gray-700 mb-2">
            Mitigation Plan
          </label>
          <textarea
            id="mitigation_plan"
            name="mitigation_plan"
            value={formData.mitigation_plan}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Proposed actions to mitigate the risk"
          />
        </div>

        {/* Next Review Date */}
        <div>
          <label htmlFor="next_review_date" className="block text-sm font-medium text-gray-700 mb-2">
            Next Review Date
          </label>
          <input
            type="date"
            id="next_review_date"
            name="next_review_date"
            value={formData.next_review_date}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Risk Assessment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RiskAssessmentForm;