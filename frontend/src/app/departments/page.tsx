'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Department } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, X, AlertTriangle, Building2, Edit, Trash2 } from 'lucide-react';

interface DepartmentFormData {
  name: string;
  parent_department_id: string;
}

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    parent_department_id: '',
  });

  const { data: departments, isLoading } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments/');
      return response.data;
    },
  });

  const createDeptMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/departments/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', '));
      } else {
        setError('Failed to create department');
      }
    },
  });

  const handleOpenModal = (dept?: Department) => {
    setError(null);
    if (dept) {
      setEditingDept(dept);
      setFormData({
        name: dept.name,
        parent_department_id: dept.parent_department_id || '',
      });
    } else {
      setEditingDept(null);
      setFormData({
        name: '',
        parent_department_id: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDept(null);
    setError(null);
    setFormData({
      name: '',
      parent_department_id: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const submitData: any = {
      name: formData.name,
      parent_department_id: formData.parent_department_id || null,
    };

    createDeptMutation.mutate(submitData);
  };

  const getParentDeptName = (parentId: string | null | undefined) => {
    if (!parentId) return null;
    const parent = departments?.find(d => d.id === parentId);
    return parent?.name || null;
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Departments</h1>
        <Button onClick={() => handleOpenModal()} className="bg-primary-600 hover:bg-primary-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">Loading departments...</CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200">
              {departments?.map((dept: any) => (
                <div key={dept.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                      <p className="text-sm text-gray-500">
                        {getParentDeptName(dept.parent_department_id) 
                          ? `Parent: ${getParentDeptName(dept.parent_department_id)}`
                          : 'Top-level department'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal(dept)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {departments?.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No departments found. Click "Add Department" to create one.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Department Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">
                {editingDept ? 'Edit Department' : 'Add New Department'}
              </h2>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {error && (
              <Alert className="m-4 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter department name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Department
                </label>
                <Select
                  value={formData.parent_department_id}
                  onValueChange={(value) => setFormData({ ...formData, parent_department_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Parent (Top-level)</SelectItem>
                    {departments
                      ?.filter(d => d.id !== editingDept?.id)
                      .map((dept: any) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Select a parent to create a sub-department
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createDeptMutation.isPending}>
                  {createDeptMutation.isPending
                    ? 'Saving...'
                    : editingDept
                    ? 'Update Department'
                    : 'Create Department'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
