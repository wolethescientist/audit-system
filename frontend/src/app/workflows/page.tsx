'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Workflow, WorkflowStatus, WorkflowStep, User } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PendingTask {
  workflow: Workflow;
  step: WorkflowStep;
  audit_title?: string;
  isMyTurn: boolean;
}

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'my-tasks'>('all');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const initializeUser = async () => {
      await fetchCurrentUser();
    };
    initializeUser();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
    if (activeTab === 'all') {
      fetchWorkflows();
    } else {
      fetchMyTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, activeTab, currentUser]);

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

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = filter !== 'all' ? { status: filter } : {};
      
      const response = await axios.get(`${API_URL}/workflows/`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      setWorkflows(response.data);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTasks = async () => {
    if (!currentUser) {
      console.log('Cannot fetch tasks: currentUser is null');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      console.log('Fetching workflows for user:', currentUser.id, currentUser.full_name);
      const response = await axios.get(`${API_URL}/workflows/my-workflows`, { headers });
      console.log('Found workflows:', response.data.length);
      
      const tasksData: PendingTask[] = [];
      
      for (const workflow of response.data) {
        console.log('Processing workflow:', workflow.reference_number, workflow.status);
        
        if (workflow.status === 'completed' || workflow.status === 'rejected') {
          console.log('Skipping completed/rejected workflow');
          continue;
        }

        const stepsRes = await axios.get(`${API_URL}/workflows/${workflow.id}/steps`, { headers });
        console.log('Workflow steps:', stepsRes.data.length);
        
        const myStep = stepsRes.data.find((step: WorkflowStep) => {
          const isAssignedToMe = step.assigned_to_id === currentUser.id;
          const isMyDepartment = step.department_id === currentUser.department_id;
          console.log(`Step ${step.step_order}: assigned_to=${step.assigned_to_id}, my_id=${currentUser.id}, dept=${step.department_id}, my_dept=${currentUser.department_id}, match=${isAssignedToMe || isMyDepartment}`);
          return isAssignedToMe || isMyDepartment;
        });
        
        if (myStep) {
          console.log('Found my step:', myStep.step_order, myStep.status);
          
          let auditTitle = 'Unknown Audit';
          try {
            const auditRes = await axios.get(`${API_URL}/audits/${workflow.audit_id}`, { headers });
            auditTitle = auditRes.data.title;
          } catch (error) {
            console.error('Error fetching audit:', error);
          }

          const isMyTurn = myStep.status === 'in_progress';
          console.log('Is my turn?', isMyTurn);

          tasksData.push({
            workflow,
            step: myStep,
            audit_title: auditTitle,
            isMyTurn,
          });
        } else {
          console.log('No matching step found for this workflow');
        }
      }
      
      console.log('Total tasks found:', tasksData.length);
      
      tasksData.sort((a, b) => {
        if (a.isMyTurn && !b.isMyTurn) return -1;
        if (!a.isMyTurn && b.isMyTurn) return 1;
        return a.step.step_order - b.step.step_order;
      });
      
      setTasks(tasksData);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      console.error('Error detail:', error.response?.data);
      if (error.response?.status === 422) {
        console.error('Validation error - endpoint may not exist or has wrong parameters');
      }
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getActionLabel = (actionRequired: string) => {
    switch (actionRequired) {
      case 'review_and_approve': return 'Review and Approve';
      case 'sign': return 'Sign Document';
      case 'review': return 'Review Only';
      case 'acknowledge': return 'Acknowledge';
      default: return actionRequired.replace('_', ' ');
    }
  };

  const getActionColor = (actionRequired: string) => {
    switch (actionRequired) {
      case 'review_and_approve': return 'bg-blue-100 text-blue-800';
      case 'sign': return 'bg-purple-100 text-purple-800';
      case 'review': return 'bg-green-100 text-green-800';
      case 'acknowledge': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Workflows</h1>
        <button
          onClick={() => router.push('/workflows/create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Workflow
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All Workflows
          </button>
          <button
            onClick={() => setActiveTab('my-tasks')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'my-tasks'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Tasks
            {tasks.filter(t => t.isMyTurn).length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {tasks.filter(t => t.isMyTurn).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'all' ? (
        <>
          <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Completed
        </button>
      </div>

          <div className="bg-white rounded-lg shadow">
        {workflows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No workflows found. Create your first workflow to get started.
          </div>
        ) : (
          <div className="divide-y">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="p-6 hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/workflows/${workflow.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{workflow.name}</h3>
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {workflow.reference_number}
                      </span>
                    </div>
                    {workflow.description && (
                      <p className="text-gray-600 mb-3">{workflow.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Step {workflow.current_step}</span>
                      <span>•</span>
                      <span>Created {new Date(workflow.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(workflow.status)}`}>
                    {workflow.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>
        </>
      ) : (
        /* My Tasks Tab */
        <div>
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-semibold mb-2">All caught up!</h2>
              <p className="text-gray-600">You have no workflows assigned to you at the moment.</p>
            </div>
          ) : (
            <>
              {/* Active Tasks */}
              {tasks.filter(t => t.isMyTurn).length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    Action Required ({tasks.filter(t => t.isMyTurn).length})
                  </h2>
                  <div className="space-y-4">
                    {tasks.filter(t => t.isMyTurn).map((task) => (
                      <TaskCard 
                        key={task.workflow.id} 
                        task={task} 
                        router={router} 
                        isOverdue={isOverdue} 
                        getActionLabel={getActionLabel} 
                        getActionColor={getActionColor} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Tasks */}
              {tasks.filter(t => !t.isMyTurn).length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    Upcoming - Waiting for Previous Steps ({tasks.filter(t => !t.isMyTurn).length})
                  </h2>
                  <div className="space-y-4">
                    {tasks.filter(t => !t.isMyTurn).map((task) => (
                      <TaskCard 
                        key={task.workflow.id} 
                        task={task} 
                        router={router} 
                        isOverdue={isOverdue} 
                        getActionLabel={getActionLabel} 
                        getActionColor={getActionColor} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Task Card Component
function TaskCard({ task, router, isOverdue, getActionLabel, getActionColor }: any) {
  return (
    <div
      className={`bg-white rounded-lg shadow-lg border-l-4 ${
        task.isMyTurn
          ? isOverdue(task.step.due_date) 
            ? 'border-red-500' 
            : 'border-blue-500'
          : 'border-gray-400 opacity-75'
      } hover:shadow-xl transition-shadow cursor-pointer`}
      onClick={() => router.push(`/workflows/${task.workflow.id}`)}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold">{task.workflow.name}</h2>
              <span className="text-sm font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {task.workflow.reference_number}
              </span>
              {!task.isMyTurn && (
                <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">
                  WAITING
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-2">
              <span className="font-medium">Audit:</span> {task.audit_title}
            </p>
          </div>
          {task.isMyTurn && isOverdue(task.step.due_date) && (
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">
              OVERDUE
            </span>
          )}
        </div>

        <div className={`rounded-lg p-4 mb-4 ${
          task.isMyTurn ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
              task.isMyTurn ? 'bg-blue-500 text-white' : 'bg-gray-400 text-white'
            }`}>
              {task.step.step_order}
            </div>
            <div>
              <p className="font-semibold text-lg">
                {task.isMyTurn ? 'Your Action Required' : 'Your Upcoming Step'}
              </p>
              <p className="text-sm text-gray-600">
                {task.isMyTurn 
                  ? `Step ${task.step.step_order} - Currently Active` 
                  : `Step ${task.step.step_order} - Waiting for Step ${task.workflow.current_step}`
                }
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Action Type</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getActionColor(task.step.action_required)}`}>
                {getActionLabel(task.step.action_required)}
              </span>
            </div>
            {task.step.due_date && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Due Date</p>
                <p className={`text-sm font-medium ${
                  task.isMyTurn && isOverdue(task.step.due_date) ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {new Date(task.step.due_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {task.isMyTurn ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/workflows/${task.workflow.id}`);
            }}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold text-lg"
          >
            Take Action Now →
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/workflows/${task.workflow.id}`);
            }}
            className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-semibold text-lg"
          >
            View Progress →
          </button>
        )}
      </div>
    </div>
  );
}
