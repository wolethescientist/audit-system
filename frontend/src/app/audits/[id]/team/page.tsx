'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Users, UserPlus, Trash2, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import AuditNavigation from '@/components/audit/AuditNavigation';

interface TeamMember {
  user_id: string;
  role_in_audit: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
}

interface AuditTeamAssignment {
  lead_auditor_id: string;
  team_members: TeamMember[];
}

export default function AuditTeamPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;

  const [audit, setAudit] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [currentTeam, setCurrentTeam] = useState<any[]>([]);
  const [teamAssignment, setTeamAssignment] = useState<AuditTeamAssignment>({
    lead_auditor_id: '',
    team_members: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAuditDetails();
    fetchUsers();
    fetchCurrentTeam();
  }, [auditId]);

  const fetchAuditDetails = async () => {
    try {
      const response = await api.get(`/audits/${auditId}`);
      setAudit(response.data);
      
      if (response.data.lead_auditor_id) {
        setTeamAssignment(prev => ({
          ...prev,
          lead_auditor_id: response.data.lead_auditor_id
        }));
      }
    } catch (err) {
      setError('Failed to fetch audit details');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      // Filter to only show users with audit roles
      const auditUsers = response.data.filter((user: any) => 
        ['audit_manager', 'auditor'].includes(user.role)
      );
      setUsers(auditUsers);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchCurrentTeam = async () => {
    try {
      const response = await api.get(`/audits/${auditId}/team`);
      setCurrentTeam(response.data);
      
      // Populate team assignment with current team
      const teamMembers = response.data.map((member: any) => ({
        user_id: member.user_id,
        role_in_audit: member.role_in_audit
      }));
      
      setTeamAssignment(prev => ({
        ...prev,
        team_members: teamMembers
      }));
    } catch (err) {
      console.error('Failed to fetch current team:', err);
    }
  };

  const handleLeadAuditorChange = (userId: string) => {
    setTeamAssignment(prev => ({
      ...prev,
      lead_auditor_id: userId
    }));
  };

  const addTeamMember = () => {
    setTeamAssignment(prev => ({
      ...prev,
      team_members: [
        ...prev.team_members,
        { user_id: '', role_in_audit: 'auditor' }
      ]
    }));
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    setTeamAssignment(prev => ({
      ...prev,
      team_members: prev.team_members.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    }));
  };

  const removeTeamMember = (index: number) => {
    setTeamAssignment(prev => ({
      ...prev,
      team_members: prev.team_members.filter((_, i) => i !== index)
    }));
  };

  const handleAssignTeam = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate team assignment
      if (!teamAssignment.lead_auditor_id) {
        throw new Error('Lead auditor must be assigned');
      }

      // Filter out incomplete team members
      const validTeamMembers = teamAssignment.team_members.filter(
        member => member.user_id && member.role_in_audit
      );

      const assignmentData = {
        lead_auditor_id: teamAssignment.lead_auditor_id,
        team_members: validTeamMembers
      };

      await api.post(`/audits/${auditId}/assign-team`, assignmentData);
      setSuccess('Audit team assigned successfully with competency verification per ISO 19011');
      
      // Refresh data
      await fetchAuditDetails();
      await fetchCurrentTeam();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to assign team');
    } finally {
      setLoading(false);
    }
  };

  const getUserById = (userId: string) => {
    return users.find(user => user.id === userId);
  };

  const getAvailableUsers = (excludeUserId?: string) => {
    const assignedUserIds = new Set([
      teamAssignment.lead_auditor_id,
      ...teamAssignment.team_members.map(m => m.user_id)
    ]);
    
    return users.filter(user => 
      !assignedUserIds.has(user.id) || user.id === excludeUserId
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'audit_manager': return 'bg-purple-100 text-purple-800';
      case 'auditor': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!audit) {
    return <div className="p-6">Loading audit details...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <AuditNavigation auditId={auditId} audit={audit} />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Audit Team Assignment</h2>
          <p className="text-gray-600 mt-1">ISO 19011 Clause 6.2 - Audit team assignment with competency validation</p>
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

      {/* Current Team Status */}
      {currentTeam.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {audit.lead_auditor_id && (
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Lead Auditor</p>
                      <p className="text-sm text-gray-600">
                        {getUserById(audit.lead_auditor_id)?.full_name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">Lead</Badge>
                </div>
              )}
              
              {currentTeam.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium">{member.user?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{member.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getRoleBadgeColor(member.user?.role)}>
                      {member.user?.role?.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">
                      {member.role_in_audit}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead Auditor Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Lead Auditor Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="lead-auditor">Lead Auditor *</Label>
              <Select
                value={teamAssignment.lead_auditor_id}
                onValueChange={handleLeadAuditorChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lead auditor" />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(user => user.role === 'audit_manager' || user.role === 'auditor').map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <span>{user.full_name}</span>
                        <Badge className={getRoleBadgeColor(user.role)} variant="secondary">
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Lead auditor must have appropriate competency per ISO 19011 Clause 7.2
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamAssignment.team_members.map((member, index) => (
              <div key={index} className="flex items-end gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <Label htmlFor={`member-${index}`}>Team Member</Label>
                  <Select
                    value={member.user_id}
                    onValueChange={(value) => updateTeamMember(index, 'user_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableUsers(member.user_id).map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <span>{user.full_name}</span>
                            <Badge className={getRoleBadgeColor(user.role)} variant="secondary">
                              {user.role.replace('_', ' ')}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-48">
                  <Label htmlFor={`role-${index}`}>Role in Audit</Label>
                  <Select
                    value={member.role_in_audit}
                    onValueChange={(value) => updateTeamMember(index, 'role_in_audit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auditor">Auditor</SelectItem>
                      <SelectItem value="technical_expert">Technical Expert</SelectItem>
                      <SelectItem value="observer">Observer</SelectItem>
                      <SelectItem value="guide">Guide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeTeamMember(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addTeamMember}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Competency Verification Notice */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>ISO 19011 Competency Requirements:</strong> All assigned team members will be verified for appropriate competency including knowledge of audit principles, methods, and relevant technical areas per Clause 7.2.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/audits/${auditId}`)}
        >
          Cancel
        </Button>
        <Button
          onClick={handleAssignTeam}
          disabled={loading || !teamAssignment.lead_auditor_id}
        >
          {loading ? 'Assigning Team...' : 'Assign Team'}
        </Button>
      </div>
    </div>
  );
}