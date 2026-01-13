'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rbacApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, CheckCircle, Circle, Info, Sparkles, 
  FileText, Users, TrendingUp, AlertTriangle, 
  FolderOpen, BarChart, Building, Package 
} from 'lucide-react';

interface PermissionGroup {
  label: string;
  description: string;
  permissions: string[];
}

interface RoleTemplate {
  name: string;
  description: string;
  permission_groups: string[];
}

interface SimplifiedPermissionsProps {
  selectedGroups?: string[];
  onGroupsChange?: (groups: string[]) => void;
  readOnly?: boolean;
}

const SimplifiedPermissions: React.FC<SimplifiedPermissionsProps> = ({
  selectedGroups = [],
  onGroupsChange,
  readOnly = false
}) => {
  const [localSelectedGroups, setLocalSelectedGroups] = useState<string[]>(selectedGroups);
  const [showTemplates, setShowTemplates] = useState(false);

  // Fetch permission groups
  const { data: permissionGroups = {}, isLoading: loadingGroups } = useQuery<Record<string, PermissionGroup>>({
    queryKey: ['permission-groups'],
    queryFn: async () => {
      const response = await rbacApi.getPermissionGroups();
      return response;
    }
  });

  // Fetch role templates
  const { data: roleTemplates = {}, isLoading: loadingTemplates } = useQuery<Record<string, RoleTemplate>>({
    queryKey: ['role-templates'],
    queryFn: async () => {
      const response = await rbacApi.getRoleTemplates();
      return response;
    }
  });

  useEffect(() => {
    setLocalSelectedGroups(selectedGroups);
  }, [selectedGroups]);

  const handleGroupToggle = (groupKey: string) => {
    if (readOnly) return;

    const newGroups = localSelectedGroups.includes(groupKey)
      ? localSelectedGroups.filter(g => g !== groupKey)
      : [...localSelectedGroups, groupKey];
    
    setLocalSelectedGroups(newGroups);
    onGroupsChange?.(newGroups);
  };

  const applyTemplate = (templateKey: string) => {
    if (readOnly) return;

    const template = roleTemplates[templateKey];
    if (template) {
      setLocalSelectedGroups(template.permission_groups);
      onGroupsChange?.(template.permission_groups);
      setShowTemplates(false);
    }
  };

  const clearAll = () => {
    if (readOnly) return;
    setLocalSelectedGroups([]);
    onGroupsChange?.([]);
  };

  // Icon mapping for permission groups
  const getGroupIcon = (groupKey: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      audit_management: <Shield className="w-5 h-5 text-blue-600" />,
      findings_and_followups: <AlertTriangle className="w-5 h-5 text-orange-600" />,
      risk_management: <TrendingUp className="w-5 h-5 text-red-600" />,
      capa_management: <CheckCircle className="w-5 h-5 text-green-600" />,
      document_management: <FolderOpen className="w-5 h-5 text-purple-600" />,
      reporting_and_analytics: <BarChart className="w-5 h-5 text-indigo-600" />,
      user_management: <Users className="w-5 h-5 text-pink-600" />,
      asset_and_vendor_management: <Package className="w-5 h-5 text-teal-600" />
    };
    return iconMap[groupKey] || <Circle className="w-5 h-5 text-gray-600" />;
  };

  if (loadingGroups) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading permission groups...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Assign Permissions
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Select functional areas to grant access. Hover over each area for details.
          </p>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Quick Templates
            </Button>
            {localSelectedGroups.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
              >
                Clear All
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Quick Templates */}
      {showTemplates && !readOnly && (
        <Alert>
          <Sparkles className="w-4 h-4" />
          <AlertDescription>
            <div className="mt-2">
              <p className="text-sm font-medium mb-3">Quick Role Templates</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(roleTemplates).map(([key, template]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(key)}
                    className="justify-start text-left h-auto py-2"
                  >
                    <div>
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-gray-500">{template.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Permission Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(permissionGroups).map(([key, group]) => {
          const isSelected = localSelectedGroups.includes(key);
          
          return (
            <Card 
              key={key}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
              } ${readOnly ? 'cursor-default' : ''}`}
              onClick={() => handleGroupToggle(key)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {isSelected ? (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getGroupIcon(key)}
                      <h4 className="font-medium text-sm">{group.label}</h4>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{group.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {group.permissions.slice(0, 3).map((permission) => (
                        <Badge 
                          key={permission} 
                          variant="outline" 
                          className="text-xs"
                        >
                          {permission.replace('can_', '').replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {group.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{group.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Summary */}
      {localSelectedGroups.length > 0 && (
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span className="text-sm">
                <strong>{localSelectedGroups.length}</strong> permission group{localSelectedGroups.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex flex-wrap gap-1">
                {localSelectedGroups.map((groupKey) => (
                  <Badge key={groupKey} className="text-xs">
                    {permissionGroups[groupKey]?.label || groupKey}
                  </Badge>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>
          Permission groups provide a simplified way to manage access control. 
          Each group contains related permissions that work together for specific functional areas.
          You can select multiple groups to create custom role combinations.
        </p>
      </div>
    </div>
  );
};

export default SimplifiedPermissions;
