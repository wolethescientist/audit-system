'use client';

import React, { useState, useEffect } from 'react';
import { CAPAItem, CAPAStatus, CAPAProgress, User } from '@/lib/types';
import { api } from '@/lib/api';

interface CAPATrackerProps {
  auditId?: string;
  assignedUserId?: string;
  departmentId?: string;
  showFilters?: boolean;
  maxItems?: number;
  onCAPAClick?: (capaId: string) => void;
}

interface FilterState {
  status: CAPAStatus | 'all';
  priority: string;
  overdue_only: boolean;
  search: string;
}

export default function CAPATracker({
  auditId,
  assignedUserId,
  departmentId,
  showFilters = true,
  maxItems = 50,
  onCAPAClick
}: CAPATrackerProps) {
  const [capaItems, setCAPAItems] = useState<CAPAItem[]>([]);
  const [progressData, setProgressData] = useState<Record<string, CAPAProgress>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    priority: 'all',
    overdue_only: false,
    search: ''
  });

  useEffect(() => {
    loadCAPAItems();
    loadUsers();
  }, [auditId, assignedUserId, departmentId, filters]);

  const loadCAPAItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (auditId) params.append('audit_id', auditId);
      if (assignedUserId) params.append('assigned_to_id', assignedUserId);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.overdue_only) params.append('overdue_only', 'true');
      params.append('limit', maxItems.toString());

      const response = await api.get(`/api/v1/capa?${params.toString()}`);
      const items = response.data;
      setCAPAItems(items);

      // Load progress data for each CAPA item
      const progressPromises = items.map((item: CAPAItem) =>
        api.get(`/api/v1/capa/${item.id}/progress`)
      );
      
      const progressResponses = await Promise.all(progressPromises);
      const progressMap: Record<string, CAPAProgress> = {};
      
      progressResponses.forEach((response, index) => {
        progressMap[items[index].id] = response.data;
      });
      
      setProgressData(progressMap);
    } catch (error) {
      console.error('Failed to load CAPA items:', error);
      setError('Failed to load CAPA items');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user ? user.full_name : 'Unknown User';
  };

  const getStatusColor = (status: CAPAStatus): string => {
    switch (status) {
      case CAPAStatus.OPEN:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case CAPAStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case CAPAStatus.PENDING_VERIFICATION:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case CAPAStatus.CLOSED:
        return 'bg-green-100 text-green-800 border-green-200';
      case CAPAStatus.OVERDUE:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilDue = (dueDateString?: string): { days: number; isOverdue: boolean } => {
    if (!dueDateString) return { days: 0, isOverdue: false };
    
    const dueDate = new Date(dueDateString);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      days: Math.abs(diffDays),
      isOverdue: diffDays < 0
    };
  };

  const filteredItems = capaItems.filter(item => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        item.title.toLowerCase().includes(searchLower) ||
        item.capa_number.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">CAPA Progress Tracker</h2>
            <p className="text-sm text-gray-500">
              ISO 9001 Clause 10.2 - Corrective and Preventive Actions Monitoring
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {filteredItems.length} of {capaItems.length} items
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as CAPAStatus | 'all' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value={CAPAStatus.OPEN}>Open</option>
                <option value={CAPAStatus.IN_PROGRESS}>In Progress</option>
                <option value={CAPAStatus.PENDING_VERIFICATION}>Pending Verification</option>
                <option value={CAPAStatus.CLOSED}>Closed</option>
                <option value={CAPAStatus.OVERDUE}>Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search CAPA items..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.overdue_only}
                  onChange={(e) => setFilters(prev => ({ ...prev, overdue_only: e.target.checked }))}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Overdue only</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* CAPA Items List */}
      <div className="divide-y divide-gray-200">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500">No CAPA items found</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const progress = progressData[item.id];
            const dueInfo = getDaysUntilDue(item.due_date);
            
            return (
              <div
                key={item.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${onCAPAClick ? 'cursor-pointer' : ''}`}
                onClick={() => onCAPAClick && onCAPAClick(item.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(item.priority)}`}></div>
                        <span className="text-xs text-gray-500 capitalize">{item.priority}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span className="font-mono">{item.capa_number}</span>
                      {item.assigned_to_id && (
                        <span>Assigned to: {getUserName(item.assigned_to_id)}</span>
                      )}
                      <span>Due: {formatDate(item.due_date)}</span>
                      {dueInfo.isOverdue && (
                        <span className="text-red-600 font-medium">
                          {dueInfo.days} days overdue
                        </span>
                      )}
                      {!dueInfo.isOverdue && item.due_date && (
                        <span className="text-gray-500">
                          {dueInfo.days} days remaining
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                    )}

                    {/* Progress Bar */}
                    {progress && (
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-gray-700">Progress</span>
                          <span className="text-xs text-gray-500">{progress.progress_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              progress.progress_percentage === 100 
                                ? 'bg-green-500' 
                                : progress.is_overdue 
                                  ? 'bg-red-500' 
                                  : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress.progress_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Completion Milestones */}
                    {progress && (
                      <div className="flex items-center space-x-4 text-xs">
                        <div className={`flex items-center space-x-1 ${progress.completion_milestones.root_cause_completed ? 'text-green-600' : 'text-gray-400'}`}>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Root Cause</span>
                        </div>
                        
                        <div className={`flex items-center space-x-1 ${progress.completion_milestones.actions_defined ? 'text-green-600' : 'text-gray-400'}`}>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Actions Defined</span>
                        </div>
                        
                        <div className={`flex items-center space-x-1 ${progress.completion_milestones.implementation_started ? 'text-green-600' : 'text-gray-400'}`}>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Implementation</span>
                        </div>
                        
                        <div className={`flex items-center space-x-1 ${progress.completion_milestones.verification_completed ? 'text-green-600' : 'text-gray-400'}`}>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Verification</span>
                        </div>
                        
                        <div className={`flex items-center space-x-1 ${progress.completion_milestones.effectiveness_confirmed ? 'text-green-600' : 'text-gray-400'}`}>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Effectiveness</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    {item.status === CAPAStatus.OPEN && (
                      <button className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100">
                        Start Analysis
                      </button>
                    )}
                    {item.status === CAPAStatus.IN_PROGRESS && (
                      <button className="px-3 py-1 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100">
                        Update Progress
                      </button>
                    )}
                    {item.status === CAPAStatus.PENDING_VERIFICATION && (
                      <button className="px-3 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded hover:bg-green-100">
                        Verify Effectiveness
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Footer */}
      {filteredItems.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <div className="flex space-x-6">
              <span className="text-gray-600">
                Open: <span className="font-medium text-yellow-600">
                  {filteredItems.filter(item => item.status === CAPAStatus.OPEN).length}
                </span>
              </span>
              <span className="text-gray-600">
                In Progress: <span className="font-medium text-blue-600">
                  {filteredItems.filter(item => item.status === CAPAStatus.IN_PROGRESS).length}
                </span>
              </span>
              <span className="text-gray-600">
                Overdue: <span className="font-medium text-red-600">
                  {filteredItems.filter(item => {
                    const dueInfo = getDaysUntilDue(item.due_date);
                    return dueInfo.isOverdue && item.status !== CAPAStatus.CLOSED;
                  }).length}
                </span>
              </span>
            </div>
            <button
              onClick={loadCAPAItems}
              className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}