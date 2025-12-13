'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, UserPlus, Shield, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { rbacApi, api } from '@/lib/api';

interface TeamMember {
  user_id: string;
  role_in_audit: string;
  user_details?: {
    full_name: string;
    email: string;
    role: string;
  };
}

interface TeamAssignmentProps {
  auditId: string;
  onTeamUpdated?: () => void;
  readOnly?: boolean;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department_id?: string;
}

const TeamAssignment: React.FC<TeamAssignmentProps> = ({ 
  auditId, 
  onTeamUpdated,
  readOnly = false 
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [leadAuditor, setLeadAuditor] = useState<any>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('auditor');
  const [selectedLeadAuditor, setSelectedLeadAuditor] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [teamCompetencyVerified, setTeamCompetencyVerified] = useState(false);

  const auditRoles = [
    { value: 'auditor', label: 'Auditor' },
    { value: 'senior_auditor', label: 'Senior Auditor' },
    { value: 'technical_specialist', label: 'Technical Specialist' },
    { value: 'observer', label: 'Observer' },
    { value: 'trainee', label: 'Trainee Auditor' }
  ];

  useEffect(() => {
    loadTeamData();
    loadAvailableUsers();
  }, [auditId]);

  const loadTeamData = async () => {
    try {
      const teamData = await rbacApi.getAuditTeam(auditId);
      setTeamMembers(teamData.team_members || []);
      setLeadAuditor(teamData.lead_auditor);
      setTeamCompetencyVerified(teamData.team_competency_verified || false);
    } catch (err) {
      console.error('Error loading team data:', err);
      setError('Failed to load team data');
    }
  };

  const loadAvailableUsers = async () => {
    try {
      // Get users with auditor roles
      const response = await api.get('/api/v1/users/');
      const users = response.data.filter((user: User) => 
        ['auditor', 'audit_manager'].includes(user.role) && user.id !== leadAuditor?.id
      );
      setAvailableUsers(users);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load available users');
    }
  };

  const handleAssignTeam = async () => {
    if (!selectedUser && !selectedLeadAuditor) {
      setError('Please select at least one team member or lead auditor');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const assignmentData = {
        audit_id: auditId,
        team_members: selectedUser ? [{
          user_id: selectedUser,
          role_in_audit: selectedRole
        }] : [],
        lead_auditor_id: selectedLeadAuditor || undefined
      };

      const result = await rbacApi.assignAuditTeam(assignmentData);
      
      setSuccess(`Successfully assigned ${result.assigned_members} team member(s)`);
      
      // Reset form
      setSelectedUser('');
      setSelectedLeadAuditor('');
      setSelectedRole('auditor');
      
      // Reload team data
      await loadTeamData();
      await loadAvailableUsers();
      
      if (onTeamUpdated) {
        onTeamUpdated();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to assign team members');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    try {
      // This would require an API endpoint to remove team members
      // For now, we'll show a placeholder
      setError('Remove team member functionality not yet implemented');
    } catch (err) {
      setError('Failed to remove team member');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'lead_auditor':
        return 'bg-purple-100 text-purple-800';
      case 'senior_auditor':
        return 'bg-blue-100 text-blue-800';
      case 'auditor':
        return 'bg-green-100 text-green-800';
      case 'technical_specialist':
        return 'bg-orange-100 text-orange-800';
      case 'observer':
        return 'bg-gray-100 text-gray-800';
      case 'trainee':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'audit_manager':
        return 'bg-indigo-100 text-indigo-800';
      case 'auditor':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Assignment Form */}
      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Assign Audit Team
            </CardTitle>
            <CardDescription>
              Assign auditors to the audit team with appropriate roles per ISO 19011 requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {/* Lead Auditor Assignment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Lead Auditor</label>
              <Select value={selectedLeadAuditor} onValueChange={setSelectedLeadAuditor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lead auditor" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <span>{user.full_name}</span>
                        <Badge className={getUserRoleBadgeColor(user.role)}>
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Team Member Assignment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Team Member</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <span>{user.full_name}</span>
                          <Badge className={getUserRoleBadgeColor(user.role)}>
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role in Audit</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {auditRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleAssignTeam} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Assigning...' : 'Assign Team'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Team Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current Audit Team
          </CardTitle>
          <CardDescription>
            ISO 19011 compliant audit team with verified competencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Lead Auditor */}
          {leadAuditor && (
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-2">Lead Auditor</h4>
              <div className="flex items-center justify-between p-3 border rounded-lg bg-purple-50">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-medium">{leadAuditor.full_name}</div>
                    <div className="text-sm text-gray-600">{leadAuditor.email}</div>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">
                    Lead Auditor
                  </Badge>
                  <Badge className={getUserRoleBadgeColor(leadAuditor.role)}>
                    {leadAuditor.role?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Team Members */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Team Members ({teamMembers.length})</h4>
            
            {teamMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No team members assigned yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">
                          {member.user_details?.full_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {member.user_details?.email}
                        </div>
                      </div>
                      <Badge className={getRoleBadgeColor(member.role_in_audit)}>
                        {member.role_in_audit.replace('_', ' ')}
                      </Badge>
                      {member.user_details?.role && (
                        <Badge className={getUserRoleBadgeColor(member.user_details.role)}>
                          {member.user_details.role.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTeamMember(member.user_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Competency Verification Status */}
          <div className="mt-6 p-3 border rounded-lg bg-gray-50">
            <div className="flex items-center gap-2">
              {teamCompetencyVerified ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Team competency verified per ISO 19011 requirements
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Team competency verification pending
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Team Statistics */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-2 bg-blue-50 rounded">
              <div className="text-lg font-semibold text-blue-800">
                {(leadAuditor ? 1 : 0) + teamMembers.length}
              </div>
              <div className="text-xs text-blue-600">Total Team Size</div>
            </div>
            <div className="p-2 bg-green-50 rounded">
              <div className="text-lg font-semibold text-green-800">
                {teamMembers.filter(m => m.role_in_audit === 'auditor').length}
              </div>
              <div className="text-xs text-green-600">Auditors</div>
            </div>
            <div className="p-2 bg-purple-50 rounded">
              <div className="text-lg font-semibold text-purple-800">
                {teamMembers.filter(m => m.role_in_audit === 'senior_auditor').length}
              </div>
              <div className="text-xs text-purple-600">Senior Auditors</div>
            </div>
            <div className="p-2 bg-orange-50 rounded">
              <div className="text-lg font-semibold text-orange-800">
                {teamMembers.filter(m => m.role_in_audit === 'technical_specialist').length}
              </div>
              <div className="text-xs text-orange-600">Specialists</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamAssignment;