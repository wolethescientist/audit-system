'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CAPASummary } from '@/lib/types';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface CAPATrackerProps {
  className?: string;
}

interface FilterState {
  status: 'all' | 'open' | 'overdue' | 'due_soon';
  type: 'all' | 'corrective' | 'preventive';
}

export function CAPATracker({ className = '' }: CAPATrackerProps) {
  const [filter, setFilter] = useState<FilterState>({
    status: 'all',
    type: 'all'
  });

  const { data: capaData, isLoading, error } = useQuery<CAPASummary>({
    queryKey: ['capa-summary'],
    queryFn: async () => {
      const response = await api.get('/dashboard/capa-summary');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">CAPA Tracker</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-600 font-medium">Failed to load CAPA data</p>
          </div>
        </div>
      </div>
    );
  }

  if (!capaData) return null;

  // Prepare data for charts
  const statusData = [
    { name: 'Open', value: capaData.open_capa, color: '#f59e0b' },
    { name: 'In Progress', value: capaData.in_progress_capa, color: '#3b82f6' },
    { name: 'Pending Verification', value: capaData.pending_verification_capa, color: '#8b5cf6' },
    { name: 'Closed', value: capaData.closed_capa, color: '#10b981' }
  ];

  const typeData = [
    { name: 'Corrective', value: capaData.corrective_capa, color: '#ef4444' },
    { name: 'Preventive', value: capaData.preventive_capa, color: '#06b6d4' }
  ];

  const alertData = [
    { name: 'Overdue', value: capaData.overdue_capa, color: '#dc2626', urgent: true },
    { name: 'Due Soon', value: capaData.due_soon_capa, color: '#f59e0b', urgent: true },
    { name: 'On Track', value: capaData.total_capa - capaData.overdue_capa - capaData.due_soon_capa, color: '#10b981', urgent: false }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm" style={{ color: payload[0].color }}>
            Count: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">CAPA Tracker</h3>
          <p className="text-sm text-gray-500">Corrective and Preventive Actions Management</p>
        </div>
        
        {/* Filter Controls */}
        <div className="flex items-center space-x-3">
          <select 
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value as any }))}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="overdue">Overdue</option>
            <option value="due_soon">Due Soon</option>
          </select>
          
          <select 
            value={filter.type}
            onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as any }))}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="corrective">Corrective</option>
            <option value="preventive">Preventive</option>
          </select>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg mr-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-900">{capaData.overdue_capa}</p>
              <p className="text-sm font-medium text-red-700">Overdue CAPA</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg mr-3">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-900">{capaData.due_soon_capa}</p>
              <p className="text-sm font-medium text-yellow-700">Due Soon (7 days)</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{capaData.effectiveness_confirmed}</p>
              <p className="text-sm font-medium text-blue-700">Effectiveness Confirmed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status Distribution */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">Status Distribution</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center text-xs">
                <div 
                  className="w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-gray-600">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Type Distribution */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">Type Distribution</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="border-t border-gray-200 pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{capaData.total_capa}</p>
            <p className="text-sm text-gray-600">Total CAPA</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{capaData.avg_completion_days.toFixed(1)}</p>
            <p className="text-sm text-gray-600">Avg. Days to Close</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {capaData.total_capa > 0 ? ((capaData.closed_capa / capaData.total_capa) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-gray-600">Completion Rate</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{capaData.pending_effectiveness_review}</p>
            <p className="text-sm text-gray-600">Pending Review</p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600 font-medium">Overall CAPA Progress</span>
          <span className="text-gray-900 font-medium">
            {capaData.total_capa > 0 ? ((capaData.closed_capa / capaData.total_capa) * 100).toFixed(1) : 0}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ 
              width: `${capaData.total_capa > 0 ? (capaData.closed_capa / capaData.total_capa) * 100 : 0}%` 
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}