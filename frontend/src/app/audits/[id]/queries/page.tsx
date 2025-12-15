'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Audit } from '@/lib/types';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuditQuery {
  id: string;
  audit_id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  message: string;
  parent_query_id: string | null;
  created_at: string;
}

export default function QueriesPage() {
  const params = useParams();
  const auditId = params.id as string;
  const queryClient = useQueryClient();
  
  const [showNewQueryModal, setShowNewQueryModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<AuditQuery | null>(null);
  const [newQuery, setNewQuery] = useState({
    to_user_id: '',
    message: '',
  });
  const [replyMessage, setReplyMessage] = useState('');

  const { data: audit } = useQuery<Audit>({
    queryKey: ['audit', auditId],
    queryFn: async () => {
      const response = await api.get(`/audits/${auditId}`);
      return response.data;
    },
  });

  const { data: queries = [], isLoading: queriesLoading } = useQuery<AuditQuery[]>({
    queryKey: ['audit-queries', auditId],
    queryFn: async () => {
      const response = await api.get(`/audits/${auditId}/queries`);
      return response.data;
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users/');
      return response.data;
    },
  });

  const createQueryMutation = useMutation({
    mutationFn: async (data: { to_user_id: string; message: string; parent_query_id?: string }) => {
      const response = await api.post(`/audits/${auditId}/queries`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-queries', auditId] });
      setShowNewQueryModal(false);
      setShowReplyModal(false);
      setNewQuery({ to_user_id: '', message: '' });
      setReplyMessage('');
      setSelectedQuery(null);
    },
  });

  const handleCreateQuery = () => {
    if (!newQuery.to_user_id || !newQuery.message.trim()) return;
    createQueryMutation.mutate(newQuery);
  };

  const handleReply = () => {
    if (!selectedQuery || !replyMessage.trim()) return;
    createQueryMutation.mutate({
      to_user_id: selectedQuery.from_user_id || '',
      message: replyMessage,
      parent_query_id: selectedQuery.id,
    });
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return 'Unknown';
    const user = users.find(u => u.id === userId);
    return user?.full_name || 'Unknown User';
  };

  // Group queries by parent (main queries and their replies)
  const mainQueries = queries.filter(q => !q.parent_query_id);
  const getReplies = (queryId: string) => queries.filter(q => q.parent_query_id === queryId);

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
          <button 
            className="btn-primary"
            onClick={() => setShowNewQueryModal(true)}
          >
            New Query
          </button>
        </div>
        <p className="text-gray-600 mb-4">Track questions and responses from auditees and auditors</p>
        
        {queriesLoading ? (
          <div className="text-center py-8 text-gray-500">Loading queries...</div>
        ) : mainQueries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No queries yet</p>
            <p className="text-sm mt-2">Click "New Query" to ask a question to an auditee or team member</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mainQueries.map((query) => {
              const replies = getReplies(query.id);
              return (
                <div key={query.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium text-primary-600">{getUserName(query.from_user_id)}</span>
                      <span className="text-gray-500 mx-2">→</span>
                      <span className="font-medium">{getUserName(query.to_user_id)}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(query.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-800 mb-3">{query.message}</p>
                  
                  {/* Replies */}
                  {replies.length > 0 && (
                    <div className="ml-6 mt-3 space-y-3 border-l-2 border-primary-200 pl-4">
                      {replies.map((reply) => (
                        <div key={reply.id} className="bg-white rounded p-3">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm">{getUserName(reply.from_user_id)}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(reply.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">{reply.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <button
                    className="mt-3 text-sm text-primary-600 hover:underline"
                    onClick={() => {
                      setSelectedQuery(query);
                      setShowReplyModal(true);
                    }}
                  >
                    Reply
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Query Modal */}
      {showNewQueryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">New Query</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Send To
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={newQuery.to_user_id}
                onChange={(e) => setNewQuery({ ...newQuery, to_user_id: e.target.value })}
              >
                <option value="">Select recipient...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.role})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question / Message
              </label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 h-32"
                placeholder="Enter your question or request for information..."
                value={newQuery.message}
                onChange={(e) => setNewQuery({ ...newQuery, message: e.target.value })}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                onClick={() => {
                  setShowNewQueryModal(false);
                  setNewQuery({ to_user_id: '', message: '' });
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateQuery}
                disabled={!newQuery.to_user_id || !newQuery.message.trim() || createQueryMutation.isPending}
              >
                {createQueryMutation.isPending ? 'Sending...' : 'Send Query'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reply to Query</h3>
            
            <div className="mb-4 p-3 bg-gray-100 rounded">
              <p className="text-sm text-gray-600 mb-1">Original question from {getUserName(selectedQuery.from_user_id)}:</p>
              <p className="text-gray-800">{selectedQuery.message}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Response
              </label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 h-32"
                placeholder="Enter your response..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyMessage('');
                  setSelectedQuery(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleReply}
                disabled={!replyMessage.trim() || createQueryMutation.isPending}
              >
                {createQueryMutation.isPending ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
