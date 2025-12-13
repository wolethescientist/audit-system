'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Edit, 
  History, 
  Calendar,
  User,
  Building,
  Shield,
  Tag,
  Eye,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Plus
} from 'lucide-react';
import { documentApi } from '@/lib/api';
import { DocumentDetail, DocumentTag, DocumentStatus } from '@/lib/types';

interface DocumentViewerProps {
  documentId: string;
  onEdit?: (document: DocumentDetail) => void;
  onDownload?: (document: DocumentDetail) => void;
  onClose?: () => void;
}

const STATUS_CONFIG = {
  [DocumentStatus.DRAFT]: {
    color: 'bg-gray-100 text-gray-800',
    icon: Edit,
    label: 'Draft'
  },
  [DocumentStatus.UNDER_REVIEW]: {
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    label: 'Under Review'
  },
  [DocumentStatus.APPROVED]: {
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    label: 'Approved'
  },
  [DocumentStatus.ACTIVE]: {
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle,
    label: 'Active'
  },
  [DocumentStatus.EXPIRED]: {
    color: 'bg-red-100 text-red-800',
    icon: AlertCircle,
    label: 'Expired'
  },
  [DocumentStatus.ARCHIVED]: {
    color: 'bg-gray-100 text-gray-800',
    icon: AlertCircle,
    label: 'Archived'
  }
};

export default function DocumentViewer({ 
  documentId, 
  onEdit, 
  onDownload, 
  onClose 
}: DocumentViewerProps) {
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [addingTag, setAddingTag] = useState(false);

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await documentApi.getDocument(documentId);
      setDocument(result);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to load document';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!document) return;

    try {
      const response = await documentApi.downloadDocument(document.id);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: document.mime_type });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.file_name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      if (onDownload) {
        onDownload(document);
      }
    } catch (error: any) {
      setError('Failed to download document');
    }
  };

  const handleAddTag = async () => {
    if (!document || !newTag.trim()) return;

    setAddingTag(true);
    try {
      await documentApi.addDocumentTag(document.id, { tag_name: newTag.trim() });
      setNewTag('');
      // Reload document to get updated tags
      await loadDocument();
    } catch (error: any) {
      setError('Failed to add tag');
    } finally {
      setAddingTag(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!document) return;

    try {
      await documentApi.removeDocumentTag(document.id, tagId);
      // Reload document to get updated tags
      await loadDocument();
    } catch (error: any) {
      setError('Failed to remove tag');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isExpiringSoon = (document: DocumentDetail) => {
    if (!document.expiry_date) return false;
    const expiryDate = new Date(document.expiry_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow;
  };

  const isExpired = (document: DocumentDetail) => {
    if (!document.expiry_date) return false;
    return new Date(document.expiry_date) < new Date();
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading document...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !document) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
          <h3 className="text-lg font-medium text-gray-900 mt-4">Error Loading Document</h3>
          <p className="text-gray-500 mt-2">{error || 'Document not found'}</p>
          <Button onClick={loadDocument} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = STATUS_CONFIG[document.approval_status];
  const StatusIcon = statusConfig.icon;
  const expiringSoon = isExpiringSoon(document);
  const expired = isExpired(document);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="truncate">{document.document_name}</span>
              </CardTitle>
              <p className="text-sm text-gray-500 font-mono mt-1">
                {document.document_number} • Version {document.version}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={statusConfig.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Expiry Warnings */}
          {expired && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This document expired on {formatDate(document.expiry_date)}
              </AlertDescription>
            </Alert>
          )}
          
          {expiringSoon && !expired && (
            <Alert className="mb-4 border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                This document expires on {formatDate(document.expiry_date)}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            
            {onEdit && (
              <Button variant="outline" onClick={() => onEdit(document)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            
            <Button variant="outline" onClick={() => window.open(document.file_url, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Document Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Document Type</Label>
                  <p className="mt-1">{document.document_type}</p>
                </div>
                
                {document.category && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Category</Label>
                    <p className="mt-1">{document.category}</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-gray-500">File Information</Label>
                  <div className="mt-1 text-sm">
                    <p>{document.file_name}</p>
                    <p className="text-gray-500">{formatFileSize(document.file_size)} • {document.mime_type}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Confidentiality Level</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span className="capitalize">{document.confidentiality_level}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Controlled Document</Label>
                  <p className="mt-1">{document.is_controlled ? 'Yes' : 'No'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <p className="mt-1">{document.is_active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>

              {document.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p className="mt-1 text-sm">{document.description}</p>
                </div>
              )}

              {document.keywords && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Keywords</Label>
                  <p className="mt-1 text-sm">{document.keywords}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change History */}
          {document.change_history && document.change_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Change History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {document.change_history.map((change, index) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {change.action}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          Version {change.version}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        by {change.user_name} on {formatDate(change.timestamp)}
                      </div>
                      {change.comments && (
                        <p className="text-sm mt-1">{change.comments}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Important Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-500">Created</Label>
                <p className="text-sm mt-1">{formatDate(document.created_at)}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                <p className="text-sm mt-1">{formatDate(document.updated_at)}</p>
              </div>

              {document.effective_date && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Effective Date</Label>
                  <p className="text-sm mt-1">{formatDate(document.effective_date)}</p>
                </div>
              )}

              {document.expiry_date && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Expiry Date</Label>
                  <p className={`text-sm mt-1 ${expired ? 'text-red-600' : expiringSoon ? 'text-orange-600' : ''}`}>
                    {formatDate(document.expiry_date)}
                  </p>
                </div>
              )}

              {document.next_review_date && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Next Review</Label>
                  <p className="text-sm mt-1">{formatDate(document.next_review_date)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* People */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                People
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-500">Uploaded By</Label>
                <p className="text-sm mt-1">User ID: {document.uploaded_by_id}</p>
              </div>

              {document.reviewed_by_id && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Reviewed By</Label>
                  <p className="text-sm mt-1">User ID: {document.reviewed_by_id}</p>
                </div>
              )}

              {document.approved_by_id && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Approved By</Label>
                  <p className="text-sm mt-1">User ID: {document.approved_by_id}</p>
                </div>
              )}

              {document.department_id && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Department</Label>
                  <p className="text-sm mt-1">Dept ID: {document.department_id}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Existing Tags */}
              {document.tags && document.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {document.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => {
                          // Note: We'd need the tag ID to remove it properly
                          // This is a simplified version
                        }}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add New Tag */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!newTag.trim() || addingTag}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {(!document.tags || document.tags.length === 0) && (
                <p className="text-sm text-gray-500">No tags added</p>
              )}
            </CardContent>
          </Card>

          {/* Access Control */}
          {document.access_roles && document.access_roles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Access Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Allowed Roles</Label>
                  <div className="flex flex-wrap gap-1">
                    {document.access_roles.map((role, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}