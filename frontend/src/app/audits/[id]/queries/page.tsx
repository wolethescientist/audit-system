'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Audit } from '@/lib/types';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function QueriesPage() {
  const params = useParams();
  const auditId = params.id as string;

  const { data: audit } = useQuery<Audit>({
    queryKey: ['audit', auditId],
    queryFn: async () => {
      const response = await api.get(`/audits/${auditId}`);
      return response.data;
    },
  });

  const tabs = [
    { name: 'Overview', href: `/audits/${auditId}` },
    { name: 'Work Program', href: `/audits/${auditId}/work-program` },
    { name: 'Evidence', href: `/audits/${auditId}/evidence` },
    { name: 'Findings', href: `/audits/${auditId}/findings` },
    { name: 'Queries', href: `/audits/${auditId}/queries`, active: true },
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
          <h2 className="text-xl font-semibold">Queries</h2>
          <button className="btn-primary">New Query</button>
        </div>
        <p className="text-gray-600 mb-4">Track questions and responses from auditees</p>
        
        <div className="text-center py-8 text-gray-500">
          <p>No queries yet</p>
        </div>
      </div>
    </div>
  );
}
