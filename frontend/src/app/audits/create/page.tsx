'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function CreateAuditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    year: new Date().getFullYear(),
    scope: '',
    risk_rating: 'medium',
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(false);

    try {
      const response = await api.post('/audits/', formData);
      router.push(`/audits/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create audit:', error);
      alert('Failed to create audit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Create New Audit</h1>
      
      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">Audit Title</label>
            <input
              type="text"
              className="input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Year</label>
            <input
              type="number"
              className="input"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              required
            />
          </div>

          <div>
            <label className="label">Scope</label>
            <textarea
              className="input"
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              rows={4}
            />
          </div>

          <div>
            <label className="label">Risk Rating</label>
            <select
              className="input"
              value={formData.risk_rating}
              onChange={(e) => setFormData({ ...formData, risk_rating: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Audit'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
