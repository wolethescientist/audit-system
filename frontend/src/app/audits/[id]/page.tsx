'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Audit, AuditFinding } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AuditNavigation from '@/components/audit/AuditNavigation';

export default function AuditDetailPage() {
  const params = useParams();
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

  return (
    <div className="p-8">
      <AuditNavigation auditId={auditId} audit={audit} />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

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
