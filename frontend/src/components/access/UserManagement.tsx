'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, UserPlus, Shield, Settings, Search, 
  CheckCircle, AlertCircle, Clock, Trash2, ExternalLink
} from 'lucide-react';
import { rbacApi, api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

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

  // New user creation state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    full_name: '',
    role: '',
    department_id: ''
  });

  // Delete user state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletionReason, setDeletionReason] = useState('');

  // Get current user from auth store
  const currentUser = useAuthStore((state) => state.user);

  // State for assignable roles
  const [assignableRoles, setAssignableRoles] = useState<string[]>([]);

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
    loadAssignableRoles();
  }, []);

  const loadAssignableRoles = async () => {
    try {
      const response = await api.get('/users/assignable-roles');
      setAssignableRoles(response.data);
    } catch (err) {
      console.error('Error loading assignable roles:', err);
    }
  };

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

  const handleCreateUser = async () => {
    if (!newUserData.email || !newUserData.full_name || !newUserData.role) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/users/', newUserData);
      
      setSuccess(`User ${newUserData.full_name} created successfully`);
      
      // Reset form
      setNewUserData({
        email: '',
        full_name: '',
        role: '',
        department_id: ''
      });
      setShowCreateUser(false);
      
      // Reload users
      await loadUsers();
      
      if (onUserUpdated) {
        onUserUpdated();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const params = deletionReason ? `?deletion_reason=${encodeURIComponent(deletionReason)}` : '';
      await api.delete(`/users/${userToDelete.id}${params}`);
      
      setSuccess(`User ${userToDelete.full_name} has been soft deleted`);
      
      // Reset state
      setShowDeleteDialog(false);
      setUserToDelete(null);
      setDeletionReason('');
      setSelectedUser(null);
      
      // Reload users
      await loadUsers();
      
      if (onUserUpdated) {
        onUserUpdated();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  // Check if current user can create users
  const canCreateUsers = currentUser && ['system_admin', 'audit_manager', 'department_head'].includes(currentUser.role || '');

  // Filter role options based on assignable roles
  const availableRoles = userRoles.filter(role => 
    assignableRoles.includes(role.value)
  );

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
        <div className="flex gap-2">
          {currentUser?.role === 'system_admin' && (
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/users/deleted'}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Deleted Users
            </Button>
          )}
          {canCreateUsers && (
            <Button onClick={() => setShowCreateUser(!showCreateUser)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          )}
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

      {/* Create User Form */}
      {showCreateUser && canCreateUsers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New User
            </CardTitle>
            <CardDescription>
              Add a new user to the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  placeholder="Enter full name"
                  value={newUserData.full_name}
                  onChange={(e) => setNewUserData({...newUserData, full_name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role *</label>
                <Select 
                  value={newUserData.role} 
                  onValueChange={(value) => setNewUserData({...newUserData, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Select 
                  value={newUserData.department_id} 
                  onValueChange={(value) => setNewUserData({...newUserData, department_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Department</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateUser} disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateUser(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
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
                  
                  {/* Delete User Button */}
                  {currentUser?.role === 'system_admin' && selectedUser.id !== currentUser.id && (
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        variant="destructive" 
                        onClick={() => openDeleteDialog(selectedUser)}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete User
                      </Button>
                    </div>
                  )}
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

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Confirm User Deletion
              </CardTitle>
              <CardDescription>
                This will soft delete the user. The user can be restored later by an administrator.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium">{userToDelete.full_name}</div>
                <div className="text-sm text-gray-600">{userToDelete.email}</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Deletion Reason (Optional)</label>
                <Input
                  placeholder="Enter reason for deletion..."
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteUser}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Deleting...' : 'Delete User'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setUserToDelete(null);
                    setDeletionReason('');
                  }}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UserManagement;