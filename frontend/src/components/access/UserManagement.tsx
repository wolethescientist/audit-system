'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, UserPlus, Shield, Settings, Search, Filter, 
  CheckCircle, AlertCircle, Clock, X, Edit, Trash2 
} from 'lucide-react';
import { rbacApi, api } from '@/lib/api';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department_id?: string;
  is_active: boolean;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
}

interface RoleMatrix {
  id: string;
  role_name: string;
  role_description?: string;
  role_category: string;
  department_id?: string;
  is_global_role: boolean;
  is_active: boolean;
}

interface UserRoleAssignment {
  id: string;
  role_name: string;
  role_description?: string;
  assignment_reason?: string;
  effective_date: string;
  expiry_date?: string;
  is_temporary: boolean;
  is_active: boolean;
  assigned_by?: string;
  approved_by?: string;
}

interface UserManagementProps {
  onUserUpdated?: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onUserUpdated }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roleMatrix, setRoleMatrix] = useState<RoleMatrix[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userRoleAssignments, setUserRoleAssignments] = useState<UserRoleAssignment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Role assignment form state
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [isTemporary, setIsTemporary] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');

  const userRoles = [
    { value: 'system_admin', label: 'System Administrator' },
    { value: 'audit_manager', label: 'Audit Manager' },
    { value: 'auditor', label: 'Auditor' },
    { value: 'department_head', label: 'Department Head' },
    { value: 'department_officer', label: 'Department Officer' },
    { value: 'viewer', label: 'Viewer' }
  ];

  useEffect(() => {
    loadUsers();
    loadDepartments();
    loadRoleMatrix();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await api.get('/departments/');
      setDepartments(response.data);
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  const loadRoleMatrix = async () => {
    try {
      const roles = await rbacApi.getRoleMatrix();
      setRoleMatrix(roles);
    } catch (err) {
      console.error('Error loading role matrix:', err);
    }
  };

  const loadUserRoleAssignments = async (userId: string) => {
    try {
      const assignments = await rbacApi.getUserRoleAssignments(userId, true);
      setUserRoleAssignments(assignments);
    } catch (err) {
      console.error('Error loading user role assignments:', err);
      setError('Failed to load user role assignments');
    }
  };

  const handleUserSelect = async (user: User) => {
    setSelectedUser(user);
    await loadUserRoleAssignments(user.id);
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleId) {
      setError('Please select a user and role');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const assignmentData = {
        user_id: selectedUser.id,
        role_id: selectedRoleId,
        assignment_reason: assignmentReason,
        is_temporary: isTemporary,
        expiry_date: isTemporary && expiryDate ? new Date(expiryDate).toISOString() : undefined
      };

      await rbacApi.assignUserRole(assignmentData);
      
      setSuccess(`Role assigned successfully to ${selectedUser.full_name}`);
      
      // Reset form
      setSelectedRoleId('');
      setAssignmentReason('');
      setIsTemporary(false);
      setExpiryDate('');
      
      // Reload assignments
      await loadUserRoleAssignments(selectedUser.id);
      
      if (onUserUpdated) {
        onUserUpdated();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to assign role');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesDepartment = !departmentFilter || user.department_id === departmentFilter;
    
    return matchesSearch && matchesRole && matchesDepartment;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'system_admin':
        return 'bg-red-100 text-red-800';
      case 'audit_manager':
        return 'bg-purple-100 text-purple-800';
      case 'auditor':
        return 'bg-blue-100 text-blue-800';
      case 'department_head':
        return 'bg-green-100 text-green-800';
      case 'department_officer':
        return 'bg-yellow-100 text-yellow-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return 'No Department';
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || 'Unknown Department';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-600">Manage users and role assignments with enhanced RBAC</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({filteredUsers.length})
            </CardTitle>
            <CardDescription>
              Select a user to manage their role assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Roles</SelectItem>
                    {userRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Users List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.id === user.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                      <div className="text-xs text-gray-500">
                        {getDepartmentName(user.department_id)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                      {!user.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Details and Role Management */}
        <div className="space-y-6">
          {selectedUser ? (
            <>
              {/* User Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    User Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <div className="text-lg font-medium">{selectedUser.full_name}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <div>{selectedUser.email}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Primary Role</label>
                      <div>
                        <Badge className={getRoleBadgeColor(selectedUser.role)}>
                          {selectedUser.role.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Department</label>
                      <div>{getDepartmentName(selectedUser.department_id)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div>
                        <Badge variant={selectedUser.is_active ? "default" : "secondary"}>
                          {selectedUser.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Role Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Assign Additional Role
                  </CardTitle>
                  <CardDescription>
                    Assign additional roles from the role matrix
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role from matrix" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleMatrix.filter(role => role.is_active).map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div>
                              <div className="font-medium">{role.role_name}</div>
                              {role.role_description && (
                                <div className="text-xs text-gray-500">{role.role_description}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assignment Reason</label>
                    <Input
                      placeholder="Reason for role assignment"
                      value={assignmentReason}
                      onChange={(e) => setAssignmentReason(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="temporary"
                      checked={isTemporary}
                      onChange={(e) => setIsTemporary(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="temporary" className="text-sm font-medium">
                      Temporary Assignment
                    </label>
                  </div>

                  {isTemporary && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Expiry Date</label>
                      <Input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                      />
                    </div>
                  )}

                  <Button 
                    onClick={handleAssignRole} 
                    disabled={loading || !selectedRoleId}
                    className="w-full"
                  >
                    {loading ? 'Assigning...' : 'Assign Role'}
                  </Button>
                </CardContent>
              </Card>

              {/* Current Role Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Role Assignments ({userRoleAssignments.length})
                  </CardTitle>
                  <CardDescription>
                    Current and historical role assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userRoleAssignments.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No additional role assignments
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userRoleAssignments.map((assignment) => (
                        <div key={assignment.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{assignment.role_name}</div>
                              {assignment.role_description && (
                                <div className="text-sm text-gray-600">{assignment.role_description}</div>
                              )}
                              {assignment.assignment_reason && (
                                <div className="text-xs text-gray-500">
                                  Reason: {assignment.assignment_reason}
                                </div>
                              )}
                              <div className="text-xs text-gray-500">
                                Effective: {new Date(assignment.effective_date).toLocaleDateString()}
                                {assignment.expiry_date && (
                                  <> • Expires: {new Date(assignment.expiry_date).toLocaleDateString()}</>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant={assignment.is_active ? "default" : "secondary"}>
                                {assignment.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              {assignment.is_temporary && (
                                <Badge variant="outline">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Temporary
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Select a user to manage their roles</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;