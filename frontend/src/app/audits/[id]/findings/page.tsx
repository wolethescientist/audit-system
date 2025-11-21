'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Audit, AuditFinding } from '@/lib/types';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function FindingsPage() {
  const params = useParams();
  const auditId = params.id as string;

  const { data: audit } = useQuery<Audit>({
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

  const tabs = [
    { name: 'Overview', href: `/audits/${auditId}` },
    { name: 'Work Program', href: `/audits/${auditId}/work-program` },
    { name: 'Evidence', href: `/audits/${auditId}/evidence` },
    { name: 'Findings', href: `/audits/${auditId}/findings`, active: true },
    { name: 'Queries', href: `/audits/${auditId}/queries` },
    { name: 'Report', href: `/audits/${auditId}/report` },
    { name: 'Follow-up', href: `/audits/${auditId}/followup` },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/audits" className="text-primary-600 hover:underline mb-2 inline-block">
          ← Back to Audits
        </Link>
        <h1 className="text-3xl font-bold">{audit?.title || 'Loading...'}</h1>
        <p className="text-gray-600 mt-2">Audit ID: {audit?.id}</p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`px-4 py-2 border-b-2 whitespace-nowrap ${
                tab.active
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent hover:border-primary-600'
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Findings</h2>
          <button className="btn-primary">Add Finding</button>
        </div>
        
        {findings && findings.length > 0 ? (
          <div className="space-y-4">
            {findings.map((finding) => (
              <div key={finding.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{finding.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    finding.severity === 'high' ? 'bg-red-100 text-red-800' :
                    finding.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {finding.severity}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  {finding.impact && <p><strong>Impact:</strong> {finding.impact}</p>}
                  {finding.root_cause && <p><strong>Root Cause:</strong> {finding.root_cause}</p>}
                  {finding.recommendation && <p><strong>Recommendation:</strong> {finding.recommendation}</p>}
                  {finding.response_from_auditee && <p><strong>Response:</strong> {finding.response_from_auditee}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No findings yet</p>
        )}
      </div>
    </div>
  );
}
