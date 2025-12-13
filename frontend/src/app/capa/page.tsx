'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CAPAItem, CAPACreate, RootCauseAnalysisUpdate, EffectivenessReviewUpdate } from '@/lib/types';
import CAPAForm from '@/components/capa/CAPAForm';
import CAPATracker from '@/components/capa/CAPATracker';
import RootCauseAnalysis from '@/components/capa/RootCauseAnalysis';
import EffectivenessReview from '@/components/capa/EffectivenessReview';

type ViewMode = 'list' | 'create' | 'edit' | 'root-cause' | 'effectiveness';

interface ViewState {
  mode: ViewMode;
  selectedCAPAId?: string;
  selectedCAPA?: CAPAItem;
}

export default function CAPAManagementPage() {
  const [viewState, setViewState] = useState<ViewState>({ mode: 'list' });
  const queryClient = useQueryClient();

  // Fetch CAPA detail when needed
  const { data: capaDetail } = useQuery({
    queryKey: ['capa-detail', viewState.selectedCAPAId],
    queryFn: async () => {
      if (!viewState.selectedCAPAId) return null;
      const response = await api.get(`/api/v1/capa/${viewState.selectedCAPAId}`);
      return response.data;
    },
    enabled: !!viewState.selectedCAPAId && ['edit', 'root-cause', 'effectiveness'].includes(viewState.mode)
  });

  // Create CAPA mutation
  const createCAPAMutation = useMutation({
    mutationFn: async (data: CAPACreate) => {
      const response = await api.post('/api/v1/capa/create', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capa'] });
      setViewState({ mode: 'list' });
    }
  });

  // Update CAPA mutation
  const updateCAPAMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/api/v1/capa/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capa'] });
      setViewState({ mode: 'list' });
    }
  });

  // Root cause analysis mutation
  const rootCauseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RootCauseAnalysisUpdate }) => {
      const response = await api.put(`/api/v1/capa/${id}/root-cause`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capa'] });
      queryClient.invalidateQueries({ queryKey: ['capa-detail', viewState.selectedCAPAId] });
      setViewState({ mode: 'list' });
    }
  });

  // Effectiveness review mutation
  const effectivenessMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EffectivenessReviewUpdate }) => {
      const response = await api.put(`/api/v1/capa/${id}/verify`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capa'] });
      queryClient.invalidateQueries({ queryKey: ['capa-detail', viewState.selectedCAPAId] });
      setViewState({ mode: 'list' });
    }
  });

  const handleCAPAClick = (capaId: string) => {
    setViewState({ mode: 'edit', selectedCAPAId: capaId });
  };

  const handleCreateCAPA = async (data: CAPACreate) => {
    await createCAPAMutation.mutateAsync(data);
  };

  const handleUpdateCAPA = async (data: any) => {
    if (!viewState.selectedCAPAId) return;
    await updateCAPAMutation.mutateAsync({ id: viewState.selectedCAPAId, data });
  };

  const handleRootCauseAnalysis = async (data: RootCauseAnalysisUpdate) => {
    if (!viewState.selectedCAPAId) return;
    await rootCauseMutation.mutateAsync({ id: viewState.selectedCAPAId, data });
  };

  const handleEffectivenessReview = async (data: EffectivenessReviewUpdate) => {
    if (!viewState.selectedCAPAId) return;
    await effectivenessMutation.mutateAsync({ id: viewState.selectedCAPAId, data });
  };

  const renderContent = () => {
    switch (viewState.mode) {
      case 'create':
        return (
          <CAPAForm
            onSubmit={handleCreateCAPA}
            onCancel={() => setViewState({ mode: 'list' })}
          />
        );

      case 'edit':
        if (!capaDetail) return <div>Loading...</div>;
        return (
          <div className="space-y-6">
            <CAPAForm
              onSubmit={handleUpdateCAPA}
              onCancel={() => setViewState({ mode: 'list' })}
              initialData={capaDetail}
            />
            
            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setViewState({ mode: 'root-cause', selectedCAPAId: viewState.selectedCAPAId })}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
              >
                Root Cause Analysis
              </button>
              <button
                onClick={() => setViewState({ mode: 'effectiveness', selectedCAPAId: viewState.selectedCAPAId })}
                className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100"
              >
                Effectiveness Review
              </button>
            </div>
          </div>
        );

      case 'root-cause':
        if (!capaDetail) return <div>Loading...</div>;
        return (
          <RootCauseAnalysis
            capaId={viewState.selectedCAPAId!}
            initialData={capaDetail}
            onSubmit={handleRootCauseAnalysis}
            onCancel={() => setViewState({ mode: 'edit', selectedCAPAId: viewState.selectedCAPAId })}
          />
        );

      case 'effectiveness':
        if (!capaDetail) return <div>Loading...</div>;
        return (
          <EffectivenessReview
            capaId={viewState.selectedCAPAId!}
            initialData={capaDetail}
            onSubmit={handleEffectivenessReview}
            onCancel={() => setViewState({ mode: 'edit', selectedCAPAId: viewState.selectedCAPAId })}
          />
        );

      default:
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">CAPA Management</h1>
                <p className="text-gray-600 mt-2">
                  Corrective and Preventive Actions - ISO 9001 Clause 10.2 Compliance
                </p>
              </div>
              <button
                onClick={() => setViewState({ mode: 'create' })}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create New CAPA
              </button>
            </div>

            {/* CAPA Tracker */}
            <CAPATracker
              onCAPAClick={handleCAPAClick}
              showFilters={true}
              maxItems={100}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div>
                <button
                  onClick={() => setViewState({ mode: 'list' })}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="flex-shrink-0 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0L3.586 10l4.707-4.707a1 1 0 011.414 1.414L6.414 10l3.293 3.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="sr-only">Home</span>
                </button>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <button
                  onClick={() => setViewState({ mode: 'list' })}
                  className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  CAPA Management
                </button>
              </div>
            </li>
            {viewState.mode !== 'list' && (
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500 capitalize">
                    {viewState.mode === 'root-cause' ? 'Root Cause Analysis' : 
                     viewState.mode === 'effectiveness' ? 'Effectiveness Review' : 
                     viewState.mode}
                  </span>
                </div>
              </li>
            )}
          </ol>
        </nav>

        {/* Main Content */}
        {renderContent()}
      </div>
    </div>
  );
}