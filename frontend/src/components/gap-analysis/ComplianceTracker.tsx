'use client';

import React, { useState, useEffect } from 'react';
import { GapAnalysis, ISOFramework, Department, ComplianceReportResponse } from '@/lib/types';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface ComplianceTrackerProps {
  selectedFrameworks?: string[];
  selectedDepartments?: string[];
  onGapSelect?: (gap: GapAnalysis) => void;
}

const ComplianceTracker: React.FC<ComplianceTrackerProps> = ({
  selectedFrameworks = [],
  selectedDepartments = [],
  onGapSelect
}) => {
  const [gaps, setGaps] = useState<GapAnalysis[]>([]);
  const [frameworks, setFrameworks] = useState<ISOFramework[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [complianceReport, setComplianceReport] = useState<ComplianceReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedFrameworkFilter, setSelectedFrameworkFilter] = useState<string>('');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('');
  const [showClosedGaps, setShowClosedGaps] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchGaps();
  }, [selectedFrameworkFilter, selectedDepartmentFilter, selectedStatusFilter, selectedSeverityFilter]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [frameworksRes, departmentsRes] = await Promise.all([
        api.get('/api/v1/gap-analysis/frameworks'),
        api.get('/api/v1/departments')
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
      setDepartments(departmentsRes.data);
      
      // Generate initial compliance report
      await generateComplianceReport();
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      setError('Failed to load compliance tracking data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGaps = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedFrameworkFilter) params.append('framework_id', selectedFrameworkFilter);
      if (selectedDepartmentFilter) params.append('department_id', selectedDepartmentFilter);
      if (selectedStatusFilter) params.append('gap_status', selectedStatusFilter);
      if (selectedSeverityFilter) params.append('gap_severity', selectedSeverityFilter);
      params.append('limit', '100');

      const response = await api.get(`/api/v1/gap-analysis?${params.toString()}`);
      setGaps(response.data);
    } catch (error) {
      console.error('Failed to fetch gaps:', error);
      setError('Failed to load gap analysis data');
    }
  };

  const generateComplianceReport = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedFrameworks.length > 0) {
        params.append('framework_ids', selectedFrameworks.join(','));
      }
      if (selectedDepartments.length > 0) {
        params.append('department_ids', selectedDepartments.join(','));
      }
      params.append('include_closed_gaps', showClosedGaps.toString());
      params.append('group_by', 'framework');

      const response = await api.get(`/api/v1/gap-analysis/reports?${params.toString()}`);
      setComplianceReport(response.data);
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      setError('Failed to generate compliance report');
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredGaps = gaps.filter(gap => {
    if (!showClosedGaps && gap.gap_status === 'closed') return false;
    return true;
  });

  if (isLoading && !complianceReport) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Compliance Tracker</h2>
        <p className="text-gray-600">
          Track compliance status across multiple ISO frameworks and monitor gap remediation progress.
        </p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <div className="text-red-800">{error}</div>
        </Alert>
      )}

      {/* Compliance Overview */}
      {complianceReport && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Compliance Overview</h3>
            <Button
              onClick={generateComplianceReport}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Refresh Report
            </Button>
          </div>

          {/* Overall Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800">Overall Compliance</h4>
              <p className={`text-2xl font-bold ${getComplianceColor(complianceReport.overall_compliance_score)}`}>
                {complianceReport.overall_compliance_score.toFixed(1)}%
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-red-800">Total Gaps</h4>
              <p className="text-2xl font-bold text-red-900">
                {complianceReport.gap_statistics.total_gaps}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-orange-800">Critical Gaps</h4>
              <p className="text-2xl font-bold text-orange-900">
                {complianceReport.gap_statistics.critical_gaps}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-800">Closed Gaps</h4>
              <p className="text-2xl font-bold text-green-900">
                {complianceReport.gap_statistics.closed_gaps}
              </p>
            </div>
          </div>

          {/* Framework Breakdown */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Framework Compliance</h4>
            <div className="space-y-4">
              {complianceReport.frameworks_analyzed.map((framework) => (
                <div key={framework.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h5 className="font-medium text-gray-900">{framework.name} v{framework.version}</h5>
                      <p className="text-sm text-gray-600">
                        {framework.total_gaps} gaps • {framework.critical_gaps} critical
                      </p>
                    </div>
                    <Badge className={getComplianceColor(framework.average_compliance) + ' bg-white'}>
                      {framework.average_compliance.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress 
                    value={framework.average_compliance} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Department Breakdown */}
          {complianceReport.department_breakdown.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Department Compliance</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {complianceReport.department_breakdown.map((dept) => (
                  <div key={dept.department_id} className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">{dept.department_name}</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Compliance:</span>
                        <span className={`font-medium ${getComplianceColor(dept.average_compliance)}`}>
                          {dept.average_compliance.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Gaps:</span>
                        <span className="font-medium">{dept.total_gaps}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Critical:</span>
                        <span className="font-medium text-red-600">{dept.critical_gaps}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trend Analysis */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Trend Analysis (Last 30 Days)</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">New Gaps:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {complianceReport.trend_analysis.gaps_created_last_30_days}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Closed Gaps:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {complianceReport.trend_analysis.gaps_closed_last_30_days}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Trend:</span>
                  <Badge className={
                    complianceReport.trend_analysis.trend_direction === 'improving' 
                      ? 'text-green-600 bg-green-100'
                      : 'text-yellow-600 bg-yellow-100'
                  }>
                    {complianceReport.trend_analysis.trend_direction}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {complianceReport.recommendations.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Recommendations</h4>
              <div className="space-y-2">
                {complianceReport.recommendations.map((recommendation, index) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Filters */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Gaps</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Framework</label>
            <select
              value={selectedFrameworkFilter}
              onChange={(e) => setSelectedFrameworkFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Frameworks</option>
              {frameworks.map(framework => (
                <option key={framework.id} value={framework.id}>
                  {framework.name} v{framework.version}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={selectedDepartmentFilter}
              onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="identified">Identified</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
              <option value="not_applicable">Not Applicable</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
              value={selectedSeverityFilter}
              onChange={(e) => setSelectedSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="showClosedGaps"
            checked={showClosedGaps}
            onChange={(e) => setShowClosedGaps(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="showClosedGaps" className="ml-2 text-sm text-gray-700">
            Include closed gaps
          </label>
        </div>
      </Card>

      {/* Gap List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Gap Analysis Items ({filteredGaps.length})
          </h3>
        </div>

        {filteredGaps.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No gaps found matching the current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGaps.map((gap) => (
              <div
                key={gap.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onGapSelect && onGapSelect(gap)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getSeverityColor(gap.gap_severity)}>
                        {gap.gap_severity.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(gap.gap_status)}>
                        {gap.gap_status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-600">{gap.requirement_clause}</span>
                    </div>
                    
                    <h4 className="font-medium text-gray-900 mb-1">{gap.requirement_title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{gap.gap_description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Compliance: {gap.compliance_percentage}%</span>
                      {gap.target_closure_date && (
                        <span>Target: {formatDate(gap.target_closure_date)}</span>
                      )}
                      <span>Created: {formatDate(gap.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getComplianceColor(gap.compliance_percentage)}`}>
                        {gap.compliance_percentage}%
                      </div>
                      <Progress 
                        value={gap.compliance_percentage} 
                        className="w-20 h-2 mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ComplianceTracker;