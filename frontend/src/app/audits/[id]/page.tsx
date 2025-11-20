'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Audit, AuditFinding } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
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
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mb-6">
          <Link href="/audits" className="text-primary-600 hover:underline mb-2 inline-block">
            ← Back to Audits
          </Link>
          <h1 className="text-3xl font-bold">{audit?.title}</h1>
          <p className="text-gray-600 mt-1">Year: {audit?.year}</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Audit Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-600">Status</dt>
                <dd className="font-medium">{audit?.status}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Risk Rating</dt>
                <dd className="font-medium">{audit?.risk_rating || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Scope</dt>
                <dd className="text-sm">{audit?.scope || 'No scope defined'}</dd>
              </div>
            </dl>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Findings Summary</h2>
            <p className="text-3xl font-bold">{findings?.length || 0}</p>
            <p className="text-gray-600 text-sm mt-1">Total findings</p>
          </div>
        </div>
      </div>
    </div>
  );
}
