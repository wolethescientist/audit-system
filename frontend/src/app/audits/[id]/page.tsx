'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Audit, AuditFinding } from '@/lib/types';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function AuditDetailPage() {
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

  const tabs: any[] = [
    { name: 'Overview', href: `/audits/${auditId}` },
    { name: 'Work Program', href: `/audits/${auditId}/work-program` },
    { name: 'Evidence', href: `/audits/${auditId}/evidence` },
    { name: 'Findings', href: `/audits/${auditId}/findings` },
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
        <p className="text-gray-600 mt-2">{audit?.scope}</p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className="px-4 py-2 border-b-2 border-transparent hover:border-primary-600 whitespace-nowrap"
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
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

        <div>
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Year:</span>
                <span className="ml-2 font-medium">{audit?.year}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium">{audit?.status}</span>
              </div>
              <div>
                <span className="text-gray-600">Risk Rating:</span>
                <span className="ml-2 font-medium">{audit?.risk_rating || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
