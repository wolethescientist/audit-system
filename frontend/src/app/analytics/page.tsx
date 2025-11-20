'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function AnalyticsPage() {
  const { data: findingsSummary } = useQuery({
    queryKey: ['findings-summary'],
    queryFn: async () => {
      const response = await api.get('/analytics/findings-summary');
      return response.data;
    },
  });

  const { data: auditCompletion } = useQuery({
    queryKey: ['audit-completion'],
    queryFn: async () => {
      const response = await api.get('/analytics/audit-completion');
      return response.data;
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Analytics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Findings by Severity</h2>
          <div className="space-y-3">
            {findingsSummary?.findings_by_severity?.map((item: any) => (
              <div key={item.severity} className="flex justify-between items-center">
                <span className="capitalize">{item.severity}</span>
                <span className="font-bold text-lg">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Audits by Status</h2>
          <div className="space-y-3">
            {auditCompletion?.audits_by_status?.map((item: any) => (
              <div key={item.status} className="flex justify-between items-center">
                <span className="capitalize">{item.status.replace('_', ' ')}</span>
                <span className="font-bold text-lg">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
