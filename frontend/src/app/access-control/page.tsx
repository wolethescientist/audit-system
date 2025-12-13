'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, Users, Eye, Settings, UserPlus, Building, 
  Lock, Unlock, CheckCircle, AlertCircle 
} from 'lucide-react';

// Import access control components
import { AccessControlProvider, useAccessControl, ProtectedComponent } from '@/components/access/AccessControl';
import TeamAssignment from '@/components/access/TeamAssignment';
import UserManagement from '@/components/access/UserManagement';
import AuditVisibility from '@/components/access/AuditVisibility';
import RoleMatrix from '@/components/access/RoleMatrix';

const AccessControlPage: React.FC = () => {
  const [selectedAuditId, setSelectedAuditId] = useState<string>('');

  return (
    <AccessControlProvider>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Access Control Management
          </h1>
          <p className="text-gray-600">
            Enhanced Role-Based Access Control (RBAC) system with ISO compliance features
          </p>
        </div>

        {/* Access Control Overview */}
        <AccessControlOverview />

        {/* Main Content Tabs */}
        <Tabs defaultValue="team-assignment" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="team-assignment" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Team Assignment
            </TabsTrigger>
            <TabsTrigger value="user-management" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="audit-visibility" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Audit Visibility
            </TabsTrigger>
            <TabsTrigger value="role-matrix" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role Matrix
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team-assignment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Multi-Auditor Team Assignment
                </CardTitle>
                <CardDescription>
                  Assign audit teams with competency validation per ISO 19011 requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProtectedComponent permission="can_create_audits">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium">Select Audit ID for Demo:</label>
                      <input
                        type="text"
                        placeholder="Enter audit ID"
                        value={selectedAuditId}
                        onChange={(e) => setSelectedAuditId(e.target.value)}
                        className="px-3 py-2 border rounded-md"
                      />
                    </div>
                    
                    {selectedAuditId && (
                      <TeamAssignment 
                        auditId={selectedAuditId}
                        onTeamUpdated={() => console.log('Team updated')}
                      />
                    )}
                    
                    {!selectedAuditId && (
                      <div className="text-center py-8 text-gray-500">
                        <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Enter an audit ID to manage team assignments</p>
                      </div>
                    )}
                  </div>
                </ProtectedComponent>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user-management" className="space-y-6">
            <ProtectedComponent permission="can_manage_users">
              <UserManagement onUserUpdated={() => console.log('User updated')} />
            </ProtectedComponent>
          </TabsContent>

          <TabsContent value="audit-visibility" className="space-y-6">
            <AuditVisibility onVisibilityChanged={() => console.log('Visibility changed')} />
          </TabsContent>

          <TabsContent value="role-matrix" className="space-y-6">
            <ProtectedComponent permission="can_manage_users">
              <RoleMatrix />
            </ProtectedComponent>
          </TabsContent>
        </Tabs>
      </div>
    </AccessControlProvider>
  );
};

// Access Control Overview Component
const AccessControlOverview: React.FC = () => {
  const { userRole, isAdmin, isAuditManager, isAuditor, departmentId } = useAccessControl();

  const getAccessLevelBadge = () => {
    if (isAdmin) {
      return <Badge className="bg-red-100 text-red-800">System Administrator</Badge>;
    } else if (isAuditManager) {
      return <Badge className="bg-purple-100 text-purple-800">Audit Manager</Badge>;
    } else if (isAuditor) {
      return <Badge className="bg-blue-100 text-blue-800">Auditor</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">{userRole?.replace('_', ' ')}</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Current User Access Level */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Your Access Level</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {getAccessLevelBadge()}
            <p className="text-xs text-muted-foreground">
              Current role permissions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ISO Compliance Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ISO Compliance</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Badge className="bg-green-100 text-green-800">Compliant</Badge>
            <p className="text-xs text-muted-foreground">
              ISO 27001 A.9.2.2 RBAC
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Segregation of Duties */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Segregation of Duties</CardTitle>
          <Lock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Badge className="bg-blue-100 text-blue-800">Enforced</Badge>
            <p className="text-xs text-muted-foreground">
              ISO 27001 A.6.1.2
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Audit Trail</CardTitle>
          <Eye className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Badge className="bg-purple-100 text-purple-800">Active</Badge>
            <p className="text-xs text-muted-foreground">
              ISO 27001 A.12.4.1
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessControlPage;