'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Audit } from '@/lib/types';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function WorkProgramPage() {
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
    { name: 'Work Program', href: `/audits/${auditId}/work-program`, active: true },
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
        <h2 className="text-xl font-semibold mb-4">Work Program</h2>
        <p className="text-gray-600 mb-4">Define audit procedures and testing steps</p>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Sample Work Program Items</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Review procurement policies and procedures</li>
              <li>Test sample of purchase orders for compliance</li>
              <li>Verify authorization levels</li>
              <li>Examine vendor selection process</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
