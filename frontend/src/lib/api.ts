import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://audit-system-6zbi.onrender.com';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
// Document Control API Functions
export const documentApi = {
  // Upload document
  uploadDocument: async (file: File, documentData: any) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Append all document metadata
    Object.keys(documentData).forEach(key => {
      if (documentData[key] !== undefined && documentData[key] !== null) {
        formData.append(key, documentData[key]);
      }
    });

    const response = await api.post('/api/v1/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Approve/reject document
  approveDocument: async (docId: string, approvalData: any) => {
    const response = await api.put(`/api/v1/documents/${docId}/approve`, approvalData);
    return response.data;
  },

  // Get expiring documents
  getExpiringDocuments: async (daysAhead: number = 30, includeOverdue: boolean = true) => {
    const response = await api.get('/api/v1/documents/expiring', {
      params: { days_ahead: daysAhead, include_overdue: includeOverdue }
    });
    return response.data;
  },

  // Search documents
  searchDocuments: async (searchParams: any) => {
    // Filter out empty/null/undefined values to avoid validation errors
    const cleanParams: Record<string, any> = {};
    Object.keys(searchParams).forEach(key => {
      const value = searchParams[key];
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });
    
    const response = await api.get('/api/v1/documents/search', {
      params: cleanParams
    });
    return response.data;
  },

  // Get document details
  getDocument: async (docId: string) => {
    const response = await api.get(`/api/v1/documents/${docId}`);
    return response.data;
  },

  // Download document
  downloadDocument: async (docId: string) => {
    const response = await api.get(`/api/v1/documents/${docId}/download`, {
      responseType: 'blob'
    });
    return response;
  },

  // Add document tag
  addDocumentTag: async (docId: string, tagData: any) => {
    const response = await api.post(`/api/v1/documents/${docId}/tags`, tagData);
    return response.data;
  },

  // Remove document tag
  removeDocumentTag: async (docId: string, tagId: string) => {
    const response = await api.delete(`/api/v1/documents/${docId}/tags/${tagId}`);
    return response.data;
  },

  // Delete document
  deleteDocument: async (docId: string) => {
    const response = await api.delete(`/api/v1/documents/${docId}`);
    return response.data;
  },
};

// Asset Management API Functions
export const assetApi = {
  // Create asset
  createAsset: async (assetData: any) => {
    const response = await api.post('/api/v1/assets/', assetData);
    return response.data;
  },

  // Get all assets
  getAssets: async (params?: any) => {
    const response = await api.get('/api/v1/assets/', { params });
    return response.data;
  },

  // Get asset by ID
  getAsset: async (assetId: string) => {
    const response = await api.get(`/api/v1/assets/${assetId}`);
    return response.data;
  },

  // Update asset
  updateAsset: async (assetId: string, assetData: any) => {
    const response = await api.put(`/api/v1/assets/${assetId}`, assetData);
    return response.data;
  },

  // Delete asset
  deleteAsset: async (assetId: string) => {
    const response = await api.delete(`/api/v1/assets/${assetId}`);
    return response.data;
  },

  // Get asset assignments
  getAssetAssignments: async (assetId: string, includeInactive: boolean = false) => {
    const response = await api.get(`/api/v1/assets/${assetId}/assignments`, {
      params: { include_inactive: includeInactive }
    });
    return response.data;
  },

  // Assign asset
  assignAsset: async (assetId: string, assignmentData: any) => {
    const response = await api.post(`/api/v1/assets/${assetId}/assignments`, assignmentData);
    return response.data;
  },

  // Return asset
  returnAsset: async (assetId: string, assignmentId: string, returnData: any) => {
    const response = await api.put(`/api/v1/assets/${assetId}/assignments/${assignmentId}/return`, returnData);
    return response.data;
  },

  // Get asset reports
  getAssetReports: async (departmentId?: string) => {
    const response = await api.get('/api/v1/assets/reports/summary', {
      params: departmentId ? { department_id: departmentId } : {}
    });
    return response.data;
  },

  // Get asset risks
  getAssetRisks: async (assetId: string) => {
    const response = await api.get(`/api/v1/assets/${assetId}/risks`);
    return response.data;
  },
};

// Vendor Management API Functions
export const vendorApi = {
  // Create vendor
  createVendor: async (vendorData: any) => {
    const response = await api.post('/api/v1/vendors/', vendorData);
    return response.data;
  },

  // Get all vendors
  getVendors: async (params?: any) => {
    const response = await api.get('/api/v1/vendors/', { params });
    return response.data;
  },

  // Get vendor by ID
  getVendor: async (vendorId: string) => {
    const response = await api.get(`/api/v1/vendors/${vendorId}`);
    return response.data;
  },

  // Update vendor
  updateVendor: async (vendorId: string, vendorData: any) => {
    const response = await api.put(`/api/v1/vendors/${vendorId}`, vendorData);
    return response.data;
  },

  // Delete vendor
  deleteVendor: async (vendorId: string) => {
    const response = await api.delete(`/api/v1/vendors/${vendorId}`);
    return response.data;
  },

  // Get vendor evaluations
  getVendorEvaluations: async (vendorId: string, evaluationType?: string) => {
    const response = await api.get(`/api/v1/vendors/${vendorId}/evaluations`, {
      params: evaluationType ? { evaluation_type: evaluationType } : {}
    });
    return response.data;
  },

  // Create vendor evaluation
  createVendorEvaluation: async (vendorId: string, evaluationData: any) => {
    const response = await api.post(`/api/v1/vendors/${vendorId}/evaluations`, evaluationData);
    return response.data;
  },

  // Get vendor SLAs
  getVendorSLAs: async (vendorId: string, status?: string) => {
    const response = await api.get(`/api/v1/vendors/${vendorId}/slas`, {
      params: status ? { status } : {}
    });
    return response.data;
  },

  // Create vendor SLA
  createVendorSLA: async (vendorId: string, slaData: any) => {
    const response = await api.post(`/api/v1/vendors/${vendorId}/slas`, slaData);
    return response.data;
  },

  // Update vendor risk rating
  updateVendorRiskRating: async (vendorId: string, riskRating: string, riskNotes?: string) => {
    const response = await api.put(`/api/v1/vendors/${vendorId}/risk-rating`, {
      risk_rating: riskRating,
      risk_notes: riskNotes
    });
    return response.data;
  },
};

// Role-Based Access Control API Functions
export const rbacApi = {
  // Team Assignment
  assignAuditTeam: async (assignmentData: any) => {
    const response = await api.post('/rbac/team-assignment', assignmentData);
    return response.data;
  },

  getAuditTeam: async (auditId: string) => {
    const response = await api.get(`/rbac/team-assignment/${auditId}`);
    return response.data;
  },

  // User Audit Access
  getUserAuditAccess: async (userId?: string) => {
    const response = await api.get('/rbac/user-audit-access', {
      params: userId ? { user_id: userId } : {}
    });
    return response.data;
  },

  // Access Control Check
  checkAccess: async (accessCheck: any) => {
    const response = await api.post('/rbac/check-access', accessCheck);
    return response.data;
  },

  // Admin Override
  adminOverrideAuditAccess: async (auditId: string, targetUserId: string, overrideReason: string) => {
    const response = await api.post('/rbac/admin-override/audit-access', {
      audit_id: auditId,
      target_user_id: targetUserId,
      override_reason: overrideReason
    });
    return response.data;
  },

  getSystemWideAccess: async () => {
    const response = await api.get('/rbac/admin-override/system-access');
    return response.data;
  },

  // Role Matrix Management
  createRoleMatrix: async (roleData: any) => {
    const response = await api.post('/rbac/role-matrix', roleData);
    return response.data;
  },

  getRoleMatrix: async (departmentId?: string, isActive?: boolean) => {
    const response = await api.get('/rbac/role-matrix', {
      params: { 
        department_id: departmentId,
        is_active: isActive
      }
    });
    return response.data;
  },

  // User Role Assignment
  assignUserRole: async (assignmentData: any) => {
    const response = await api.post('/rbac/user-role-assignment', assignmentData);
    return response.data;
  },

  getUserRoleAssignments: async (userId: string, includeInactive?: boolean) => {
    const response = await api.get(`/rbac/user-role-assignments/${userId}`, {
      params: { include_inactive: includeInactive }
    });
    return response.data;
  },
};