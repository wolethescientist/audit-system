'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Audit } from '@/lib/types';
import { useParams } from 'next/navigation';
import AuditNavigation from '@/components/audit/AuditNavigation';

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

  return (
    <div className="p-8">
      <AuditNavigation auditId={auditId} audit={audit} />

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
