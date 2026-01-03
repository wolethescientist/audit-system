'use client';

import React, { useState, useEffect } from 'react';
import { RiskAssessment, RiskAssessmentCreate } from '@/lib/types';
import { api } from '@/lib/api';
import RiskAssessmentForm from '@/components/risk/RiskAssessmentForm';
import RiskMatrix from '@/components/risk/RiskMatrix';
import ControlSuggestionComponent from '@/components/risk/ControlSuggestion';
import RiskLinking from '@/components/risk/RiskLinking';

const RisksPage: React.FC = () => {
  const [risks, setRisks] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<RiskAssessment | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'matrix' | 'create' | 'details'>('list');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchRisks();
  }, []);

  const fetchRisks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/risks/');
      setRisks(response.data);
    } catch (error) {
      console.error('Failed to fetch risks:', error);
      setError('Failed to load risk assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRisk = async (riskData: RiskAssessmentCreate) => {
    try {
      setCreating(true);
      const response = await api.post('/api/v1/risks/assess', riskData);
      const newRisk = response.data;
      
      setRisks(prev => [newRisk, ...prev]);
      setActiveTab('list');
      
      // Optionally select the newly created risk
      setSelectedRisk(newRisk);
    } catch (error) {
      console.error('Failed to create risk assessment:', error);
      setError('Failed to create risk assessment');
    } finally {
      setCreating(false);
    }
  };

  const handleRiskClick = async (riskId: string) => {
    try {
      const response = await api.get(`/api/v1/risks/${riskId}`);
      setSelectedRisk(response.data);
      setActiveTab('details');
    } catch (error) {
      console.error('Failed to fetch risk details:', error);
      setError('Failed to load risk details');
    }
  };

  const getRiskCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && activeTab === 'list') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading risk assessments...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Risk Assessment Management</h1>
        <p className="text-gray-600">ISO 31000 & ISO 27005 Compliant Risk Management System</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Risk List
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'matrix'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Risk Matrix
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Create Risk
          </button>
          {selectedRisk && (
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Risk Details
            </button>
          )}
        </nav>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Risk Assessments</h2>
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create New Risk
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {risks.map((risk) => (
                  <tr key={risk.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{risk.risk_title}</div>
                      {risk.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {risk.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRiskCategoryColor(risk.risk_category)}`}>
                        {risk.risk_category.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">{risk.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(risk.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleRiskClick(risk.id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {risks.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No risk assessments</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new risk assessment.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setActiveTab('create')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create Risk Assessment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'matrix' && (
        <RiskMatrix onRiskClick={handleRiskClick} />
      )}

      {activeTab === 'create' && (
        <RiskAssessmentForm
          onSubmit={handleCreateRisk}
          onCancel={() => setActiveTab('list')}
          isLoading={creating}
        />
      )}

      {activeTab === 'details' && selectedRisk && (
        <div className="space-y-6">
          {/* Risk Details Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedRisk.risk_title}</h2>
                <p className="text-gray-600 mb-4">{selectedRisk.description}</p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-2">Risk Rating:</span>
                    <span className="text-lg font-bold">{selectedRisk.risk_rating}</span>
                    <span className="text-sm text-gray-600 ml-1">
                      ({selectedRisk.likelihood_score} × {selectedRisk.impact_score})
                    </span>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getRiskCategoryColor(selectedRisk.risk_category)}`}>
                    {selectedRisk.risk_category.toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('list')}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Control Suggestions */}
          <ControlSuggestionComponent
            riskId={selectedRisk.id}
            onControlAdded={() => {
              // Optionally refresh risk data or show success message
            }}
          />

          {/* Risk Linking */}
          <RiskLinking
            riskId={selectedRisk.id}
            onLinkingComplete={(linkedEntities) => {
              // Optionally show success message or refresh data
              console.log('Linked entities:', linkedEntities);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default RisksPage;