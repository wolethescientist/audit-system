'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Audit } from '@/lib/types';
import Link from 'next/link';

export default function AuditsPage() {
  const { data: audits, isLoading } = useQuery<Audit[]>({
    queryKey: ['audits'],
    queryFn: async () => {
      const response = await api.get('/audits/');
      return response.data;
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planned: 'bg-gray-100 text-gray-800',
      executing: 'bg-green-100 text-green-800',
      reporting: 'bg-green-200 text-green-900',
      followup: 'bg-gray-200 text-gray-900',
      closed: 'bg-green-600 text-white',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Audits</h1>
        <Link href="/audits/create" className="btn btn-primary">
          Create Audit
        </Link>
      </div>
      
      {isLoading ? (
        <div className="card">Loading audits...</div>
      ) : audits && audits.length > 0 ? (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold">Title</th>
                  <th className="text-left py-3 px-4 font-semibold">Year</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Risk Rating</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit: any) => (
                  <tr key={audit.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{audit.title}</td>
                    <td className="py-3 px-4">{audit.year}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(audit.status)}`}>
                        {audit.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{audit.risk_rating || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <Link href={`/audits/${audit.id}`} className="text-primary-600 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">No audits found</p>
          <Link href="/audits/create" className="btn btn-primary">
            Create Your First Audit
          </Link>
        </div>
      )}
    </div>
  );
}
