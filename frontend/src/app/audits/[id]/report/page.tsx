'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Audit } from '@/lib/types';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ReportPage() {
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
    { name: 'Queries', href: `/audits/${auditId}/queries` },
    { name: 'Report', href: `/audits/${auditId}/report`, active: true },
    { name: 'Follow-up', href: `/audits/${auditId}/followup` },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/audits" className="text-primary-600 hover:underline mb-2 inline-block">
          ← Back to Audits
        </Link>
        <h1 className="text-3xl font-bold">{audit?.title || 'Loading...'}</h1>
        <p className="text-gray-600 mt-2">Audit ID: {audit?.audit_id}</p>
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
          <h2 className="text-xl font-semibold">Audit Report</h2>
          <div className="space-x-2">
            <button className="btn-secondary">Preview</button>
            <button className="btn-primary">Generate Report</button>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Executive Summary</h3>
            <textarea 
              className="w-full border rounded-lg p-3 min-h-[100px]"
              placeholder="Enter executive summary..."
            />
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Scope and Objectives</h3>
            <textarea 
              className="w-full border rounded-lg p-3 min-h-[100px]"
              placeholder="Enter scope and objectives..."
            />
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Methodology</h3>
            <textarea 
              className="w-full border rounded-lg p-3 min-h-[100px]"
              placeholder="Enter methodology..."
            />
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Conclusion</h3>
            <textarea 
              className="w-full border rounded-lg p-3 min-h-[100px]"
              placeholder="Enter conclusion..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
