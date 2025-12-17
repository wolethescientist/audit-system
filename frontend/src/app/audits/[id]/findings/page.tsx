'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Audit, AuditFinding, FindingSeverity } from '@/lib/types';
import { useParams } from 'next/navigation';
import AuditNavigation from '@/components/audit/AuditNavigation';

export default function FindingsPage() {
  const params = useParams();
  const auditId = params.id as string;
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    severity: FindingSeverity.MEDIUM,
    impact: '',
    root_cause: '',
    recommendation: '',
    response_from_auditee: '',
  });

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

  const createFinding = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post(`/audits/${auditId}/findings`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings', auditId] });
      setShowModal(false);
      setFormData({
        title: '',
        severity: FindingSeverity.MEDIUM,
        impact: '',
        root_cause: '',
        recommendation: '',
        response_from_auditee: '',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFinding.mutate(formData);
  };

  return (
    <div className="p-8">
      <AuditNavigation auditId={auditId} audit={audit} />

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Findings</h2>
          <button className="btn-primary" onClick={() => setShowModal(true)}>Add Finding</button>
        </div>
        
        {findings && findings.length > 0 ? (
          <div className="space-y-4">
            {findings.map((finding) => (
              <div key={finding.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{finding.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    finding.severity === FindingSeverity.HIGH || finding.severity === FindingSeverity.CRITICAL ? 'bg-red-100 text-red-800' :
                    finding.severity === FindingSeverity.MEDIUM ? 'bg-yellow-100 text-yellow-800' :
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

      {/* Add Finding Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add Finding</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Severity *</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as FindingSeverity })}
                >
                  <option value={FindingSeverity.LOW}>Low</option>
                  <option value={FindingSeverity.MEDIUM}>Medium</option>
                  <option value={FindingSeverity.HIGH}>High</option>
                  <option value={FindingSeverity.CRITICAL}>Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Impact</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  value={formData.impact}
                  onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Root Cause</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  value={formData.root_cause}
                  onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Recommendation</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  value={formData.recommendation}
                  onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Response from Auditee</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  value={formData.response_from_auditee}
                  onChange={(e) => setFormData({ ...formData, response_from_auditee: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createFinding.isPending}
                  className="flex-1 btn-primary"
                >
                  {createFinding.isPending ? 'Saving...' : 'Save Finding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
