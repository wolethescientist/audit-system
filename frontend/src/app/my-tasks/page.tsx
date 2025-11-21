'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Workflow, WorkflowStep, User } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PendingTask {
  workflow: Workflow;
  step: WorkflowStep;
  audit_title?: string;
  isMyTurn: boolean;
}

export default function MyTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const initializePage = async () => {
      await fetchCurrentUser();
      await fetchMyTasks();
    };
    
    initializePage();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMyTasks();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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

  const fetchMyTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // First ensure we have current user data
      let user = currentUser;
      if (!user) {
        const userResponse = await axios.get(`${API_URL}/auth/validate`, { headers });
        user = userResponse.data;
        setCurrentUser(user);
      }

      if (!user) {
        console.error('Unable to fetch current user');
        setLoading(false);
        return;
      }

      console.log(`Fetching workflows for user: ${user.full_name} (ID: ${user.id})`);

      // Get all workflows where I'm assigned (not just active ones)
      const response = await axios.get(`${API_URL}/workflows/my-workflows`, { headers });
      
      console.log(`Found ${response.data.length} workflows assigned to me`);
      
      // For each workflow, get the steps and find MY step
      const tasksData: PendingTask[] = [];
      
      for (const workflow of response.data) {
        // Skip completed or rejected workflows
        if (workflow.status === 'completed' || workflow.status === 'rejected') {
          continue;
        }

        try {
          const stepsRes = await axios.get(`${API_URL}/workflows/${workflow.id}/steps`, { headers });
          
          // Find my step (the one assigned to me)
          const myStep = stepsRes.data.find((step: WorkflowStep) => 
            step.assigned_to_id === user.id || step.department_id === user.department_id
          );
          
          if (myStep) {
            // Get audit details
            let auditTitle = 'Unknown Audit';
            try {
              const auditRes = await axios.get(`${API_URL}/audits/${workflow.audit_id}`, { headers });
              auditTitle = auditRes.data.title;
            } catch (error) {
              console.error('Error fetching audit:', error);
            }

            // Check if it's my turn (my step is in progress)
            const isMyTurn = myStep.status === 'in_progress';

            tasksData.push({
              workflow,
              step: myStep,
              audit_title: auditTitle,
              isMyTurn,
            });
          }
        } catch (stepError) {
          console.error(`Error fetching steps for workflow ${workflow.id}:`, stepError);
        }
      }
      
      // Sort: My turn first, then by step order
      tasksData.sort((a, b) => {
        if (a.isMyTurn && !b.isMyTurn) return -1;
        if (!a.isMyTurn && b.isMyTurn) return 1;
        return a.step.step_order - b.step.step_order;
      });
      
      console.log(`Processed ${tasksData.length} tasks`);
      setTasks(tasksData);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      console.error('Error detail:', error.response?.data);
      console.error('Error status:', error.response?.status);
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (actionRequired: string) => {
    switch (actionRequired) {
      case 'review_and_approve':
        return 'Review and Approve';
      case 'sign':
        return 'Sign Document';
      case 'review':
        return 'Review Only';
      case 'acknowledge':
        return 'Acknowledge';
      default:
        return actionRequired.replace('_', ' ');
    }
  };

  const getActionColor = (actionRequired: string) => {
    switch (actionRequired) {
      case 'review_and_approve':
        return 'bg-blue-100 text-blue-800';
      case 'sign':
        return 'bg-purple-100 text-purple-800';
      case 'review':
        return 'bg-green-100 text-green-800';
      case 'acknowledge':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Tasks</h1>
        <p className="text-gray-600">Workflows waiting for your action</p>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-semibold mb-2">All caught up!</h2>
          <p className="text-gray-600">You have no workflows assigned to you at the moment.</p>
        </div>
      ) : (
        <>
          {/* Active Tasks - My Turn */}
          {tasks.filter(t => t.isMyTurn).length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                Action Required ({tasks.filter(t => t.isMyTurn).length})
              </h2>
              <div className="space-y-4">
                {tasks.filter(t => t.isMyTurn).map((task) => (
                  <TaskCard key={task.workflow.id} task={task} router={router} isOverdue={isOverdue} getActionLabel={getActionLabel} getActionColor={getActionColor} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Tasks - Waiting for Previous Steps */}
          {tasks.filter(t => !t.isMyTurn).length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                Upcoming - Waiting for Previous Steps ({tasks.filter(t => !t.isMyTurn).length})
              </h2>
              <div className="space-y-4">
                {tasks.filter(t => !t.isMyTurn).map((task) => (
                  <TaskCard key={task.workflow.id} task={task} router={router} isOverdue={isOverdue} getActionLabel={getActionLabel} getActionColor={getActionColor} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Refresh Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>This page auto-refreshes every 30 seconds</p>
      </div>
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
        {/* Header */}
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

        {/* Step Info */}
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
            {task.step.started_at && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Started</p>
                <p className="text-sm text-gray-900">
                  {new Date(task.step.started_at).toLocaleDateString()}
                </p>
              </div>
            )}
            {!task.isMyTurn && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <p className="text-sm text-gray-700 capitalize">
                  {task.step.status.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        {task.isMyTurn ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const url = `/workflows/${task.workflow.id}?action=true&stepId=${task.step.id}`;
              console.log('Navigating to:', url);
              console.log('Step ID:', task.step.id);
              router.push(url);
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
