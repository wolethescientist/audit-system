'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Calendar,
  User,
  Building,
  Shield
} from 'lucide-react';
import { documentApi } from '@/lib/api';
import { DocumentDetail, DocumentApproval as DocumentApprovalType, DocumentStatus } from '@/lib/types';

interface DocumentApprovalProps {
  document: DocumentDetail;
  onApprovalSuccess?: (document: DocumentDetail) => void;
  onApprovalError?: (error: string) => void;
}

const STATUS_CONFIG = {
  [DocumentStatus.DRAFT]: {
    color: 'bg-gray-100 text-gray-800',
    icon: FileText,
    label: 'Draft'
  },
  [DocumentStatus.UNDER_REVIEW]: {
    color: 'bg-yellow-100 text-yellow-800',
    icon: AlertTriangle,
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
    icon: XCircle,
    label: 'Expired'
  },
  [DocumentStatus.ARCHIVED]: {
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle,
    label: 'Archived'
  }
};

export default function DocumentApproval({ 
  document, 
  onApprovalSuccess, 
  onApprovalError 
}: DocumentApprovalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [approvalData, setApprovalData] = useState<DocumentApprovalType>({
    action: 'approve',
    comments: '',
    effective_date: document.effective_date 
      ? new Date(document.effective_date).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0],
    expiry_date: document.expiry_date 
      ? new Date(document.expiry_date).toISOString().split('T')[0] 
      : ''
  });

  const handleApproval = async (action: 'approve' | 'reject' | 'request_changes') => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      // Build approval payload, converting dates to ISO format if present
      const approvalPayload: Record<string, any> = {
        action,
        comments: approvalData.comments || null
      };
      
      // Only include dates if they have values
      if (approvalData.effective_date) {
        approvalPayload.effective_date = new Date(approvalData.effective_date).toISOString();
      }
      if (approvalData.expiry_date) {
        approvalPayload.expiry_date = new Date(approvalData.expiry_date).toISOString();
      }

      const result = await documentApi.approveDocument(document.id, approvalPayload);
      
      let successMessage = '';
      switch (action) {
        case 'approve':
          successMessage = 'Document approved successfully';
          break;
        case 'reject':
          successMessage = 'Document rejected';
          break;
        case 'request_changes':
          successMessage = 'Changes requested for document';
          break;
      }
      
      setSuccess(successMessage);
      
      if (onApprovalSuccess) {
        onApprovalSuccess(result);
      }

      // Reset form
      setApprovalData({
        action: 'approve',
        comments: '',
        effective_date: '',
        expiry_date: ''
      });

    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || `Failed to ${action} document`;
      setError(errorMessage);
      if (onApprovalError) {
        onApprovalError(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const statusConfig = STATUS_CONFIG[document.approval_status];
  const StatusIcon = statusConfig.icon;

  const canApprove = document.approval_status === DocumentStatus.DRAFT || 
                    document.approval_status === DocumentStatus.UNDER_REVIEW;

  return (
    <div className="space-y-6">
      {/* Document Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Approval
            </div>
            <Badge className={statusConfig.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-500">Document Number</Label>
                <p className="font-mono text-sm">{document.document_number}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Document Name</Label>
                <p className="font-medium">{document.document_name}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Type & Category</Label>
                <div className="flex gap-2">
                  <Badge variant="outline">{document.document_type}</Badge>
                  {document.category && <Badge variant="outline">{document.category}</Badge>}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Version</Label>
                <p>{document.version}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-500">File Information</Label>
                <div className="text-sm">
                  <p>{document.file_name}</p>
                  <p className="text-gray-500">{formatFileSize(document.file_size)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Confidentiality</Label>
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span className="capitalize">{document.confidentiality_level}</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Dates</Label>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Effective: {formatDate(document.effective_date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Expires: {formatDate(document.expiry_date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Next Review: {formatDate(document.next_review_date)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {document.description && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Description</Label>
              <p className="text-sm mt-1">{document.description}</p>
            </div>
          )}

          {/* Keywords */}
          {document.keywords && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Keywords</Label>
              <p className="text-sm mt-1">{document.keywords}</p>
            </div>
          )}

          {/* Change History */}
          {document.change_history && document.change_history.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Recent Changes</Label>
              <div className="mt-2 space-y-2">
                {document.change_history.slice(-3).map((change, index) => (
                  <div key={index} className="text-sm border-l-2 border-gray-200 pl-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {change.action}
                      </Badge>
                      <span className="text-gray-500">
                        by {change.user_name} on {new Date(change.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    {change.comments && (
                      <p className="text-gray-600 mt-1">{change.comments}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Actions Card */}
      {canApprove && (
        <Card>
          <CardHeader>
            <CardTitle>Approval Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Success/Error Messages */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Approval Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effective_date">Effective Date</Label>
                <Input
                  id="effective_date"
                  type="date"
                  value={approvalData.effective_date}
                  onChange={(e) => setApprovalData(prev => ({
                    ...prev,
                    effective_date: e.target.value
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date (Optional)</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={approvalData.expiry_date}
                  onChange={(e) => setApprovalData(prev => ({
                    ...prev,
                    expiry_date: e.target.value
                  }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={approvalData.comments}
                onChange={(e) => setApprovalData(prev => ({
                  ...prev,
                  comments: e.target.value
                }))}
                placeholder="Enter approval comments or feedback"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-4">
              <Button
                onClick={() => handleApproval('approve')}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Approve'}
              </Button>

              <Button
                onClick={() => handleApproval('request_changes')}
                disabled={isProcessing}
                variant="outline"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Request Changes
              </Button>

              <Button
                onClick={() => handleApproval('reject')}
                disabled={isProcessing}
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Digital Signature Support Note */}
      {canApprove && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Digital Signature Support</p>
                <p className="text-blue-700 mt-1">
                  All approval actions are digitally signed and logged for ISO 9001 compliance. 
                  Your approval will be recorded with timestamp, IP address, and user credentials.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}