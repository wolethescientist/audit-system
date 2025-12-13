'use client';

import React, { useState, useEffect } from 'react';
import { ComplianceReportResponse, AutoGapGenerationResponse, ISOFramework } from '@/lib/types';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface ComplianceDashboardProps {
  auditId?: string;
  onGapGenerated?: (response: AutoGapGenerationResponse) => void;
  onReportGenerated?: (response: ComplianceReportResponse) => void;
}

const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({
  auditId,
  onGapGenerated,
  onReportGenerated
}) => {
  const [complianceData, setComplianceData] = useState<ComplianceReportResponse | null>(null);
  const [frameworks, setFrameworks] = useState<ISOFramework[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto Gap Generation
  const [showGapGeneration, setShowGapGeneration] = useState(false);
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
  const [gapGenerationSettings, setGapGenerationSettings] = useState({
    include_audit_findings: true,
    include_checklist_data: true,
    minimum_compliance_threshold: 80,
    severity_filter: [] as string[]
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [frameworksRes, complianceRes] = await Promise.all([
        api.get('/api/v1/gap-analysis/frameworks'),
        api.get('/api/v1/gap-analysis/reports')
      ]);
      
      setFrameworks(frameworksRes.data.map((f: any) => ({
        id: f.id,
        name: f.name,
        version: f.version,
        description: f.description,
        is_active: true,
        created_at: f.created_at,
        updated_at: f.updated_at
      })));
      setComplianceData(complianceRes.data);
      
      if (onReportGenerated) {
        onReportGenerated(complianceRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      setError('Failed to load compliance dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateGapAnalysis = async () => {
    if (!auditId || selectedFrameworks.length === 0) {
      setError('Please select at least one framework and ensure an audit is selected');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const request = {
        framework_ids: selectedFrameworks,
        ...gapGenerationSettings
      };

      const response = await api.post(`/api/v1/gap-analysis/${auditId}/generate`, request);
      
      setSuccess(`Generated ${response.data.total_gaps_identified} gaps across ${response.data.framework_gaps.length} frameworks`);
      setShowGapGeneration(false);
      
      // Refresh compliance data
      await fetchInitialData();
      
      if (onGapGenerated) {
        onGapGenerated(response.data);
      }
    } catch (error) {
      console.error('Failed to generate gap analysis:', error);
      setError('Failed to generate automated gap analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshComplianceReport = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/v1/gap-analysis/reports');
      setComplianceData(response.data);
      
      if (onReportGenerated) {
        onReportGenerated(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh compliance report:', error);
      setError('Failed to refresh compliance report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFrameworkSelection = (frameworkId: string, selected: boolean) => {
    if (selected) {
      setSelectedFrameworks(prev => [...prev, frameworkId]);
    } else {
      setSelectedFrameworks(prev => prev.filter(id => id !== frameworkId));
    }
  };

  const handleSeverityFilterChange = (severity: string, selected: boolean) => {
    setGapGenerationSettings(prev => ({
      ...prev,
      severity_filter: selected 
        ? [...prev.severity_filter, severity]
        : prev.severity_filter.filter(s => s !== severity)
    }));
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getComplianceBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    if (score >= 50) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600 bg-green-100';
      case 'declining': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  if (isLoading && !complianceData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading compliance dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Compliance Dashboard</h2>
            <p className="text-gray-600">
              Comprehensive view of compliance status with progress visualization and automated gap analysis.
            </p>
          </div>
          <div className="flex space-x-2">
            {auditId && (
              <Button
                onClick={() => setShowGapGeneration(true)}
                variant="outline"
              >
                Generate Gaps
              </Button>
            )}
            <Button
              onClick={refreshComplianceReport}
              disabled={isLoading}
            >
              Refresh Data
            </Button>
          </div>
        </div>
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

      {/* Overall Compliance Metrics */}
      {complianceData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${getComplianceBgColor(complianceData.overall_compliance_score)}`}>
                  <svg className="w-6 h-6 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overall Compliance</p>
                  <p className={`text-2xl font-bold ${getComplianceColor(complianceData.overall_compliance_score)}`}>
                    {complianceData.overall_compliance_score.toFixed(1)}%
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Gaps</p>
                  <p className="text-2xl font-bold text-red-600">
                    {complianceData.gap_statistics.total_gaps}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Critical Gaps</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {complianceData.gap_statistics.critical_gaps}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Closed Gaps</p>
                  <p className="text-2xl font-bold text-green-600">
                    {complianceData.gap_statistics.closed_gaps}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Framework Compliance Breakdown */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Framework Compliance Status</h3>
            <div className="space-y-4">
              {complianceData.frameworks_analyzed.map((framework) => (
                <div key={framework.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{framework.name} v{framework.version}</h4>
                      <p className="text-sm text-gray-600">
                        {framework.total_gaps} total gaps • {framework.critical_gaps} critical • {framework.high_gaps} high
                      </p>
                    </div>
                    <Badge className={`${getComplianceColor(framework.average_compliance)} bg-white border`}>
                      {framework.average_compliance.toFixed(1)}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Compliance Progress</span>
                      <span className={getComplianceColor(framework.average_compliance)}>
                        {framework.average_compliance.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={framework.average_compliance} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div className="text-center">
                      <p className="text-red-600 font-medium">{framework.critical_gaps}</p>
                      <p className="text-gray-600">Critical</p>
                    </div>
                    <div className="text-center">
                      <p className="text-orange-600 font-medium">{framework.high_gaps}</p>
                      <p className="text-gray-600">High</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600 font-medium">{framework.total_gaps - framework.critical_gaps - framework.high_gaps}</p>
                      <p className="text-gray-600">Medium/Low</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Gap Statistics Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gap Status Distribution</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Open Gaps</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${(complianceData.gap_statistics.open_gaps / complianceData.gap_statistics.total_gaps) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-red-600">
                      {complianceData.gap_statistics.open_gaps}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full" 
                        style={{ width: `${(complianceData.gap_statistics.in_progress_gaps / complianceData.gap_statistics.total_gaps) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-yellow-600">
                      {complianceData.gap_statistics.in_progress_gaps}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Closed</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(complianceData.gap_statistics.closed_gaps / complianceData.gap_statistics.total_gaps) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      {complianceData.gap_statistics.closed_gaps}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Severity Distribution</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Critical</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${(complianceData.gap_statistics.critical_gaps / complianceData.gap_statistics.total_gaps) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-red-600">
                      {complianceData.gap_statistics.critical_gaps}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">High</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-orange-600 h-2 rounded-full" 
                        style={{ width: `${(complianceData.gap_statistics.high_gaps / complianceData.gap_statistics.total_gaps) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-orange-600">
                      {complianceData.gap_statistics.high_gaps}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Medium</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full" 
                        style={{ width: `${(complianceData.gap_statistics.medium_gaps / complianceData.gap_statistics.total_gaps) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-yellow-600">
                      {complianceData.gap_statistics.medium_gaps}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Low</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(complianceData.gap_statistics.low_gaps / complianceData.gap_statistics.total_gaps) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      {complianceData.gap_statistics.low_gaps}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Trend Analysis */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Analysis (Last 30 Days)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {complianceData.trend_analysis.gaps_created_last_30_days}
                </div>
                <p className="text-sm text-gray-600">New Gaps Created</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {complianceData.trend_analysis.gaps_closed_last_30_days}
                </div>
                <p className="text-sm text-gray-600">Gaps Closed</p>
              </div>
              <div className="text-center">
                <Badge className={getTrendColor(complianceData.trend_analysis.trend_direction)}>
                  {complianceData.trend_analysis.trend_direction.toUpperCase()}
                </Badge>
                <p className="text-sm text-gray-600 mt-1">Overall Trend</p>
              </div>
            </div>
          </Card>

          {/* Department Breakdown */}
          {complianceData.department_breakdown.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Compliance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Compliance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Gaps
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Critical Gaps
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {complianceData.department_breakdown.map((dept) => (
                      <tr key={dept.department_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {dept.department_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`${getComplianceColor(dept.average_compliance)} bg-white border`}>
                            {dept.average_compliance.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dept.total_gaps}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                          {dept.critical_gaps}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Gap Generation Form */}
      {showGapGeneration && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Generate Automated Gap Analysis</h3>
            <Button
              onClick={() => setShowGapGeneration(false)}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Frameworks for Analysis
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {frameworks.map((framework) => (
                  <div key={framework.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`framework-${framework.id}`}
                      checked={selectedFrameworks.includes(framework.id)}
                      onChange={(e) => handleFrameworkSelection(framework.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`framework-${framework.id}`} className="ml-2 text-sm text-gray-700">
                      {framework.name} v{framework.version}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Compliance Threshold (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gapGenerationSettings.minimum_compliance_threshold}
                  onChange={(e) => setGapGenerationSettings(prev => ({
                    ...prev,
                    minimum_compliance_threshold: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity Filter
                </label>
                <div className="flex space-x-4">
                  {['critical', 'high', 'medium', 'low'].map((severity) => (
                    <div key={severity} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`severity-${severity}`}
                        checked={gapGenerationSettings.severity_filter.includes(severity)}
                        onChange={(e) => handleSeverityFilterChange(severity, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`severity-${severity}`} className="ml-1 text-sm text-gray-700 capitalize">
                        {severity}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="include_audit_findings"
                  checked={gapGenerationSettings.include_audit_findings}
                  onChange={(e) => setGapGenerationSettings(prev => ({
                    ...prev,
                    include_audit_findings: e.target.checked
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="include_audit_findings" className="ml-2 text-sm text-gray-700">
                  Include audit findings
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="include_checklist_data"
                  checked={gapGenerationSettings.include_checklist_data}
                  onChange={(e) => setGapGenerationSettings(prev => ({
                    ...prev,
                    include_checklist_data: e.target.checked
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="include_checklist_data" className="ml-2 text-sm text-gray-700">
                  Include checklist data
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                onClick={() => setShowGapGeneration(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={generateGapAnalysis}
                disabled={isLoading || selectedFrameworks.length === 0}
              >
                {isLoading ? 'Generating...' : 'Generate Gap Analysis'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ComplianceDashboard;