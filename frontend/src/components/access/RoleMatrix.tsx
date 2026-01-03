'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Users, Lock, Eye, Edit, Trash2, Plus, AlertTriangle } from 'lucide-react';

interface RoleMatrix {
  id: string;
  role_name: string;
  role_description?: string;
  role_category?: string;
  department_id?: string;
  is_global_role: boolean;
  can_create_audits: boolean;
  can_view_all_audits: boolean;
  can_view_assigned_audits: boolean;
  can_edit_audits: boolean;
  can_delete_audits: boolean;
  can_approve_reports: boolean;
  can_manage_users: boolean;
  can_manage_departments: boolean;
  can_view_analytics: boolean;
  can_export_data: boolean;
  can_create_risks: boolean;
  can_assess_risks: boolean;
  can_approve_risk_treatments: boolean;
  can_create_capa: boolean;
  can_assign_capa: boolean;
  can_close_capa: boolean;
  can_upload_documents: boolean;
  can_approve_documents: boolean;
  can_archive_documents: boolean;
  can_manage_assets: boolean;
  can_assign_assets: boolean;
  can_manage_vendors: boolean;
  can_evaluate_vendors: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RoleMatrixProps {
  onClose?: () => void;
}

export default function RoleMatrix({ onClose }: RoleMatrixProps) {
  const [roles, setRoles] = useState<RoleMatrix[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleMatrix | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [formData, setFormData] = useState({
    role_name: '',
    role_description: '',
    role_category: 'business',
    is_global_role: false,
    can_create_audits: false,
    can_view_all_audits: false,
    can_view_assigned_audits: true,
    can_edit_audits: false,
    can_delete_audits: false,
    can_approve_reports: false,
    can_manage_users: false,
    can_manage_departments: false,
    can_view_analytics: false,
    can_export_data: false,
    can_create_risks: false,
    can_assess_risks: false,
    can_approve_risk_treatments: false,
    can_create_capa: false,
    can_assign_capa: false,
    can_close_capa: false,
    can_upload_documents: false,
    can_approve_documents: false,
    can_archive_documents: false,
    can_manage_assets: false,
    can_assign_assets: false,
    can_manage_vendors: false,
    can_evaluate_vendors: false
  });

  useEffect(() => {
    loadRoles();
  }, [categoryFilter]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      // Use the RBAC API to load roles
      const { rbacApi } = await import('@/lib/api');
      const rolesData = await rbacApi.getRoleMatrix(undefined, true);
      
      // Transform API response to match component interface
      // Backend returns permissions as nested object: role.permissions.can_create_audits
      const transformedRoles = rolesData.map((role: any) => {
        const permissions = role.permissions || {};
        return {
          id: role.id,
          role_name: role.role_name,
          role_description: role.role_description,
          role_category: role.role_category || 'business',
          department_id: role.department_id,
          is_global_role: role.is_global_role,
          can_create_audits: permissions.can_create_audits || false,
          can_view_all_audits: permissions.can_view_all_audits || false,
          can_view_assigned_audits: permissions.can_view_assigned_audits ?? true,
          can_edit_audits: permissions.can_edit_audits || false,
          can_delete_audits: permissions.can_delete_audits || false,
          can_approve_reports: permissions.can_approve_reports || false,
          can_manage_users: permissions.can_manage_users || false,
          can_manage_departments: permissions.can_manage_departments || false,
          can_view_analytics: permissions.can_view_analytics || false,
          can_export_data: permissions.can_export_data || false,
          can_create_risks: permissions.can_create_risks || false,
          can_assess_risks: permissions.can_assess_risks || false,
          can_approve_risk_treatments: permissions.can_approve_risk_treatments || false,
          can_create_capa: permissions.can_create_capa || false,
          can_assign_capa: permissions.can_assign_capa || false,
          can_close_capa: permissions.can_close_capa || false,
          can_upload_documents: permissions.can_upload_documents || false,
          can_approve_documents: permissions.can_approve_documents || false,
          can_archive_documents: permissions.can_archive_documents || false,
          can_manage_assets: permissions.can_manage_assets || false,
          can_assign_assets: permissions.can_assign_assets || false,
          can_manage_vendors: permissions.can_manage_vendors || false,
          can_evaluate_vendors: permissions.can_evaluate_vendors || false,
          is_active: role.is_active,
          created_at: role.created_at,
          updated_at: role.updated_at || role.created_at
        };
      });
      
      setRoles(transformedRoles);
    } catch (err: any) {
      console.error('Error loading roles:', err);
      setError('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const { rbacApi } = await import('@/lib/api');
      
      // Prepare role data with permissions
      const roleData = {
        role_name: formData.role_name,
        role_description: formData.role_description,
        role_category: formData.role_category,
        is_global_role: formData.is_global_role,
        permissions: {
          can_create_audits: formData.can_create_audits,
          can_view_all_audits: formData.can_view_all_audits,
          can_view_assigned_audits: formData.can_view_assigned_audits,
          can_edit_audits: formData.can_edit_audits,
          can_delete_audits: formData.can_delete_audits,
          can_approve_reports: formData.can_approve_reports,
          can_manage_users: formData.can_manage_users,
          can_manage_departments: formData.can_manage_departments,
          can_view_analytics: formData.can_view_analytics,
          can_export_data: formData.can_export_data,
          can_create_risks: formData.can_create_risks,
          can_assess_risks: formData.can_assess_risks,
          can_approve_risk_treatments: formData.can_approve_risk_treatments,
          can_create_capa: formData.can_create_capa,
          can_assign_capa: formData.can_assign_capa,
          can_close_capa: formData.can_close_capa,
          can_upload_documents: formData.can_upload_documents,
          can_approve_documents: formData.can_approve_documents,
          can_archive_documents: formData.can_archive_documents,
          can_manage_assets: formData.can_manage_assets,
          can_assign_assets: formData.can_assign_assets,
          can_manage_vendors: formData.can_manage_vendors,
          can_evaluate_vendors: formData.can_evaluate_vendors
        }
      };
      
      if (showEditModal && selectedRole) {
        // Update existing role - would need update API endpoint
        console.log('Updating role:', selectedRole.id, roleData);
      } else {
        // Create new role
        await rbacApi.createRoleMatrix(roleData);
      }
      
      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedRole(null);
      
      // Reset form
      setFormData({
        role_name: '',
        role_description: '',
        role_category: 'business',
        is_global_role: false,
        can_create_audits: false,
        can_view_all_audits: false,
        can_view_assigned_audits: true,
        can_edit_audits: false,
        can_delete_audits: false,
        can_approve_reports: false,
        can_manage_users: false,
        can_manage_departments: false,
        can_view_analytics: false,
        can_export_data: false,
        can_create_risks: false,
        can_assess_risks: false,
        can_approve_risk_treatments: false,
        can_create_capa: false,
        can_assign_capa: false,
        can_close_capa: false,
        can_upload_documents: false,
        can_approve_documents: false,
        can_archive_documents: false,
        can_manage_assets: false,
        can_assign_assets: false,
        can_manage_vendors: false,
        can_evaluate_vendors: false
      });
      
      await loadRoles();
    } catch (err: any) {
      console.error('Error saving role:', err);
      // Extract error message from API response
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to save role';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    try {
      // For now, we'll just deactivate the role since there's no delete API
      // In a full implementation, you would call a delete or deactivate API
      console.log('Deactivating role:', roleId);
      setError('Role deletion not yet implemented - contact administrator');
    } catch (err: any) {
      console.error('Error deleting role:', err);
      setError('Failed to delete role');
    }
  };

  const filteredRoles = roles.filter(role =>
    role.role_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.role_description && role.role_description.toLowerCase().includes(searchTerm.toLowerCase()))
  ).filter(role => 
    !categoryFilter || role.role_category === categoryFilter
  );

  const getCategoryBadgeColor = (category?: string) => {
    switch (category) {
      case 'system': return 'bg-red-100 text-red-800';
      case 'audit': return 'bg-blue-100 text-blue-800';
      case 'business': return 'bg-green-100 text-green-800';
      case 'compliance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const countPermissions = (role: RoleMatrix) => {
    const permissions = [
      'can_create_audits', 'can_view_all_audits', 'can_edit_audits', 'can_delete_audits',
      'can_approve_reports', 'can_manage_users', 'can_manage_departments', 'can_view_analytics',
      'can_export_data', 'can_create_risks', 'can_assess_risks', 'can_approve_risk_treatments',
      'can_create_capa', 'can_assign_capa', 'can_close_capa', 'can_upload_documents',
      'can_approve_documents', 'can_archive_documents', 'can_manage_assets', 'can_assign_assets',
      'can_manage_vendors', 'can_evaluate_vendors'
    ];
    
    return permissions.filter(permission => role[permission as keyof RoleMatrix]).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Matrix Management</h1>
          <p className="text-gray-600 mt-2">Manage user roles and access control permissions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Role
        </Button>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-xs text-muted-foreground">
              Active: {roles.filter(r => r.is_active).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Roles</CardTitle>
            <Lock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles.filter(r => r.role_category === 'system').length}
            </div>
            <p className="text-xs text-muted-foreground">
              High privilege roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Roles</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles.filter(r => r.is_global_role).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Cross-department access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Roles</CardTitle>
            <Eye className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles.filter(r => r.role_category === 'audit').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Audit-specific roles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="audit">Audit</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Roles ({filteredRoles.length})</CardTitle>
          <CardDescription>
            Manage user roles and their associated permissions for access control
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Role Name</th>
                  <th className="text-left p-4 font-medium">Category</th>
                  <th className="text-left p-4 font-medium">Scope</th>
                  <th className="text-left p-4 font-medium">Permissions</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{role.role_name}</div>
                        {role.role_description && (
                          <div className="text-sm text-gray-500">{role.role_description}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getCategoryBadgeColor(role.role_category)}>
                        {role.role_category}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={role.is_global_role ? "default" : "outline"}>
                        {role.is_global_role ? 'Global' : 'Department'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{countPermissions(role)}</span>
                        <span className="text-sm text-gray-500">permissions</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={role.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {role.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRole(role);
                            setShowViewModal(true);
                          }}
                          title="View role details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Pre-fill form data with selected role values
                            setFormData({
                              role_name: role.role_name,
                              role_description: role.role_description || '',
                              role_category: role.role_category || 'business',
                              is_global_role: role.is_global_role,
                              can_create_audits: role.can_create_audits,
                              can_view_all_audits: role.can_view_all_audits,
                              can_view_assigned_audits: role.can_view_assigned_audits,
                              can_edit_audits: role.can_edit_audits,
                              can_delete_audits: role.can_delete_audits,
                              can_approve_reports: role.can_approve_reports,
                              can_manage_users: role.can_manage_users,
                              can_manage_departments: role.can_manage_departments,
                              can_view_analytics: role.can_view_analytics,
                              can_export_data: role.can_export_data,
                              can_create_risks: role.can_create_risks,
                              can_assess_risks: role.can_assess_risks,
                              can_approve_risk_treatments: role.can_approve_risk_treatments,
                              can_create_capa: role.can_create_capa,
                              can_assign_capa: role.can_assign_capa,
                              can_close_capa: role.can_close_capa,
                              can_upload_documents: role.can_upload_documents,
                              can_approve_documents: role.can_approve_documents,
                              can_archive_documents: role.can_archive_documents,
                              can_manage_assets: role.can_manage_assets,
                              can_assign_assets: role.can_assign_assets,
                              can_manage_vendors: role.can_manage_vendors,
                              can_evaluate_vendors: role.can_evaluate_vendors
                            });
                            setSelectedRole(role);
                            setShowEditModal(true);
                          }}
                          title="Edit role"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRole(role.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete role"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRoles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No roles found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Role Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {showEditModal ? 'Edit Role' : 'Create New Role'}
              </h2>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedRole(null);
                }}
              >
                ✕
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role Name *
                    </label>
                    <Input
                      value={formData.role_name}
                      onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                      placeholder="Enter role name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <Select
                      value={formData.role_category}
                      onValueChange={(value) => setFormData({ ...formData, role_category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="audit">Audit</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.role_description}
                    onChange={(e) => setFormData({ ...formData, role_description: e.target.value })}
                    placeholder="Enter role description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_global_role"
                    checked={formData.is_global_role}
                    onChange={(e) => setFormData({ ...formData, is_global_role: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="is_global_role" className="text-sm font-medium text-gray-700">
                    Global Role (applies across all departments)
                  </label>
                </div>

                {/* Permissions Grid */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Permissions</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Audit Permissions */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">Audit Management</h4>
                      <div className="space-y-2">
                        {[
                          { key: 'can_create_audits', label: 'Create Audits' },
                          { key: 'can_view_all_audits', label: 'View All Audits' },
                          { key: 'can_view_assigned_audits', label: 'View Assigned Audits' },
                          { key: 'can_edit_audits', label: 'Edit Audits' },
                          { key: 'can_delete_audits', label: 'Delete Audits' },
                          { key: 'can_approve_reports', label: 'Approve Reports' }
                        ].map(permission => (
                          <div key={permission.key} className="flex items-center">
                            <input
                              type="checkbox"
                              id={permission.key}
                              checked={formData[permission.key as keyof typeof formData] as boolean}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                [permission.key]: e.target.checked 
                              })}
                              className="mr-2"
                            />
                            <label htmlFor={permission.key} className="text-sm text-gray-700">
                              {permission.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* System Permissions */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">System Management</h4>
                      <div className="space-y-2">
                        {[
                          { key: 'can_manage_users', label: 'Manage Users' },
                          { key: 'can_manage_departments', label: 'Manage Departments' },
                          { key: 'can_view_analytics', label: 'View Analytics' },
                          { key: 'can_export_data', label: 'Export Data' }
                        ].map(permission => (
                          <div key={permission.key} className="flex items-center">
                            <input
                              type="checkbox"
                              id={permission.key}
                              checked={formData[permission.key as keyof typeof formData] as boolean}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                [permission.key]: e.target.checked 
                              })}
                              className="mr-2"
                            />
                            <label htmlFor={permission.key} className="text-sm text-gray-700">
                              {permission.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Risk & CAPA Permissions */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">Risk & CAPA</h4>
                      <div className="space-y-2">
                        {[
                          { key: 'can_create_risks', label: 'Create Risks' },
                          { key: 'can_assess_risks', label: 'Assess Risks' },
                          { key: 'can_approve_risk_treatments', label: 'Approve Risk Treatments' },
                          { key: 'can_create_capa', label: 'Create CAPA' },
                          { key: 'can_assign_capa', label: 'Assign CAPA' },
                          { key: 'can_close_capa', label: 'Close CAPA' }
                        ].map(permission => (
                          <div key={permission.key} className="flex items-center">
                            <input
                              type="checkbox"
                              id={permission.key}
                              checked={formData[permission.key as keyof typeof formData] as boolean}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                [permission.key]: e.target.checked 
                              })}
                              className="mr-2"
                            />
                            <label htmlFor={permission.key} className="text-sm text-gray-700">
                              {permission.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Document Permissions */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">Document Control</h4>
                      <div className="space-y-2">
                        {[
                          { key: 'can_upload_documents', label: 'Upload Documents' },
                          { key: 'can_approve_documents', label: 'Approve Documents' },
                          { key: 'can_archive_documents', label: 'Archive Documents' }
                        ].map(permission => (
                          <div key={permission.key} className="flex items-center">
                            <input
                              type="checkbox"
                              id={permission.key}
                              checked={formData[permission.key as keyof typeof formData] as boolean}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                [permission.key]: e.target.checked 
                              })}
                              className="mr-2"
                            />
                            <label htmlFor={permission.key} className="text-sm text-gray-700">
                              {permission.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Asset Permissions */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">Asset Management</h4>
                      <div className="space-y-2">
                        {[
                          { key: 'can_manage_assets', label: 'Manage Assets' },
                          { key: 'can_assign_assets', label: 'Assign Assets' }
                        ].map(permission => (
                          <div key={permission.key} className="flex items-center">
                            <input
                              type="checkbox"
                              id={permission.key}
                              checked={formData[permission.key as keyof typeof formData] as boolean}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                [permission.key]: e.target.checked 
                              })}
                              className="mr-2"
                            />
                            <label htmlFor={permission.key} className="text-sm text-gray-700">
                              {permission.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Vendor Permissions */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">Vendor Management</h4>
                      <div className="space-y-2">
                        {[
                          { key: 'can_manage_vendors', label: 'Manage Vendors' },
                          { key: 'can_evaluate_vendors', label: 'Evaluate Vendors' }
                        ].map(permission => (
                          <div key={permission.key} className="flex items-center">
                            <input
                              type="checkbox"
                              id={permission.key}
                              checked={formData[permission.key as keyof typeof formData] as boolean}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                [permission.key]: e.target.checked 
                              })}
                              className="mr-2"
                            />
                            <label htmlFor={permission.key} className="text-sm text-gray-700">
                              {permission.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setSelectedRole(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Shield className="h-4 w-4 mr-2" />
                    {showEditModal ? 'Update Role' : 'Create Role'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Role Modal */}
      {showViewModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedRole.role_name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getCategoryBadgeColor(selectedRole.role_category)}>
                    {selectedRole.role_category}
                  </Badge>
                  <Badge variant={selectedRole.is_global_role ? "default" : "outline"}>
                    {selectedRole.is_global_role ? 'Global' : 'Department'}
                  </Badge>
                  <Badge className={selectedRole.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {selectedRole.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedRole(null);
                }}
              >
                ✕
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {selectedRole.role_description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                  <p className="text-gray-900">{selectedRole.role_description}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Permissions ({countPermissions(selectedRole)} enabled)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Audit Permissions */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-3">Audit Management</h4>
                    <div className="space-y-2">
                      {[
                        { key: 'can_create_audits', label: 'Create Audits' },
                        { key: 'can_view_all_audits', label: 'View All Audits' },
                        { key: 'can_view_assigned_audits', label: 'View Assigned Audits' },
                        { key: 'can_edit_audits', label: 'Edit Audits' },
                        { key: 'can_delete_audits', label: 'Delete Audits' },
                        { key: 'can_approve_reports', label: 'Approve Reports' }
                      ].map(permission => (
                        <div key={permission.key} className="flex items-center gap-2">
                          {selectedRole[permission.key as keyof RoleMatrix] ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-300">✗</span>
                          )}
                          <span className={`text-sm ${selectedRole[permission.key as keyof RoleMatrix] ? 'text-gray-900' : 'text-gray-400'}`}>
                            {permission.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* System Permissions */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-3">System Management</h4>
                    <div className="space-y-2">
                      {[
                        { key: 'can_manage_users', label: 'Manage Users' },
                        { key: 'can_manage_departments', label: 'Manage Departments' },
                        { key: 'can_view_analytics', label: 'View Analytics' },
                        { key: 'can_export_data', label: 'Export Data' }
                      ].map(permission => (
                        <div key={permission.key} className="flex items-center gap-2">
                          {selectedRole[permission.key as keyof RoleMatrix] ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-300">✗</span>
                          )}
                          <span className={`text-sm ${selectedRole[permission.key as keyof RoleMatrix] ? 'text-gray-900' : 'text-gray-400'}`}>
                            {permission.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risk & CAPA Permissions */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-3">Risk & CAPA</h4>
                    <div className="space-y-2">
                      {[
                        { key: 'can_create_risks', label: 'Create Risks' },
                        { key: 'can_assess_risks', label: 'Assess Risks' },
                        { key: 'can_approve_risk_treatments', label: 'Approve Risk Treatments' },
                        { key: 'can_create_capa', label: 'Create CAPA' },
                        { key: 'can_assign_capa', label: 'Assign CAPA' },
                        { key: 'can_close_capa', label: 'Close CAPA' }
                      ].map(permission => (
                        <div key={permission.key} className="flex items-center gap-2">
                          {selectedRole[permission.key as keyof RoleMatrix] ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-300">✗</span>
                          )}
                          <span className={`text-sm ${selectedRole[permission.key as keyof RoleMatrix] ? 'text-gray-900' : 'text-gray-400'}`}>
                            {permission.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Document Permissions */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-3">Document Control</h4>
                    <div className="space-y-2">
                      {[
                        { key: 'can_upload_documents', label: 'Upload Documents' },
                        { key: 'can_approve_documents', label: 'Approve Documents' },
                        { key: 'can_archive_documents', label: 'Archive Documents' }
                      ].map(permission => (
                        <div key={permission.key} className="flex items-center gap-2">
                          {selectedRole[permission.key as keyof RoleMatrix] ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-300">✗</span>
                          )}
                          <span className={`text-sm ${selectedRole[permission.key as keyof RoleMatrix] ? 'text-gray-900' : 'text-gray-400'}`}>
                            {permission.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Asset Permissions */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-3">Asset Management</h4>
                    <div className="space-y-2">
                      {[
                        { key: 'can_manage_assets', label: 'Manage Assets' },
                        { key: 'can_assign_assets', label: 'Assign Assets' }
                      ].map(permission => (
                        <div key={permission.key} className="flex items-center gap-2">
                          {selectedRole[permission.key as keyof RoleMatrix] ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-300">✗</span>
                          )}
                          <span className={`text-sm ${selectedRole[permission.key as keyof RoleMatrix] ? 'text-gray-900' : 'text-gray-400'}`}>
                            {permission.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vendor Permissions */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-3">Vendor Management</h4>
                    <div className="space-y-2">
                      {[
                        { key: 'can_manage_vendors', label: 'Manage Vendors' },
                        { key: 'can_evaluate_vendors', label: 'Evaluate Vendors' }
                      ].map(permission => (
                        <div key={permission.key} className="flex items-center gap-2">
                          {selectedRole[permission.key as keyof RoleMatrix] ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-300">✗</span>
                          )}
                          <span className={`text-sm ${selectedRole[permission.key as keyof RoleMatrix] ? 'text-gray-900' : 'text-gray-400'}`}>
                            {permission.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 mt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedRole(null);
                  }}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setShowViewModal(false);
                    // Pre-fill form data with selected role values
                    setFormData({
                      role_name: selectedRole.role_name,
                      role_description: selectedRole.role_description || '',
                      role_category: selectedRole.role_category || 'business',
                      is_global_role: selectedRole.is_global_role,
                      can_create_audits: selectedRole.can_create_audits,
                      can_view_all_audits: selectedRole.can_view_all_audits,
                      can_view_assigned_audits: selectedRole.can_view_assigned_audits,
                      can_edit_audits: selectedRole.can_edit_audits,
                      can_delete_audits: selectedRole.can_delete_audits,
                      can_approve_reports: selectedRole.can_approve_reports,
                      can_manage_users: selectedRole.can_manage_users,
                      can_manage_departments: selectedRole.can_manage_departments,
                      can_view_analytics: selectedRole.can_view_analytics,
                      can_export_data: selectedRole.can_export_data,
                      can_create_risks: selectedRole.can_create_risks,
                      can_assess_risks: selectedRole.can_assess_risks,
                      can_approve_risk_treatments: selectedRole.can_approve_risk_treatments,
                      can_create_capa: selectedRole.can_create_capa,
                      can_assign_capa: selectedRole.can_assign_capa,
                      can_close_capa: selectedRole.can_close_capa,
                      can_upload_documents: selectedRole.can_upload_documents,
                      can_approve_documents: selectedRole.can_approve_documents,
                      can_archive_documents: selectedRole.can_archive_documents,
                      can_manage_assets: selectedRole.can_manage_assets,
                      can_assign_assets: selectedRole.can_assign_assets,
                      can_manage_vendors: selectedRole.can_manage_vendors,
                      can_evaluate_vendors: selectedRole.can_evaluate_vendors
                    });
                    setShowEditModal(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Role
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}