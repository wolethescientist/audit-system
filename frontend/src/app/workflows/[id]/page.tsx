'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Workflow, WorkflowStep, WorkflowApproval, Department, User, WorkflowStatus } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function WorkflowDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const workflowId = params.id as string;

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [approvals, setApprovals] = useState<{ [key: string]: WorkflowApproval[] }>({});
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Approval modal state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [approvalAction, setApprovalAction] = useState<string>('approved');
  const [approvalComments, setApprovalComments] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasAttemptedAutoOpen = useRef(false);

  useEffect(() => {
    fetchWorkflowData();
    fetchCurrentUser();

    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(() => {
      fetchWorkflowData();
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  // Check URL parameters to auto-open action modal
  useEffect(() => {
    // Only attempt once
    if (hasAttemptedAutoOpen.current) return;
    
    // Read directly from window.location for more reliable access
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const shouldOpenAction = urlParams.get('action') === 'true';
    const stepId = urlParams.get('stepId');
    
    console.log('=== AUTO-OPEN CHECK ===');
    console.log('URL:', window.location.href);
    console.log('shouldOpenAction:', shouldOpenAction);
    console.log('stepId:', stepId);
    console.log('stepsLoaded:', steps.length);
    console.log('currentUser:', currentUser?.full_name || 'not loaded');
    console.log('loading:', loading);
    console.log('hasAttempted:', hasAttemptedAutoOpen.current);
    console.log('======================');
    
    if (shouldOpenAction && stepId && steps.length > 0 && currentUser && !loading) {
      const step = steps.find(s => s.id === stepId);
      console.log('Found step:', step);
      
      if (step) {
        const canApprove = canApproveStep(step);
        console.log('Can approve step:', canApprove);
        
        if (canApprove) {
          console.log('✅ AUTO-OPENING ACTION MODAL for step:', step.step_order);
          hasAttemptedAutoOpen.current = true;
          
          // Small delay to ensure everything is rendered
          setTimeout(() => {
            openApprovalModal(step);
            // Clean up URL after opening modal
            window.history.replaceState({}, '', `/workflows/${workflowId}`);
          }, 300);
        } else {
          // User can't approve, mark as attempted so we don't keep trying
          hasAttemptedAutoOpen.current = true;
          console.log('❌ User cannot approve this step');
        }
      } else {
        console.log('❌ Step not found with ID:', stepId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, currentUser, loading]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/validate`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchWorkflowData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [workflowRes, stepsRes, deptsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/workflows/${workflowId}`, { headers }),
        axios.get(`${API_URL}/workflows/${workflowId}/steps`, { headers }),
        axios.get(`${API_URL}/departments/`, { headers }),
        axios.get(`${API_URL}/users/`, { headers }),
      ]);

      setWorkflow(workflowRes.data);
      setSteps(stepsRes.data);
      setDepartments(deptsRes.data);
      setUsers(usersRes.data);

      // Fetch approvals for each step
      const approvalsData: { [key: string]: WorkflowApproval[] } = {};
      for (const step of stepsRes.data) {
        const approvalsRes = await axios.get(
          `${API_URL}/workflows/${workflowId}/steps/${step.id}/approvals`,
          { headers }
        );
        approvalsData[step.id] = approvalsRes.data;
      }
      setApprovals(approvalsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching workflow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startWorkflow = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/workflows/${workflowId}/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Workflow started!');
      fetchWorkflowData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to start workflow');
    }
  };

  const openApprovalModal = (step: WorkflowStep) => {
    setSelectedStep(step);
    // Set default action based on step requirement
    if (step.action_required === 'sign') {
      setApprovalAction('signed');
    } else if (step.action_required === 'review') {
      setApprovalAction('reviewed');
    } else if (step.action_required === 'acknowledge') {
      setApprovalAction('acknowledged');
    } else {
      setApprovalAction('approved');
    }
    setApprovalComments('');
    setSignatureData('');
    setShowApprovalModal(true);
  };

  const handleApproval = async () => {
    if (!selectedStep || isSubmitting) return;

    // Validate signature if required
    if (approvalAction === 'signed' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasSignature = imageData.data.some((channel) => channel !== 0);
        if (!hasSignature) {
          alert('Please provide a signature before submitting.');
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      let finalSignatureData = signatureData;
      if (approvalAction === 'signed' && canvasRef.current) {
        finalSignatureData = canvasRef.current.toDataURL();
      }

      await axios.post(
        `${API_URL}/workflows/${workflowId}/steps/${selectedStep.id}/approve`,
        {
          action: approvalAction,
          comments: approvalComments || undefined,
          signature_data: finalSignatureData || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Success feedback
      const actionText = approvalAction === 'approved' ? 'approved' :
                        approvalAction === 'signed' ? 'signed' :
                        approvalAction === 'reviewed' ? 'reviewed' :
                        approvalAction === 'acknowledged' ? 'acknowledged' :
                        approvalAction === 'rejected' ? 'rejected' : 'processed';
      
      setSuccessMessage(`Step ${actionText} successfully! The workflow has been updated.`);
      setShowSuccessBanner(true);
      setShowApprovalModal(false);
      
      // Hide success banner after 5 seconds
      setTimeout(() => {
        setShowSuccessBanner(false);
      }, 5000);
      
      // Reset form
      setApprovalComments('');
      setSignatureData('');
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      
      // Refresh data
      await fetchWorkflowData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to submit action';
      alert(`❌ Error: ${errorMessage}`);
      console.error('Approval error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Signature canvas functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getDepartmentName = (deptId: string) => {
    return departments.find((d) => d.id === deptId)?.name || 'Unknown';
  };

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.full_name || 'Unknown';
  };

  const getStatusColor = (status: WorkflowStatus) => {
    switch (status) {
      case WorkflowStatus.PENDING:
        return 'bg-gray-100 text-gray-800';
      case WorkflowStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case WorkflowStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case WorkflowStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case WorkflowStatus.COMPLETED:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canApproveStep = (step: WorkflowStep) => {
    if (!currentUser || step.status !== WorkflowStatus.IN_PROGRESS) return false;
    if (step.assigned_to_id) {
      return step.assigned_to_id === currentUser.id;
    }
    return step.department_id === currentUser.department_id;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">Workflow not found</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Success Banner */}
      {showSuccessBanner && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-in-right">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold">Success!</p>
              <p>{successMessage}</p>
            </div>
            <button
              onClick={() => setShowSuccessBanner(false)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Reference Number - Prominent Display */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-4 mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90 mb-1">Workflow Reference Number</p>
            <p className="text-2xl font-bold font-mono tracking-wider">{workflow.reference_number}</p>
          </div>
          <div className="text-right">
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
              workflow.status === WorkflowStatus.COMPLETED ? 'bg-green-500' :
              workflow.status === WorkflowStatus.REJECTED ? 'bg-red-500' :
              workflow.status === WorkflowStatus.IN_PROGRESS ? 'bg-yellow-400 text-gray-900' :
              'bg-gray-300 text-gray-900'
            }`}>
              {workflow.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Workflows
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <button
              onClick={() => fetchWorkflowData()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{workflow.name}</h1>
            {workflow.description && (
              <p className="text-gray-600 mb-4">{workflow.description}</p>
            )}
          </div>
        </div>

        {workflow.status === WorkflowStatus.PENDING && (
          <button
            onClick={startWorkflow}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Start Workflow
          </button>
        )}
      </div>

      {/* Workflow Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 mb-1">Total Steps</p>
          <p className="text-2xl font-bold">{steps.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 mb-1">Current Step</p>
          <p className="text-2xl font-bold">{workflow.current_step || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 mb-1">Completed Steps</p>
          <p className="text-2xl font-bold text-green-600">
            {steps.filter(s => s.status === WorkflowStatus.APPROVED).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 mb-1">Pending Steps</p>
          <p className="text-2xl font-bold text-gray-600">
            {steps.filter(s => s.status === 'pending').length}
          </p>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Workflow Progress</h2>
          {workflow.status === WorkflowStatus.PENDING && (
            <span className="text-sm text-orange-600 font-medium">
              ⚠️ Workflow not started yet
            </span>
          )}
        </div>
        
        {/* Visual Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {workflow.status === WorkflowStatus.PENDING 
                ? 'Not Started' 
                : `Step ${workflow.current_step} of ${steps.length}`
              }
            </span>
            <span className="text-sm font-medium text-gray-700">
              {(() => {
                if (workflow.status === WorkflowStatus.COMPLETED) return '100';
                if (workflow.status === WorkflowStatus.PENDING) return '0';
                const completedSteps = steps.filter(s => s.status === WorkflowStatus.APPROVED).length;
                return steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;
              })()}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                workflow.status === WorkflowStatus.COMPLETED ? 'bg-green-500' :
                workflow.status === WorkflowStatus.REJECTED ? 'bg-red-500' :
                workflow.status === WorkflowStatus.IN_PROGRESS ? 'bg-blue-500' :
                'bg-gray-400'
              }`}
              style={{ 
                width: `${(() => {
                  if (workflow.status === WorkflowStatus.COMPLETED) return 100;
                  if (workflow.status === WorkflowStatus.PENDING) return 0;
                  const completedSteps = steps.filter(s => s.status === WorkflowStatus.APPROVED).length;
                  return steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
                })()}%` 
              }}
            />
          </div>
        </div>

        {/* Timeline View */}
        <div className="relative">
          {steps.map((step, index) => (
            <div key={step.id} className="flex gap-4 mb-6 last:mb-0">
              {/* Timeline Line */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-4 ${
                  step.status === WorkflowStatus.APPROVED ? 'bg-green-500 text-white border-green-200' :
                  step.status === WorkflowStatus.IN_PROGRESS ? 'bg-blue-500 text-white border-blue-200 animate-pulse' :
                  step.status === WorkflowStatus.REJECTED ? 'bg-red-500 text-white border-red-200' :
                  'bg-gray-200 text-gray-600 border-gray-100'
                }`}>
                  {step.status === WorkflowStatus.APPROVED ? '✓' :
                   step.status === WorkflowStatus.REJECTED ? '✗' :
                   step.step_order}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-1 flex-1 min-h-[60px] ${
                    step.status === WorkflowStatus.APPROVED ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>

              {/* Step Details */}
              <div className="flex-1 pb-6">
                <div className={`border-2 rounded-lg p-4 ${
                  step.status === WorkflowStatus.IN_PROGRESS ? 'border-blue-500 bg-blue-50' :
                  step.status === WorkflowStatus.APPROVED ? 'border-green-300 bg-green-50' :
                  step.status === WorkflowStatus.REJECTED ? 'border-red-300 bg-red-50' :
                  'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">Step {step.step_order}: {getDepartmentName(step.department_id)}</h3>
                      <p className="text-sm text-gray-600 capitalize">{step.action_required.replace('_', ' ')}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(step.status)}`}>
                      {step.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {step.assigned_to_id && (
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">Assigned to:</span> {getUserName(step.assigned_to_id)}
                    </p>
                  )}

                  {step.due_date && (
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">Due Date:</span> {new Date(step.due_date).toLocaleDateString()}
                    </p>
                  )}

                  {step.started_at && (
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">Started:</span> {new Date(step.started_at).toLocaleString()}
                    </p>
                  )}

                  {step.completed_at && (
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">Completed:</span> {new Date(step.completed_at).toLocaleString()}
                    </p>
                  )}

                  {/* Show approval details */}
                  {approvals[step.id] && approvals[step.id].length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <h4 className="text-sm font-semibold mb-2">Action History:</h4>
                      {approvals[step.id].map((approval) => (
                        <div key={approval.id} className="bg-white rounded p-3 mb-2 shadow-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm">{getUserName(approval.user_id)}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              approval.action === 'approved' || approval.action === 'signed' || approval.action === 'reviewed' || approval.action === 'acknowledged' ? 'bg-green-100 text-green-800' :
                              approval.action === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {approval.action.toUpperCase()}
                            </span>
                          </div>
                          {approval.comments && (
                            <p className="text-sm text-gray-600 mb-1">{approval.comments}</p>
                          )}
                          {approval.signature_data && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Signature:</p>
                              <img src={approval.signature_data} alt="Signature" className="h-12 border rounded" />
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(approval.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action button for current user */}
                  {canApproveStep(step) && (
                    <button
                      onClick={() => openApprovalModal(step)}
                      className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Take Action on This Step
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Old Steps View - Keeping as backup */}
      <div className="bg-white rounded-lg shadow p-6" style={{ display: 'none' }}>
        <h2 className="text-xl font-semibold mb-4">Workflow Steps (Old View)</h2>
        
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    step.status === WorkflowStatus.APPROVED ? 'bg-green-500 text-white' :
                    step.status === WorkflowStatus.IN_PROGRESS ? 'bg-blue-500 text-white' :
                    step.status === WorkflowStatus.REJECTED ? 'bg-red-500 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {step.step_order}
                  </div>
                  <div>
                    <h3 className="font-semibold">{getDepartmentName(step.department_id)}</h3>
                    <p className="text-sm text-gray-600">{step.action_required.replace('_', ' ')}</p>
                    {step.assigned_to_id && (
                      <p className="text-sm text-gray-500">Assigned to: {getUserName(step.assigned_to_id)}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                    {step.status.replace('_', ' ').toUpperCase()}
                  </span>
                  {step.due_date && (
                    <p className="text-sm text-gray-500 mt-1">
                      Due: {new Date(step.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {approvals[step.id] && approvals[step.id].length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <h4 className="text-sm font-semibold mb-2">Approvals:</h4>
                  {approvals[step.id].map((approval) => (
                    <div key={approval.id} className="text-sm bg-gray-50 p-2 rounded mb-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{getUserName(approval.user_id)}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          approval.action === 'approved' || approval.action === 'signed' ? 'bg-green-100 text-green-800' :
                          approval.action === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {approval.action.toUpperCase()}
                        </span>
                      </div>
                      {approval.comments && (
                        <p className="text-gray-600 mt-1">{approval.comments}</p>
                      )}
                      {approval.signature_data && (
                        <div className="mt-2">
                          <img src={approval.signature_data} alt="Signature" className="h-12 border" />
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(approval.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {canApproveStep(step) && (
                <button
                  onClick={() => openApprovalModal(step)}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Take Action
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Take Action - Step {selectedStep.step_order}</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Action</label>
              <select
                value={approvalAction}
                onChange={(e) => setApprovalAction(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                {selectedStep.action_required === 'review_and_approve' && (
                  <>
                    <option value="approved">Approve</option>
                    <option value="rejected">Reject</option>
                    <option value="returned">Return for Revision</option>
                  </>
                )}
                {selectedStep.action_required === 'sign' && (
                  <>
                    <option value="signed">Sign & Approve</option>
                    <option value="rejected">Reject</option>
                  </>
                )}
                {selectedStep.action_required === 'review' && (
                  <>
                    <option value="reviewed">Mark as Reviewed</option>
                    <option value="rejected">Reject</option>
                  </>
                )}
                {selectedStep.action_required === 'acknowledge' && (
                  <>
                    <option value="acknowledged">Acknowledge</option>
                    <option value="rejected">Reject</option>
                  </>
                )}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Comments</label>
              <textarea
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                rows={4}
                placeholder="Add your comments..."
              />
            </div>

            {approvalAction === 'signed' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Signature</label>
                <div className="border rounded-lg p-2">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={150}
                    className="border bg-white cursor-crosshair w-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Clear Signature
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleApproval}
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-lg font-medium ${
                  isSubmitting
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit'
                )}
              </button>
              <button
                onClick={() => setShowApprovalModal(false)}
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-lg ${
                  isSubmitting
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
