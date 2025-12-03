'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
  info: '#6b7280',
};

const STATUS_COLORS = {
  planned: '#3b82f6',
  executing: '#f59e0b',
  reporting: '#8b5cf6',
  closed: '#10b981',
};

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

  const findingsData = findingsSummary?.findings_by_severity?.map((item: any) => ({
    name: item.severity.charAt(0).toUpperCase() + item.severity.slice(1),
    value: item.count,
    color: SEVERITY_COLORS[item.severity as keyof typeof SEVERITY_COLORS] || '#6b7280',
  })) || [];

  const auditsData = auditCompletion?.audits_by_status?.map((item: any) => ({
    name: item.status.replace('_', ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    value: item.count,
    color: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || '#6b7280',
  })) || [];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Findings Bar Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Findings by Severity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={findingsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Count">
                {findingsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Findings Pie Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Findings Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={findingsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {findingsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Audits Bar Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Audits by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={auditsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Count">
                {auditsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Audits Pie Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Audits Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={auditsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {auditsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
