'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, EyeOff, Filter, Search, Building, Users, 
  CheckCircle, AlertCircle, Shield, Lock, Unlock 
} from 'lucide-react';
import { rbacApi, api } from '@/lib/api';
import { useAccessControl } from './AccessControl';

interface AuditAccess {
  id: string;
  title: string;
  status: string;
  department_id?: string;
  assigned_manager_id?: string;
  lead_auditor_id?: string;
  access_reason: string;
}

interface UserAuditAccess {
  user_id: string;
  accessible_audit_count: number;
  accessible_audits: AuditAccess[];
  access_level: string;
}

interface Department {
  id: string;
  name: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department_id?: string;
}

interface AuditVisibilityProps {
  onVisibilityChanged?: () => void;
}

const AuditVisibility: React.FC<AuditVisibilityProps> = ({ onVisibilityChanged }) => {
  const { isAdmin, userRole, departmentId } = useAccessControl();
  const [userAuditAccess, setUserAuditAccess] = useState<UserAuditAccess | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserAccess, setSelectedUserAccess] = useState<UserAuditAccess | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [accessLevelFilter, setAccessLevelFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Admin override state
  const [overrideAuditId, setOverrideAuditId] = useState('');
  const [overrideUserId, setOverrideUserId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    loadCurrentUserAccess();
    loadDepartments();
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadCurrentUserAccess = async () => {
    try {
      const access = await rbacApi.getUserAuditAccess();
      setUserAuditAccess(access);
    } catch (err) {
      console.error('Error loading user audit access:', err);
      setError('Failed to load audit access information');
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

  const loadUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data.filter((user: User) => user.is_active));
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const handleUserAccessCheck = async (userId: string) => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const access = await rbacApi.getUserAuditAccess(userId);
      setSelectedUserAccess(access);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to check user access');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminOverride = async () => {
    if (!overrideAuditId || !overrideUserId || !overrideReason) {
      setError('Please fill in all override fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await rbacApi.adminOverrideAuditAccess(
        overrideAuditId,
        overrideUserId,
        overrideReason
      );

      setSuccess(result.message);
      
      // Reset form
      setOverrideAuditId('');
      setOverrideUserId('');
      setOverrideReason('');
      
      // Refresh access data
      if (selectedUserId) {
        await handleUserAccessCheck(selectedUserId);
      }
      
      if (onVisibilityChanged) {
        onVisibilityChanged();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to apply admin override');
    } finally {
      setLoading(false);
    }
  };

  const getAccessLevelBadge = (level: string) => {
    switch (level) {
      case 'full':
        return <Badge className="bg-red-100 text-red-800">Full Access</Badge>;
      case 'department':
        return <Badge className="bg-blue-100 text-blue-800">Department Access</Badge>;
      case 'assigned_only':
        return <Badge className="bg-green-100 text-green-800">Assigned Only</Badge>;
      case 'none':
        return <Badge className="bg-gray-100 text-gray-800">No Access</Badge>;
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      planned: 'bg-gray-100 text-gray-800',
      initiated: 'bg-blue-100 text-blue-800',
      preparation: 'bg-yellow-100 text-yellow-800',
      executing: 'bg-orange-100 text-orange-800',
      reporting: 'bg-purple-100 text-purple-800',
      followup: 'bg-indigo-100 text-indigo-800',
      closed: 'bg-green-100 text-green-800'
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return 'No Department';
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || 'Unknown Department';
  };

  const filteredAudits = (audits: AuditAccess[]) => {
    return audits.filter(audit => {
      const matchesSearch = audit.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = !departmentFilter || audit.department_id === departmentFilter;
      
      return matchesSearch && matchesDepartment;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Visibility Control</h2>
          <p className="text-gray-600">
            Manage department-based audit access and visibility controls
          </p>
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
        {/* Current User Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Your Audit Access
            </CardTitle>
            <CardDescription>
              Audits you can access based on your role and department
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userAuditAccess ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-800">
                      {userAuditAccess.accessible_audit_count}
                    </div>
                    <div className="text-sm text-blue-600">Accessible Audits</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-semibold text-green-800">
                      {getAccessLevelBadge(userAuditAccess.access_level)}
                    </div>
                    <div className="text-sm text-green-600">Access Level</div>
                  </div>
                </div>

                {/* Search and Filter */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search your audits..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
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

                {/* Accessible Audits List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredAudits(userAuditAccess.accessible_audits).map((audit) => (
                    <div key={audit.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{audit.title}</div>
                          <div className="text-sm text-gray-600">
                            {getDepartmentName(audit.department_id)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Access: {audit.access_reason}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(audit.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Loading access information...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Controls */}
        <div className="space-y-6">
          {isAdmin && (
            <>
              {/* User Access Check */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Check User Access
                  </CardTitle>
                  <CardDescription>
                    View audit access for any user in the system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select User</label>
                    <Select 
                      value={selectedUserId} 
                      onValueChange={(value) => {
                        setSelectedUserId(value);
                        handleUserAccessCheck(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user to check access" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div>
                              <div className="font-medium">{user.full_name}</div>
                              <div className="text-xs text-gray-500">
                                {user.role.replace('_', ' ')} • {getDepartmentName(user.department_id)}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedUserAccess && (
                    <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Access Level:</span>
                        {getAccessLevelBadge(selectedUserAccess.access_level)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Accessible Audits:</span>
                        <span className="text-lg font-semibold">
                          {selectedUserAccess.accessible_audit_count}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Admin Override */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Admin Override
                  </CardTitle>
                  <CardDescription>
                    Grant emergency audit access to users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Audit ID</label>
                    <Input
                      placeholder="Enter audit ID"
                      value={overrideAuditId}
                      onChange={(e) => setOverrideAuditId(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target User</label>
                    <Select value={overrideUserId} onValueChange={setOverrideUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user for override" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div>
                              <div className="font-medium">{user.full_name}</div>
                              <div className="text-xs text-gray-500">
                                {user.role.replace('_', ' ')} • {getDepartmentName(user.department_id)}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Override Reason</label>
                    <Input
                      placeholder="Reason for emergency access"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={handleAdminOverride} 
                    disabled={loading || !overrideAuditId || !overrideUserId || !overrideReason}
                    className="w-full"
                    variant="destructive"
                  >
                    {loading ? 'Applying Override...' : 'Apply Admin Override'}
                  </Button>

                  <div className="text-xs text-gray-500 p-2 bg-yellow-50 rounded border">
                    <strong>Warning:</strong> Admin overrides are logged and audited. 
                    Use only for legitimate emergency access requirements.
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Access Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Department Access Summary
              </CardTitle>
              <CardDescription>
                Overview of department-based access controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <span className="text-sm font-medium">System Administrators</span>
                  <Badge className="bg-red-100 text-red-800">Full System Access</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm font-medium">Audit Managers</span>
                  <Badge className="bg-blue-100 text-blue-800">Department + Assigned</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm font-medium">Auditors</span>
                  <Badge className="bg-green-100 text-green-800">Assigned Audits Only</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <span className="text-sm font-medium">Department Staff</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Department Audits</Badge>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded">
                <div className="text-sm font-medium mb-2">ISO Compliance Notes:</div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Segregation of duties enforced per ISO 27001 A.6.1.2</li>
                  <li>• Access controls logged per ISO 27001 A.12.4.1</li>
                  <li>• Department-based filtering per requirements 6.3, 6.4</li>
                  <li>• Admin overrides audited per requirement 6.5</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuditVisibility;