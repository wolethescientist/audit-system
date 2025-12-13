'use client';

import React, { useState, useEffect } from 'react';
import { ISOFramework, FrameworkComparisonRequest, FrameworkComparisonResponse } from '@/lib/types';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';

interface GapAnalysisProps {
  onFrameworkSelect?: (frameworkId: string) => void;
  onComparisonComplete?: (results: FrameworkComparisonResponse) => void;
}

const GapAnalysis: React.FC<GapAnalysisProps> = ({
  onFrameworkSelect,
  onComparisonComplete
}) => {
  const [frameworks, setFrameworks] = useState<Array<ISOFramework & { gap_statistics: any }>>([]);
  const [selectedPrimaryFramework, setSelectedPrimaryFramework] = useState<string>('');
  const [selectedComparisonFrameworks, setSelectedComparisonFrameworks] = useState<string[]>([]);
  const [comparisonResults, setComparisonResults] = useState<FrameworkComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFrameworks();
  }, []);

  const fetchFrameworks = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/v1/gap-analysis/frameworks');
      setFrameworks(response.data);
    } catch (error) {
      console.error('Failed to fetch frameworks:', error);
      setError('Failed to load ISO frameworks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFrameworkSelection = (frameworkId: string, isComparison: boolean = false) => {
    if (isComparison) {
      setSelectedComparisonFrameworks(prev => {
        if (prev.includes(frameworkId)) {
          return prev.filter(id => id !== frameworkId);
        } else {
          return [...prev, frameworkId];
        }
      });
    } else {
      setSelectedPrimaryFramework(frameworkId);
      if (onFrameworkSelect) {
        onFrameworkSelect(frameworkId);
      }
    }
  };

  const performComparison = async () => {
    if (!selectedPrimaryFramework || selectedComparisonFrameworks.length === 0) {
      setError('Please select a primary framework and at least one comparison framework');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const comparisonRequest: FrameworkComparisonRequest = {
        primary_framework_id: selectedPrimaryFramework,
        comparison_framework_ids: selectedComparisonFrameworks,
        include_compliance_data: true
      };

      const response = await api.post('/api/v1/gap-analysis/frameworks/compare', comparisonRequest);
      setComparisonResults(response.data);
      
      if (onComparisonComplete) {
        onComparisonComplete(response.data);
      }
    } catch (error) {
      console.error('Failed to perform framework comparison:', error);
      setError('Failed to perform framework comparison');
    } finally {
      setIsLoading(false);
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
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

  if (isLoading && frameworks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ISO frameworks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gap Analysis & Framework Comparison</h2>
        <p className="text-gray-600">
          Compare ISO frameworks to identify overlapping requirements and compliance gaps across multiple standards.
        </p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <div className="text-red-800">{error}</div>
        </Alert>
      )}

      {/* Framework Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Frameworks for Comparison</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Primary Framework Selection */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Primary Framework</h4>
            <div className="space-y-3">
              {frameworks.map((framework) => (
                <div
                  key={framework.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPrimaryFramework === framework.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleFrameworkSelection(framework.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">{framework.name}</h5>
                      <p className="text-sm text-gray-600">Version {framework.version}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={getComplianceColor(framework.gap_statistics.average_compliance)}>
                        {framework.gap_statistics.average_compliance.toFixed(1)}% Compliant
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {framework.gap_statistics.total_gaps} gaps identified
                      </p>
                    </div>
                  </div>
                  
                  {framework.description && (
                    <p className="text-sm text-gray-600 mt-2">{framework.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-3 text-sm">
                    <span className="text-gray-600">
                      Total Clauses: {framework.gap_statistics.total_clauses || 0}
                    </span>
                    <span className="text-red-600">
                      Open Gaps: {framework.gap_statistics.open_gaps}
                    </span>
                    <span className="text-green-600">
                      Closed Gaps: {framework.gap_statistics.closed_gaps}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Frameworks Selection */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">
              Comparison Frameworks ({selectedComparisonFrameworks.length} selected)
            </h4>
            <div className="space-y-3">
              {frameworks
                .filter(f => f.id !== selectedPrimaryFramework)
                .map((framework) => (
                <div
                  key={framework.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedComparisonFrameworks.includes(framework.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleFrameworkSelection(framework.id, true)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">{framework.name}</h5>
                      <p className="text-sm text-gray-600">Version {framework.version}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={getComplianceColor(framework.gap_statistics.average_compliance)}>
                        {framework.gap_statistics.average_compliance.toFixed(1)}% Compliant
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {framework.gap_statistics.total_gaps} gaps identified
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-3 text-sm">
                    <span className="text-gray-600">
                      Total Clauses: {framework.gap_statistics.total_clauses || 0}
                    </span>
                    <span className="text-red-600">
                      Open Gaps: {framework.gap_statistics.open_gaps}
                    </span>
                    <span className="text-green-600">
                      Closed Gaps: {framework.gap_statistics.closed_gaps}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comparison Action */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={performComparison}
            disabled={!selectedPrimaryFramework || selectedComparisonFrameworks.length === 0 || isLoading}
            className="px-8 py-2"
          >
            {isLoading ? 'Comparing...' : 'Compare Frameworks'}
          </Button>
        </div>
      </Card>

      {/* Comparison Results */}
      {comparisonResults && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparison Results</h3>
          
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800">Frameworks Compared</h4>
              <p className="text-2xl font-bold text-blue-900">
                {comparisonResults.gap_summary.frameworks_compared}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-red-800">Total Gaps</h4>
              <p className="text-2xl font-bold text-red-900">
                {comparisonResults.gap_summary.total_gaps_across_frameworks}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-orange-800">Critical Gaps</h4>
              <p className="text-2xl font-bold text-orange-900">
                {comparisonResults.gap_summary.critical_gaps}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-800">Comparison Date</h4>
              <p className="text-sm font-medium text-green-900">
                {new Date(comparisonResults.gap_summary.comparison_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Primary Framework Details */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Primary Framework</h4>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-blue-900">
                    {comparisonResults.primary_framework.name} v{comparisonResults.primary_framework.version}
                  </h5>
                  <p className="text-sm text-blue-700">
                    {comparisonResults.primary_framework.total_clauses} total clauses
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
              </div>
            </div>
          </div>

          {/* Comparison Frameworks */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Comparison Frameworks</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comparisonResults.comparison_frameworks.map((framework) => (
                <div key={framework.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">
                      {framework.name} v{framework.version}
                    </h5>
                    <Badge className={getComplianceColor(framework.compliance_score)}>
                      {framework.compliance_score.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Clauses:</span>
                      <span className="ml-2 font-medium">{framework.total_clauses}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Gaps:</span>
                      <span className="ml-2 font-medium text-red-600">{framework.gap_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Comparison */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Compliance Comparison</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Framework
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overall Compliance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Requirements
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gaps Identified
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Critical Gaps
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(comparisonResults.compliance_comparison).map(([frameworkName, data]) => (
                    <tr key={frameworkName}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {frameworkName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getComplianceColor(data.overall_compliance)}>
                          {data.overall_compliance.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.total_requirements}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {data.gaps_identified}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-800 font-medium">
                        {data.critical_gaps}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Recommendations</h4>
            <div className="space-y-3">
              {comparisonResults.recommendations.map((recommendation, index) => (
                <div key={index} className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-start">
                    <Badge className={getSeverityColor(recommendation.priority)}>
                      {recommendation.priority.toUpperCase()}
                    </Badge>
                    <div className="ml-3">
                      <h5 className="font-medium text-gray-900">{recommendation.type.replace('_', ' ').toUpperCase()}</h5>
                      <p className="text-sm text-gray-700 mt-1">{recommendation.description}</p>
                      <p className="text-sm text-blue-700 mt-2 font-medium">
                        Action: {recommendation.action}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default GapAnalysis;