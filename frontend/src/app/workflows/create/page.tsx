'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Audit, Department, User, WorkflowStepCreate } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ExtendedWorkflowStepCreate extends WorkflowStepCreate {
  custom_action_text?: string;
}

export default function CreateWorkflowPage() {
  const router = useRouter();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    audit_id: '',
    name: '',
    description: '',
  });

  const [referenceNumber, setReferenceNumber] = useState<string>('');

  const [steps, setSteps] = useState<ExtendedWorkflowStepCreate[]>([
    {
      step_order: 1,
      department_id: '',
      assigned_to_id: '',
      action_required: 'review_and_approve',
      custom_action_text: '',
      due_date: '',
    },
  ]);

  useEffect(() => {
    fetchData();
    // Show preview of what reference number will look like
    const year = new Date().getFullYear();
    setReferenceNumber(`WF-${year}-XXXXX (Will be auto-generated)`);
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [auditsRes, deptsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/audits/`, { headers }),
        axios.get(`${API_URL}/departments/`, { headers }),
        axios.get(`${API_URL}/users/`, { headers }),
      ]);

      setAudits(auditsRes.data);
      setDepartments(deptsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const addStep = () => {
    setSteps([
      ...steps,
      {
        step_order: steps.length + 1,
        department_id: '',
        assigned_to_id: '',
        action_required: 'review_and_approve',
        custom_action_text: '',
        due_date: '',
      },
    ]);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Reorder steps
    newSteps.forEach((step, i) => {
      step.step_order = i + 1;
    });
    setSteps(newSteps);
  };

  const updateStep = (index: number, field: keyof ExtendedWorkflowStepCreate, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles([...uploadedFiles, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        ...formData,
        audit_id: formData.audit_id || undefined, // Make audit_id optional
        steps: steps.map(step => ({
          ...step,
          assigned_to_id: step.assigned_to_id || undefined,
          custom_action_text: step.custom_action_text || undefined,
          due_date: step.due_date || undefined,
        })),
      };

      const response = await axios.post(`${API_URL}/workflows/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const workflowId = response.data.id;

      // Upload documents if any
      for (const file of uploadedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', `Attached document: ${file.name}`);
        
        await axios.post(`${API_URL}/workflows/${workflowId}/documents`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
        });
      }

      alert(`Workflow created successfully!\nReference Number: ${response.data.reference_number}`);
      router.push(`/workflows/${workflowId}`);
    } catch (error: any) {
      console.error('Error creating workflow:', error);
      alert(error.response?.data?.detail || 'Failed to create workflow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Workflow</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Reference Number - Immutable */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-green-900 mb-2">
            Workflow Reference Number (Auto-generated)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={referenceNumber}
              readOnly
              className="flex-1 bg-white border-2 border-green-300 rounded-lg px-4 py-3 font-mono text-lg font-bold text-green-900 cursor-not-allowed"
            />
            <span className="text-sm text-green-700 italic">Immutable</span>
          </div>
          <p className="text-xs text-green-600 mt-2">
            This reference number will be used to track this workflow throughout its lifecycle.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Audit (Optional)</label>
          <select
            value={formData.audit_id}
            onChange={(e) => setFormData({ ...formData, audit_id: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">No audit - Standalone workflow</option>
            {audits.map((audit) => (
              <option key={audit.id} value={audit.id}>
                {audit.title} ({audit.year})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to create a standalone workflow not tied to any audit
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Workflow Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g., Financial Audit Approval Process"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            rows={3}
            placeholder="Describe the workflow purpose..."
          />
        </div>

        {/* Document Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <label className="block text-sm font-medium mb-2">Attach Documents (Optional)</label>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="w-full"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload reference documents for this workflow (PDF, Word, Excel, Images)
          </p>
          
          {uploadedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded">
                  <span className="text-sm">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Workflow Steps</h2>
            <button
              type="button"
              onClick={addStep}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Add Step
            </button>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Step {step.step_order}</h3>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Department</label>
                    <select
                      value={step.department_id}
                      onChange={(e) => updateStep(index, 'department_id', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Assign To (Optional)</label>
                    <select
                      value={step.assigned_to_id || ''}
                      onChange={(e) => updateStep(index, 'assigned_to_id', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="">Any department member</option>
                      {users
                        .filter((u) => u.department_id === step.department_id)
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.full_name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Action Required</label>
                    <select
                      value={step.action_required}
                      onChange={(e) => updateStep(index, 'action_required', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="review_and_approve">Review and Approve</option>
                      <option value="sign">Sign Document</option>
                      <option value="review">Review Only</option>
                      <option value="acknowledge">Acknowledge</option>
                      <option value="create_document">Create New Document</option>
                      <option value="add_minutes">Add Minutes to Document</option>
                      <option value="custom">Custom Action</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date (Optional)</label>
                    <input
                      type="date"
                      value={step.due_date || ''}
                      onChange={(e) => updateStep(index, 'due_date', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* Custom Action Text - shown when action is custom or always for additional instructions */}
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">
                    {step.action_required === 'custom' ? 'Custom Action Instructions *' : 'Additional Instructions (Optional)'}
                  </label>
                  <textarea
                    value={step.custom_action_text || ''}
                    onChange={(e) => updateStep(index, 'custom_action_text', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    rows={2}
                    placeholder="Specify what the recipient should do..."
                    required={step.action_required === 'custom'}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Creating...' : 'Create Workflow'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-200 px-6 py-2 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
