'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Audit, AuditFinding } from '@/lib/types';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

// ISO 19011 Audit Workflow Stages
const WORKFLOW_STAGES = [
  { key: 'PLANNED', label: 'Planned', order: 0 },
  { key: 'INITIATED', label: 'Initiated', order: 1 },
  { key: 'PREPARATION', label: 'Preparation', order: 2 },
  { key: 'EXECUTING', label: 'Executing', order: 3 },
  { key: 'REPORTING', label: 'Reporting', order: 4 },
  { key: 'FOLLOWUP', label: 'Follow-up', order: 5 },
  { key: 'CLOSED', label: 'Closed', order: 6 },
];

function getStageOrder(status: string): number {
  const stage = WORKFLOW_STAGES.find(s => s.key === status?.toUpperCase());
  return stage?.order ?? 0;
}

export default function AuditDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const auditId = params.id as string;
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: audit, refetch: refetchAudit } = useQuery<Audit>({
    queryKey: ['audit', auditId],
    queryFn: async () => {
      const response = await api.get(`/audits/${auditId}`);
      return response.data;
    },
  });

  const { data: findings } = useQuery<AuditFinding[]>({
    queryKey: ['findings', auditId],
    queryFn: async () => {
      const response = await api.get(`/audits/${auditId}/findings`);
      return response.data;
    },
  });

  // Status transition handlers
  const handleStartExecution = async () => {
    setTransitioning(true);
    setError(null);
    try {
      await api.post(`/audits/${auditId}/transition/start-execution`);
      await refetchAudit();
      queryClient.invalidateQueries({ queryKey: ['audit', auditId] });
      router.push(`/audits/${auditId}/execute`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start execution');
    } finally {
      setTransitioning(false);
    }
  };

  const handleStartReporting = async () => {
    setTransitioning(true);
    setError(null);
    try {
      await api.post(`/audits/${auditId}/transition/start-reporting`);
      await refetchAudit();
      queryClient.invalidateQueries({ queryKey: ['audit', auditId] });
      router.push(`/audits/${auditId}/report`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start reporting');
    } finally {
      setTransitioning(false);
    }
  };

  const handleStartFollowup = async () => {
    setTransitioning(true);
    setError(null);
    try {
      await api.post(`/audits/${auditId}/transition/start-followup`);
      await refetchAudit();
      queryClient.invalidateQueries({ queryKey: ['audit', auditId] });
      router.push(`/audits/${auditId}/followup`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start follow-up');
    } finally {
      setTransitioning(false);
    }
  };

  const handleCloseAudit = async () => {
    setTransitioning(true);
    setError(null);
    try {
      await api.post(`/audits/${auditId}/transition/close`);
      await refetchAudit();
      queryClient.invalidateQueries({ queryKey: ['audit', auditId] });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to close audit');
    } finally {
      setTransitioning(false);
    }
  };

  const currentStageOrder = getStageOrder(audit?.status || 'PLANNED');

  // ISO 19011 Workflow Tabs - shown based on audit status progression
  const workflowTabs = [
    { name: 'Overview', href: `/audits/${auditId}`, alwaysShow: true },
    { name: 'Initiate', href: `/audits/${auditId}/initiate`, minStage: 0, description: 'Define objectives & scope' },
    { name: 'Team', href: `/audits/${auditId}/team`, minStage: 0, description: 'Assign audit team' },
    { name: 'Prepare', href: `/audits/${auditId}/prepare`, minStage: 1, description: 'Create checklists & plan' },
    { name: 'Execute', href: `/audits/${auditId}/execute`, minStage: 2, description: 'Conduct audit activities' },
    { name: 'Work Program', href: `/audits/${auditId}/work-program`, minStage: 2 },
    { name: 'Evidence', href: `/audits/${auditId}/evidence`, minStage: 2 },
    { name: 'Findings', href: `/audits/${auditId}/findings`, minStage: 3 },
    { name: 'Queries', href: `/audits/${auditId}/queries`, minStage: 2 },
    { name: 'Report', href: `/audits/${auditId}/report`, minStage: 3 },
    { name: 'Follow-up', href: `/audits/${auditId}/followup`, minStage: 4 },
  ];

  const isActiveTab = (href: string) => pathname === href;

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/audits" className="text-primary-600 hover:underline mb-2 inline-block">
          ← Back to Audits
        </Link>
        <h1 className="text-3xl font-bold">{audit?.title || 'Loading...'}</h1>
        <p className="text-gray-600 mt-2">{audit?.scope}</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* ISO 19011 Workflow Progress */}
      <div className="card mb-6">
        <h3 className="text-sm font-medium text-gray-600 mb-3">ISO 19011 Audit Workflow Progress</h3>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {WORKFLOW_STAGES.map((stage, index) => {
            const isCompleted = currentStageOrder > stage.order;
            const isCurrent = currentStageOrder === stage.order;
            return (
              <div key={stage.key} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
                  isCompleted ? 'bg-green-100 text-green-800' :
                  isCurrent ? 'bg-blue-100 text-blue-800 font-medium' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {isCompleted && <span>✓</span>}
                  {isCurrent && <span>●</span>}
                  {stage.label}
                </div>
                {index < WORKFLOW_STAGES.length - 1 && (
                  <div className={`w-4 h-0.5 mx-1 ${isCompleted ? 'bg-green-400' : 'bg-gray-300'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {workflowTabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`px-4 py-2 border-b-2 whitespace-nowrap text-sm transition-colors ${
                isActiveTab(tab.href)
                  ? 'border-primary-600 text-primary-600 font-medium'
                  : 'border-transparent hover:border-gray-300 text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Next Action Card - Guide user through workflow */}
          {audit?.status === 'PLANNED' && (
            <div className="card bg-blue-50 border-blue-200">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">🚀 Get Started</h2>
              <p className="text-blue-800 mb-4">
                This audit is in the planning stage. Start by initiating the audit to define objectives, scope, and criteria.
              </p>
              <Link 
                href={`/audits/${auditId}/initiate`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Initiation →
              </Link>
            </div>
          )}

          {audit?.status === 'INITIATED' && (
            <div className="card bg-blue-50 border-blue-200">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">📋 Next: Preparation</h2>
              <p className="text-blue-800 mb-4">
                Audit has been initiated. Now prepare the audit plan, checklists, and document requests.
              </p>
              <Link 
                href={`/audits/${auditId}/prepare`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Preparation →
              </Link>
            </div>
          )}

          {audit?.status === 'PREPARATION' && (
            <div className="card bg-blue-50 border-blue-200">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">🔍 Next: Execution</h2>
              <p className="text-blue-800 mb-4">
                Preparation complete. Begin executing the audit - collect evidence, conduct interviews, and document findings.
              </p>
              <button 
                onClick={handleStartExecution}
                disabled={transitioning}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {transitioning ? 'Starting...' : 'Start Execution →'}
              </button>
            </div>
          )}

          {audit?.status === 'EXECUTING' && (
            <div className="card bg-yellow-50 border-yellow-200">
              <h2 className="text-lg font-semibold text-yellow-900 mb-2">📝 Next: Reporting</h2>
              <p className="text-yellow-800 mb-4">
                Execution in progress. Once evidence collection is complete, proceed to generate the audit report.
              </p>
              <button 
                onClick={handleStartReporting}
                disabled={transitioning}
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                {transitioning ? 'Starting...' : 'Start Reporting →'}
              </button>
            </div>
          )}

          {audit?.status === 'REPORTING' && (
            <div className="card bg-purple-50 border-purple-200">
              <h2 className="text-lg font-semibold text-purple-900 mb-2">🔄 Next: Follow-up</h2>
              <p className="text-purple-800 mb-4">
                Report generated. Proceed to follow-up phase to track corrective actions and verify implementation.
              </p>
              <button 
                onClick={handleStartFollowup}
                disabled={transitioning}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {transitioning ? 'Starting...' : 'Start Follow-up →'}
              </button>
            </div>
          )}

          {audit?.status === 'FOLLOWUP' && (
            <div className="card bg-green-50 border-green-200">
              <h2 className="text-lg font-semibold text-green-900 mb-2">✅ Close Audit</h2>
              <p className="text-green-800 mb-4">
                Follow-up activities complete. Close the audit to finalize all records.
              </p>
              <button 
                onClick={handleCloseAudit}
                disabled={transitioning}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {transitioning ? 'Closing...' : 'Close Audit →'}
              </button>
            </div>
          )}

          {/* Findings Card */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Findings</h2>
            {findings && findings.length > 0 ? (
              <div className="space-y-4">
                {findings.map((finding: any) => (
                  <div key={finding.id} className="border-l-4 border-red-500 pl-4">
                    <h3 className="font-semibold">{finding.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{finding.impact}</p>
                    <span className="text-xs text-red-600 font-medium">{finding.severity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No findings yet</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Details Card */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Year:</span>
                <span className="ml-2 font-medium">{audit?.year}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`ml-2 font-medium px-2 py-1 rounded text-xs ${
                  audit?.status === 'CLOSED' ? 'bg-green-100 text-green-800' :
                  audit?.status === 'EXECUTING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {audit?.status}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Risk Rating:</span>
                <span className="ml-2 font-medium">{audit?.risk_rating || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link 
                href={`/audits/${auditId}/initiate`}
                className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm"
              >
                📝 Edit Initiation Details
              </Link>
              <Link 
                href={`/audits/${auditId}/team`}
                className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm"
              >
                👥 Manage Audit Team
              </Link>
              <Link 
                href={`/audits/${auditId}/evidence`}
                className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm"
              >
                📎 Upload Evidence
              </Link>
              <Link 
                href={`/audits/${auditId}/findings`}
                className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm"
              >
                🔍 Add Finding
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
