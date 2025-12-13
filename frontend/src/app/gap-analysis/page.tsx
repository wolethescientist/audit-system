'use client';

import React, { useState } from 'react';
import { GapAnalysis as GapAnalysisType, ComplianceReportResponse, AutoGapGenerationResponse, CAPAItem } from '@/lib/types';
import GapAnalysis from '@/components/gap-analysis/GapAnalysis';
import ComplianceTracker from '@/components/gap-analysis/ComplianceTracker';
import GapRemediation from '@/components/gap-analysis/GapRemediation';
import ComplianceDashboard from '@/components/gap-analysis/ComplianceDashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const GapAnalysisPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analysis' | 'tracker' | 'remediation'>('dashboard');
  const [selectedGaps, setSelectedGaps] = useState<GapAnalysisType[]>([]);
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<string>('');

  const handleFrameworkSelect = (frameworkId: string) => {
    setSelectedFrameworks(prev => {
      if (prev.includes(frameworkId)) {
        return prev.filter(id => id !== frameworkId);
      } else {
        return [...prev, frameworkId];
      }
    });
  };

  const handleGapSelect = (gap: GapAnalysisType) => {
    setSelectedGaps(prev => {
      const exists = prev.find(g => g.id === gap.id);
      if (exists) {
        return prev.filter(g => g.id !== gap.id);
      } else {
        return [...prev, gap];
      }
    });
  };

  const handleGapUpdate = (updatedGap: GapAnalysisType) => {
    setSelectedGaps(prev => prev.map(gap => 
      gap.id === updatedGap.id ? updatedGap : gap
    ));
  };

  const handleCAPACreated = (capa: CAPAItem) => {
    console.log('CAPA created:', capa);
    // Optionally refresh data or show notification
  };

  const handleGapGenerated = (response: AutoGapGenerationResponse) => {
    console.log('Gap analysis generated:', response);
    // Optionally refresh data or show notification
  };

  const handleReportGenerated = (response: ComplianceReportResponse) => {
    console.log('Compliance report generated:', response);
    // Optionally handle report data
  };

  const tabs = [
    { id: 'dashboard', label: 'Compliance Dashboard', icon: '📊' },
    { id: 'analysis', label: 'Framework Analysis', icon: '🔍' },
    { id: 'tracker', label: 'Compliance Tracker', icon: '📈' },
    { id: 'remediation', label: 'Gap Remediation', icon: '🔧' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gap Analysis & Compliance Management</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive gap analysis, compliance tracking, and remediation management across multiple ISO frameworks.
          </p>
        </div>

        {/* Tab Navigation */}
        <Card className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </Card>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'dashboard' && (
            <ComplianceDashboard
              auditId={selectedAuditId}
              onGapGenerated={handleGapGenerated}
              onReportGenerated={handleReportGenerated}
            />
          )}

          {activeTab === 'analysis' && (
            <GapAnalysis
              onFrameworkSelect={handleFrameworkSelect}
              onComparisonComplete={(results) => {
                console.log('Framework comparison completed:', results);
              }}
            />
          )}

          {activeTab === 'tracker' && (
            <ComplianceTracker
              selectedFrameworks={selectedFrameworks}
              onGapSelect={handleGapSelect}
            />
          )}

          {activeTab === 'remediation' && (
            <GapRemediation
              selectedGaps={selectedGaps}
              onGapUpdate={handleGapUpdate}
              onCAPACreated={handleCAPACreated}
            />
          )}
        </div>

        {/* Selected Items Summary */}
        {(selectedGaps.length > 0 || selectedFrameworks.length > 0) && (
          <Card className="mt-6 p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                {selectedFrameworks.length > 0 && (
                  <span className="text-blue-700">
                    <strong>{selectedFrameworks.length}</strong> framework(s) selected
                  </span>
                )}
                {selectedGaps.length > 0 && (
                  <span className="text-blue-700">
                    <strong>{selectedGaps.length}</strong> gap(s) selected
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                {selectedGaps.length > 0 && (
                  <Button
                    onClick={() => setActiveTab('remediation')}
                    size="sm"
                    variant="outline"
                  >
                    Manage Selected Gaps
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setSelectedGaps([]);
                    setSelectedFrameworks([]);
                  }}
                  size="sm"
                  variant="outline"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="mt-6 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => setActiveTab('dashboard')}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <span className="text-2xl mb-1">📊</span>
              <span className="text-sm">View Dashboard</span>
            </Button>
            
            <Button
              onClick={() => setActiveTab('analysis')}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <span className="text-2xl mb-1">🔍</span>
              <span className="text-sm">Compare Frameworks</span>
            </Button>
            
            <Button
              onClick={() => setActiveTab('tracker')}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <span className="text-2xl mb-1">📈</span>
              <span className="text-sm">Track Compliance</span>
            </Button>
            
            <Button
              onClick={() => setActiveTab('remediation')}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <span className="text-2xl mb-1">🔧</span>
              <span className="text-sm">Manage Remediation</span>
            </Button>
          </div>
        </Card>

        {/* Help Section */}
        <Card className="mt-6 p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use Gap Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">1. Compliance Dashboard</h4>
              <p>Get an overview of your compliance status across all frameworks. Generate automated gap analysis from audit data and view trend analysis.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">2. Framework Analysis</h4>
              <p>Compare multiple ISO frameworks to identify overlapping requirements and optimize your compliance efforts across standards.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">3. Compliance Tracker</h4>
              <p>Monitor individual gaps across frameworks and departments. Filter by status, severity, and other criteria to focus on priority items.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">4. Gap Remediation</h4>
              <p>Manage gap closure through CAPA integration. Create corrective actions, track progress, and verify effectiveness of remediation efforts.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GapAnalysisPage;