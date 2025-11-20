'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { Workflow, WorkflowStep, WorkflowApproval, Department, User, WorkflowStatus } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function WorkflowDetailPage() {
  const router = useRouter();
  const params = useParams();
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

  useEffect(() => {
    fetchWorkflowData();
    fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

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
    setApprovalAction('approved');
    setApprovalComments('');
    setSignatureData('');
    setShowApprovalModal(true);
  };

  const handleApproval = async () => {
    if (!selectedStep) return;

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

      alert('Action submitted successfully!');
      setShowApprovalModal(false);
      fetchWorkflowData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to submit action');
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
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Workflows
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{workflow.name}</h1>
            {workflow.description && (
              <p className="text-gray-600 mb-4">{workflow.description}</p>
            )}
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(workflow.status)}`}>
            {workflow.status.replace('_', ' ').toUpperCase()}
          </span>
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

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Workflow Steps</h2>
        
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
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
                <option value="returned">Return for Revision</option>
                <option value="signed">Sign & Approve</option>
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
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Submit
              </button>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="bg-gray-200 px-6 py-2 rounded-lg hover:bg-gray-300"
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
