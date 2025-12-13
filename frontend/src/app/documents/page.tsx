'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Upload, 
  Search, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Eye,
  Plus
} from 'lucide-react';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentLibrary from '@/components/documents/DocumentLibrary';
import DocumentViewer from '@/components/documents/DocumentViewer';
import DocumentApproval from '@/components/documents/DocumentApproval';
import { documentApi, api } from '@/lib/api';
import { Document, DocumentDetail, DocumentExpiring, Department, User } from '@/lib/types';

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState('library');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [expiringDocuments, setExpiringDocuments] = useState<DocumentExpiring[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending_approval: 0,
    expiring_soon: 0,
    expired: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load departments and users for dropdowns
      const [deptResponse, usersResponse] = await Promise.all([
        api.get('/api/v1/departments'),
        api.get('/api/v1/users')
      ]);
      
      setDepartments(deptResponse.data);
      setUsers(usersResponse.data);

      // Load expiring documents
      await loadExpiringDocuments();
      
      // Load document statistics
      await loadDocumentStats();
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadExpiringDocuments = async () => {
    try {
      const response = await documentApi.getExpiringDocuments(30, true);
      setExpiringDocuments(response);
    } catch (error) {
      console.error('Failed to load expiring documents:', error);
    }
  };

  const loadDocumentStats = async () => {
    try {
      // Get basic document counts by searching with different filters
      const [totalResponse, pendingResponse, expiringResponse] = await Promise.all([
        documentApi.searchDocuments({ limit: 1 }),
        documentApi.searchDocuments({ approval_status: 'draft', limit: 1 }),
        documentApi.getExpiringDocuments(30, false)
      ]);

      setStats({
        total: totalResponse.total_count,
        pending_approval: pendingResponse.total_count,
        expiring_soon: expiringResponse.filter((doc: DocumentExpiring) => doc.days_until_expiry > 0).length,
        expired: expiringResponse.filter((doc: DocumentExpiring) => doc.days_until_expiry <= 0).length
      });
    } catch (error) {
      console.error('Failed to load document stats:', error);
    }
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
    setSelectedDocumentId(document.id);
    setActiveTab('viewer');
  };

  const handleDocumentUploadSuccess = (document: Document) => {
    setShowUpload(false);
    setActiveTab('library');
    // Refresh stats
    loadDocumentStats();
  };

  const handleApprovalSuccess = (document: DocumentDetail) => {
    setShowApproval(false);
    setActiveTab('library');
    // Refresh stats and expiring documents
    loadDocumentStats();
    loadExpiringDocuments();
  };

  const handleEditDocument = (document: DocumentDetail) => {
    // For now, just show approval interface
    setSelectedDocument(document as Document);
    setShowApproval(true);
    setActiveTab('approval');
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Control System</h1>
          <p className="text-gray-600 mt-1">
            ISO 9001 & ISO 27001 compliant document management
          </p>
        </div>
        <Button onClick={() => { setShowUpload(true); setActiveTab('upload'); }}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending_approval}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.expiring_soon}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Documents Alert */}
      {expiringDocuments.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <span>
                {expiringDocuments.length} document(s) require attention (expiring or expired)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('expiring')}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                View Details
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Library
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="approval" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approval
          </TabsTrigger>
          <TabsTrigger value="viewer" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Viewer
          </TabsTrigger>
          <TabsTrigger value="expiring" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Expiring
            {expiringDocuments.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {expiringDocuments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
          <DocumentLibrary
            departments={departments}
            onDocumentSelect={handleDocumentSelect}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <DocumentUpload
            departments={departments}
            users={users}
            onUploadSuccess={handleDocumentUploadSuccess}
          />
        </TabsContent>

        <TabsContent value="approval" className="space-y-4">
          {selectedDocument ? (
            <DocumentApproval
              document={selectedDocument as DocumentDetail}
              onApprovalSuccess={handleApprovalSuccess}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mt-4">No Document Selected</h3>
                <p className="text-gray-500 mt-2">
                  Select a document from the library to review and approve
                </p>
                <Button 
                  onClick={() => setActiveTab('library')} 
                  className="mt-4"
                  variant="outline"
                >
                  Go to Library
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="viewer" className="space-y-4">
          {selectedDocumentId ? (
            <DocumentViewer
              documentId={selectedDocumentId}
              onEdit={handleEditDocument}
              onClose={() => {
                setSelectedDocumentId(null);
                setSelectedDocument(null);
                setActiveTab('library');
              }}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Eye className="h-12 w-12 mx-auto text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mt-4">No Document Selected</h3>
                <p className="text-gray-500 mt-2">
                  Select a document from the library to view its details
                </p>
                <Button 
                  onClick={() => setActiveTab('library')} 
                  className="mt-4"
                  variant="outline"
                >
                  Go to Library
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Documents Requiring Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expiringDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                  <h3 className="text-lg font-medium text-gray-900 mt-4">All Documents Up to Date</h3>
                  <p className="text-gray-500 mt-2">
                    No documents are expiring in the next 30 days
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiringDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className={`p-4 rounded-lg border ${
                        doc.days_until_expiry <= 0
                          ? 'border-red-200 bg-red-50'
                          : doc.days_until_expiry <= 7
                          ? 'border-orange-200 bg-orange-50'
                          : 'border-yellow-200 bg-yellow-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{doc.document_name}</h4>
                          <p className="text-sm text-gray-600 font-mono">{doc.document_number}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>Type: {doc.document_type}</span>
                            {doc.responsible_person && (
                              <span>Owner: {doc.responsible_person}</span>
                            )}
                            {doc.department_name && (
                              <span>Dept: {doc.department_name}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={doc.days_until_expiry <= 0 ? 'destructive' : 'outline'}
                            className={
                              doc.days_until_expiry <= 0
                                ? ''
                                : doc.days_until_expiry <= 7
                                ? 'border-orange-300 text-orange-700'
                                : 'border-yellow-300 text-yellow-700'
                            }
                          >
                            {doc.days_until_expiry <= 0
                              ? `Expired ${Math.abs(doc.days_until_expiry)} days ago`
                              : `Expires in ${doc.days_until_expiry} days`
                            }
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(doc.expiry_date).toLocaleDateString()}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() => {
                              setSelectedDocumentId(doc.id);
                              setActiveTab('viewer');
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}