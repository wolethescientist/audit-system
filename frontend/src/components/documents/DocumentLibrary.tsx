'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  FileText, 
  Calendar,
  User,
  Building,
  Shield,
  Tag,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { documentApi } from '@/lib/api';
import { 
  Document, 
  DocumentSearchRequest, 
  DocumentSearchResponse, 
  DocumentStatus,
  Department 
} from '@/lib/types';

interface DocumentLibraryProps {
  departments?: Department[];
  onDocumentSelect?: (document: Document) => void;
  onDocumentDownload?: (document: Document) => void;
}

const DOCUMENT_TYPES = [
  'Policy',
  'Procedure',
  'Manual',
  'Form',
  'Standard',
  'Guideline',
  'Specification',
  'Report',
  'Certificate',
  'Contract',
  'Other'
];

const CATEGORIES = [
  'Quality Management',
  'Information Security',
  'Human Resources',
  'Finance',
  'Operations',
  'Compliance',
  'Risk Management',
  'Business Continuity',
  'Health & Safety',
  'Environmental',
  'Legal',
  'IT',
  'Other'
];

const CONFIDENTIALITY_LEVELS = [
  { value: 'public', label: 'Public' },
  { value: 'internal', label: 'Internal' },
  { value: 'confidential', label: 'Confidential' },
  { value: 'restricted', label: 'Restricted' }
];

const STATUS_CONFIG = {
  [DocumentStatus.DRAFT]: {
    color: 'bg-gray-100 text-gray-800',
    label: 'Draft'
  },
  [DocumentStatus.UNDER_REVIEW]: {
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Under Review'
  },
  [DocumentStatus.APPROVED]: {
    color: 'bg-green-100 text-green-800',
    label: 'Approved'
  },
  [DocumentStatus.ACTIVE]: {
    color: 'bg-blue-100 text-blue-800',
    label: 'Active'
  },
  [DocumentStatus.EXPIRED]: {
    color: 'bg-red-100 text-red-800',
    label: 'Expired'
  },
  [DocumentStatus.ARCHIVED]: {
    color: 'bg-gray-100 text-gray-800',
    label: 'Archived'
  }
};

export default function DocumentLibrary({ 
  departments = [], 
  onDocumentSelect, 
  onDocumentDownload 
}: DocumentLibraryProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  const [searchParams, setSearchParams] = useState<DocumentSearchRequest>({
    query: '',
    document_type: '',
    category: '',
    department_id: '',
    approval_status: undefined,
    confidentiality_level: '',
    include_expired: false,
    limit: 20,
    offset: 0
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    searchDocuments();
  }, [searchParams.offset]); // Auto-search when pagination changes

  const searchDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response: DocumentSearchResponse = await documentApi.searchDocuments(searchParams);
      
      if (searchParams.offset === 0) {
        setDocuments(response.documents);
      } else {
        setDocuments(prev => [...prev, ...response.documents]);
      }
      
      setTotalCount(response.total_count);
      setHasMore(response.has_more);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to search documents';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchParams(prev => ({ ...prev, offset: 0 }));
    searchDocuments();
  };

  const handleLoadMore = () => {
    setSearchParams(prev => ({ 
      ...prev, 
      offset: prev.offset! + prev.limit! 
    }));
  };

  const handleFilterChange = (field: keyof DocumentSearchRequest, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value,
      offset: 0 // Reset pagination when filters change
    }));
  };

  const clearFilters = () => {
    setSearchParams({
      query: '',
      document_type: '',
      category: '',
      department_id: '',
      approval_status: undefined,
      confidentiality_level: '',
      include_expired: false,
      limit: 20,
      offset: 0
    });
  };

  const handleDownload = async (document: Document) => {
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

      if (onDocumentDownload) {
        onDocumentDownload(document);
      }
    } catch (error: any) {
      setError('Failed to download document');
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

  const isExpiringSoon = (document: Document) => {
    if (!document.expiry_date) return false;
    const expiryDate = new Date(document.expiry_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Library
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => searchDocuments()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search documents by name, description, or keywords..."
                value={searchParams.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select
                  value={searchParams.document_type}
                  onValueChange={(value) => handleFilterChange('document_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={searchParams.category}
                  onValueChange={(value) => handleFilterChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={searchParams.department_id}
                  onValueChange={(value) => handleFilterChange('department_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={searchParams.approval_status || ''}
                  onValueChange={(value) => handleFilterChange('approval_status', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                      <SelectItem key={status} value={status}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Confidentiality</Label>
                <Select
                  value={searchParams.confidentiality_level}
                  onValueChange={(value) => handleFilterChange('confidentiality_level', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All levels</SelectItem>
                    {CONFIDENTIALITY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 md:col-span-3 lg:col-span-5">
                <input
                  type="checkbox"
                  id="include_expired"
                  checked={searchParams.include_expired}
                  onChange={(e) => handleFilterChange('include_expired', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="include_expired">Include expired documents</Label>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="ml-auto"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {documents.length} of {totalCount} documents
            </span>
            {searchParams.query && (
              <span>
                Search results for &quot;{searchParams.query}&quot;
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((document) => {
          const statusConfig = STATUS_CONFIG[document.approval_status];
          const isExpiring = isExpiringSoon(document);
          
          return (
            <Card 
              key={document.id} 
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                isExpiring ? 'border-orange-200 bg-orange-50' : ''
              }`}
              onClick={() => onDocumentSelect && onDocumentSelect(document)}
            >
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate" title={document.document_name}>
                      {document.document_name}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">
                      {document.document_number}
                    </p>
                  </div>
                  <Badge className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Document Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-gray-400" />
                    <span>{document.document_type}</span>
                    {document.category && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-600">{document.category}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-gray-400" />
                    <span className="capitalize">{document.confidentiality_level}</span>
                    <span className="text-gray-300">•</span>
                    <span>v{document.version}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span>Created: {formatDate(document.created_at)}</span>
                  </div>

                  {document.expiry_date && (
                    <div className={`flex items-center gap-2 ${isExpiring ? 'text-orange-600' : ''}`}>
                      <Calendar className="h-3 w-3" />
                      <span>Expires: {formatDate(document.expiry_date)}</span>
                      {isExpiring && (
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                          Expiring Soon
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-gray-500">
                    <span>{document.file_name}</span>
                    <span className="text-gray-300">•</span>
                    <span>{formatFileSize(document.file_size)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDocumentSelect && onDocumentSelect(document);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(document);
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                  
                  {document.is_controlled && (
                    <Badge variant="outline" className="text-xs">
                      Controlled
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && documents.length === 0 && (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-500 mt-2">Loading documents...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && documents.length === 0 && !error && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mt-4">No documents found</h3>
            <p className="text-gray-500 mt-2">
              {searchParams.query || Object.values(searchParams).some(v => v && v !== '' && v !== 0)
                ? 'Try adjusting your search criteria or filters'
                : 'Upload your first document to get started'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Load More */}
      {hasMore && !loading && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-2" />
            )}
            Load More Documents
          </Button>
        </div>
      )}
    </div>
  );
}