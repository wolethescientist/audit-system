"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api';


interface ReportViewerProps {
  reportId?: string;
  auditId?: string;
  showGenerateButton?: boolean;
  onGenerateClick?: () => void;
}

interface ReportData {
  id: string;
  audit_id: string;
  version: number;
  content: string;
  status: string;
  created_by_id: string;
  comments: string;
  created_at: string;
}

interface AuditData {
  id: string;
  title: string;
  year: number;
  status: string;
}

export default function ReportViewer({ 
  reportId, 
  auditId, 
  showGenerateButton = true,
  onGenerateClick 
}: ReportViewerProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (reportId) {
      fetchReport();
    } else if (auditId) {
      fetchAuditReports();
    }
  }, [reportId, auditId]);

  const fetchReport = async () => {
    if (!reportId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/v1/reports/${reportId}`);
      const data = response.data;
      setReportData(data);

      // Fetch audit data
      if (data.audit_id) {
        await fetchAuditData(data.audit_id);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditReports = async () => {
    if (!auditId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/v1/reports/audit/${auditId}`);
      const data = response.data;
      
      if (data.data.reports && data.data.reports.length > 0) {
        // Get the latest report
        const latestReport = data.data.reports.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        setReportData(latestReport);
      }

      // Set audit data
      setAuditData({
        id: data.data.audit_id,
        title: data.data.audit_title,
        year: new Date().getFullYear(), // This should come from audit data
        status: 'active' // This should come from audit data
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditData = async (auditId: string) => {
    try {
      const response = await api.get(`/audits/${auditId}`);
      setAuditData(response.data);
    } catch (err) {
      console.error('Failed to fetch audit data:', err);
    }
  };

  const downloadReport = async (format: string) => {
    if (!reportData) return;

    try {
      const response = await api.get(`/api/v1/reports/${reportData.id}/download/${format}`, {
        responseType: 'blob'
      });

      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_report_${auditData?.title?.replace(/\s+/g, '_') || 'report'}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to download ${format} report`);
    }
  };

  const generatePreviewContent = () => {
    if (!reportData?.content) return '';

    // Convert markdown to HTML (basic conversion)
    let html = reportData.content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br>');

    return html;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft' },
      under_review: { variant: 'default' as const, label: 'Under Review' },
      approved: { variant: 'default' as const, label: 'Approved' },
      published: { variant: 'default' as const, label: 'Published' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <span className="animate-spin mr-2">⏳</span>
          <span>Loading report...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!reportData && showGenerateButton) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Audit Report
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium mb-2">No Report Generated</h3>
          <p className="text-muted-foreground mb-4">
            Generate an AI-powered ISO 19011 compliant audit report for this audit.
          </p>
          <Button onClick={onGenerateClick}>
            Generate Report
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!reportData) {
    return (
      <Alert>
        <AlertDescription>No report data available.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Audit Report
                {getStatusBadge(reportData.status)}
              </CardTitle>
              {auditData && (
                <p className="text-muted-foreground mt-1">
                  {auditData.title} ({auditData.year})
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Hide Preview' : 'Preview'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">📅</span>
              <div>
                <div className="text-sm font-medium">Generated</div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(reportData.created_at)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">📄</span>
              <div>
                <div className="text-sm font-medium">Version</div>
                <div className="text-sm text-muted-foreground">
                  v{reportData.version}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <div className="text-sm font-medium">ISO 19011:2018</div>
                <div className="text-sm text-muted-foreground">
                  Compliant
                </div>
              </div>
            </div>
          </div>

          {reportData.comments && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">Comments</div>
              <div className="text-sm text-muted-foreground">
                {reportData.comments}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Download Options */}
      <Card>
        <CardHeader>
          <CardTitle>
            Download Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => downloadReport('pdf')}
              className="flex items-center gap-2 h-auto p-4"
            >
              <span className="text-2xl text-red-600">📄</span>
              <div className="text-left">
                <div className="font-medium">PDF Document</div>
                <div className="text-sm text-muted-foreground">
                  Professional formatted report
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => downloadReport('docx')}
              className="flex items-center gap-2 h-auto p-4"
            >
              <span className="text-2xl text-blue-600">📝</span>
              <div className="text-left">
                <div className="font-medium">Word Document</div>
                <div className="text-sm text-muted-foreground">
                  Editable DOCX format
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-6 max-h-96 overflow-y-auto bg-white">
              <div 
                dangerouslySetInnerHTML={{ __html: generatePreviewContent() }}
                className="prose prose-sm max-w-none"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}