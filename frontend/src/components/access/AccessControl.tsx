'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { rbacApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface AccessControlContextType {
  hasPermission: (permission: string) => boolean;
  hasAuditAccess: (auditId: string) => Promise<boolean>;
  canAccessResource: (resourceType: string, resourceId?: string) => Promise<boolean>;
  userRole: string | null;
  departmentId: string | null;
  isAdmin: boolean;
  isAuditManager: boolean;
  isAuditor: boolean;
  checkingAccess: boolean;
}

const AccessControlContext = createContext<AccessControlContextType | null>(null);

export const useAccessControl = () => {
  const context = useContext(AccessControlContext);
  if (!context) {
    throw new Error('useAccessControl must be used within an AccessControlProvider');
  }
  return context;
};

interface AccessControlProviderProps {
  children: React.ReactNode;
}

export const AccessControlProvider: React.FC<AccessControlProviderProps> = ({ children }) => {
  const { user } = useAuthStore();
  const [checkingAccess, setCheckingAccess] = useState(false);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Basic role-based permissions
    const rolePermissions: Record<string, string[]> = {
      system_admin: [
        'can_create_audits', 'can_view_all_audits', 'can_edit_audits', 
        'can_delete_audits', 'can_approve_reports', 'can_manage_users',
        'can_manage_departments', 'can_view_analytics', 'can_export_data',
        'can_create_risks', 'can_assess_risks', 'can_approve_risk_treatments',
        'can_create_capa', 'can_assign_capa', 'can_close_capa',
        'can_upload_documents', 'can_approve_documents', 'can_archive_documents',
        'can_manage_assets', 'can_assign_assets', 'can_manage_vendors', 'can_evaluate_vendors'
      ],
      audit_manager: [
        'can_create_audits', 'can_view_assigned_audits', 'can_edit_audits',
        'can_approve_reports', 'can_view_analytics', 'can_export_data',
        'can_create_risks', 'can_assess_risks', 'can_create_capa', 'can_assign_capa',
        'can_upload_documents', 'can_manage_assets'
      ],
      auditor: [
        'can_view_assigned_audits', 'can_create_risks', 'can_assess_risks',
        'can_create_capa', 'can_upload_documents'
      ],
      department_head: [
        'can_view_assigned_audits', 'can_view_analytics', 'can_upload_documents',
        'can_manage_assets'
      ],
      department_officer: [
        'can_view_assigned_audits', 'can_upload_documents'
      ],
      viewer: [
        'can_view_assigned_audits'
      ]
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission);
  };

  const hasAuditAccess = async (auditId: string): Promise<boolean> => {
    try {
      setCheckingAccess(true);
      const result = await rbacApi.checkAccess({
        resource_type: 'audit',
        resource_id: auditId
      });
      return result.has_access;
    } catch (error) {
      console.error('Error checking audit access:', error);
      return false;
    } finally {
      setCheckingAccess(false);
    }
  };

  const canAccessResource = async (resourceType: string, resourceId?: string): Promise<boolean> => {
    try {
      setCheckingAccess(true);
      const result = await rbacApi.checkAccess({
        resource_type: resourceType,
        resource_id: resourceId
      });
      return result.has_access;
    } catch (error) {
      console.error('Error checking resource access:', error);
      return false;
    } finally {
      setCheckingAccess(false);
    }
  };

  const contextValue: AccessControlContextType = {
    hasPermission,
    hasAuditAccess,
    canAccessResource,
    userRole: user?.role || null,
    departmentId: user?.department_id || null,
    isAdmin: user?.role === 'system_admin',
    isAuditManager: user?.role === 'audit_manager',
    isAuditor: user?.role === 'auditor',
    checkingAccess
  };

  return (
    <AccessControlContext.Provider value={contextValue}>
      {children}
    </AccessControlContext.Provider>
  );
};

// Higher-order component for protecting routes/components
interface ProtectedComponentProps {
  children: React.ReactNode;
  permission?: string;
  role?: string;
  fallback?: React.ReactNode;
  auditId?: string;
}

export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  children,
  permission,
  role,
  fallback = null,
  auditId
}) => {
  const { hasPermission, hasAuditAccess, userRole, checkingAccess } = useAccessControl();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      let access = true;

      // Check role requirement
      if (role && userRole !== role) {
        access = false;
      }

      // Check permission requirement
      if (permission && !hasPermission(permission)) {
        access = false;
      }

      // Check audit access requirement
      if (auditId && access) {
        access = await hasAuditAccess(auditId);
      }

      setHasAccess(access);
    };

    checkAccess();
  }, [permission, role, auditId, userRole, hasPermission, hasAuditAccess]);

  if (checkingAccess || hasAccess === null) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Checking access...</span>
      </div>
    );
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Component for conditional rendering based on permissions
interface ConditionalRenderProps {
  children: React.ReactNode;
  permission?: string;
  role?: string;
  auditId?: string;
  fallback?: React.ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  children,
  permission,
  role,
  auditId,
  fallback = null
}) => {
  return (
    <ProtectedComponent
      permission={permission}
      role={role}
      auditId={auditId}
      fallback={fallback}
    >
      {children}
    </ProtectedComponent>
  );
};

// Hook for checking specific permissions
export const usePermission = (permission: string) => {
  const { hasPermission } = useAccessControl();
  return hasPermission(permission);
};

// Hook for checking audit access
export const useAuditAccess = (auditId: string) => {
  const { hasAuditAccess } = useAccessControl();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      try {
        const access = await hasAuditAccess(auditId);
        setHasAccess(access);
      } catch (error) {
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    if (auditId) {
      checkAccess();
    }
  }, [auditId, hasAuditAccess]);

  return { hasAccess, loading };
};

// Component for role-based navigation items
interface RoleBasedNavItemProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
  className?: string;
}

export const RoleBasedNavItem: React.FC<RoleBasedNavItemProps> = ({
  children,
  requiredRole,
  requiredPermission,
  className = ''
}) => {
  const { userRole, hasPermission } = useAccessControl();

  // Check role requirement
  if (requiredRole && userRole !== requiredRole) {
    return null;
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  return <div className={className}>{children}</div>;
};

// Access denied component
export const AccessDenied: React.FC<{ message?: string }> = ({ 
  message = "You don't have permission to access this resource." 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-5V9m0 0V7m0 2h2m-2 0H10" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
      <p className="text-gray-600 max-w-md">{message}</p>
    </div>
  );
};

export default AccessControlProvider;