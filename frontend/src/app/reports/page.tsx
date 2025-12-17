"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ReportGenerator from '@/components/reports/ReportGenerator';
import ReportViewer from '@/components/reports/ReportViewer';

// Simple icon components as fallbacks
const FileText = ({ className }: { className?: string }) => <span className={className}>📄</span>;
const Search = ({ className }: { className?: string }) => <span className={className}>🔍</span>;
const Filter = ({ className }: { className?: string }) => <span className={className}>🔽</span>;
const Calendar = ({ className }: { className?: string }) => <span className={className}>📅</span>;
const Eye = ({ className }: { className?: string }) => <span className={className}>👁️</span>;
const Plus = ({ className }: { className?: string }) => <span className={className}>➕</span>;
const Loader2 = ({ className }: { className?: string }) => <span className={`${className} animate-spin`}>⏳</span>;
const AlertCircle = ({ className }: { className?: string }) => <span className={className}>⚠️</span>;
const ChevronRight = ({ className }: { className?: string }) => <span className={className}>›</span>;
const ArrowLeft = ({ className }: { className?: string }) => <span className={className}>←</span>;

interface Report {
  id: string;
  audit_id: string;
  audit_title: string;
  audit_year: number;
  version: number;
  status: string;
  created_at: string;
  created_by_name: string;
  content?: string;
}

interface Audit {
  id: string;
  title: string;
  year: number;
  status: string;
  department_name: string;
}

type ViewMode = 'list' | 'select-audit' | 'generate' | 'view-report';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
    fetchAudits();
  }, []);

  const fetchReports = async () => {
    try {
      const { api } = await import('@/lib/api');
      const response = await api.get('/api/v1/reports/');
      setReports(response.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setReports([]);
    }
  };

  const fetchAudits = async () => {
    try {
      const { api } = await import('@/lib/api');
      const response = await api.get('/api/v1/audits');
      setAudits(response.data || []);
    } catch (err) {
      console.error('Failed to fetch audits:', err);
    } finally {
      setLoading(false);
    }
  };


  const filteredReports = reports.filter(report =>
    report.audit_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.created_by_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter audits that are ready for reporting
  const auditsReadyForReporting = audits.filter(audit =>
    ['executing', 'reporting', 'followup', 'closed'].includes(audit.status?.toLowerCase())
  );

  const filteredAuditsForSelection = auditsReadyForReporting.filter(audit =>
    audit.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      draft: { variant: 'secondary', label: 'Draft' },
      under_review: { variant: 'default', label: 'Under Review' },
      approved: { variant: 'default', label: 'Approved' },
      published: { variant: 'default', label: 'Published' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleGenerateClick = () => {
    setViewMode('select-audit');
    setSelectedAudit(null);
  };

  const handleAuditSelect = (audit: Audit) => {
    setSelectedAudit(audit);
  };

  const handleStartGeneration = () => {
    if (selectedAudit) {
      setViewMode('generate');
    }
  };

  const handleReportGenerated = () => {
    fetchReports();
    setViewMode('list');
    setSelectedAudit(null);
  };

  const handleViewReport = (reportId: string) => {
    setSelectedReport(reportId);
    setViewMode('view-report');
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedAudit(null);
    setSelectedReport(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading reports...</span>
        </div>
      </div>
    );
  }

  // View Report Mode
  if (viewMode === 'view-report' && selectedReport) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
        <ReportViewer reportId={selectedReport} />
      </div>
    );
  }

  // Generate Report Mode
  if (viewMode === 'generate' && selectedAudit) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
        <ReportGenerator 
          auditId={selectedAudit.id}
          auditTitle={selectedAudit.title}
          onReportGenerated={handleReportGenerated}
        />
      </div>
    );
  }

  // Select Audit Mode
  if (viewMode === 'select-audit') {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Generate New Report</h1>
            <p className="text-muted-foreground">
              Select an audit to generate an ISO 19011 compliant report
            </p>
          </div>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search audits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Audit Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Available Audits ({filteredAuditsForSelection.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAuditsForSelection.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No audits ready for reporting</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Audits must be in executing, reporting, followup, or closed status
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAuditsForSelection.map((audit) => (
                  <div
                    key={audit.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedAudit?.id === audit.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleAuditSelect(audit)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{audit.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {audit.year} • {audit.department_name}
                        </p>
                        <Badge variant="outline" className="mt-2">
                          {audit.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedAudit?.id === audit.id && (
                          <Badge variant="default">Selected</Badge>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Button */}
        {selectedAudit && (
          <div className="flex justify-end">
            <Button size="lg" onClick={handleStartGeneration}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report for "{selectedAudit.title}"
            </Button>
          </div>
        )}
      </div>
    );
  }


  // Default List View
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Reports</h1>
          <p className="text-muted-foreground">
            Generate and manage ISO 19011 compliant audit reports
          </p>
        </div>
        <Button onClick={handleGenerateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Generate New Report
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Generated Reports List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generated Reports ({filteredReports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No reports generated yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click "Generate New Report" to create your first report
              </p>
              <Button className="mt-4" onClick={handleGenerateClick}>
                <Plus className="h-4 w-4 mr-2" />
                Generate New Report
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted rounded-lg text-sm font-medium text-muted-foreground">
                <div className="col-span-4">Audit</div>
                <div className="col-span-2">Year</div>
                <div className="col-span-2">Version</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Actions</div>
              </div>
              
              {/* Report Rows */}
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 border rounded-lg hover:bg-muted/50 transition-colors items-center"
                >
                  <div className="col-span-4">
                    <h3 className="font-medium truncate">{report.audit_title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      by {report.created_by_name} • {formatDate(report.created_at)}
                    </p>
                  </div>
                  <div className="col-span-2 text-sm">
                    {report.audit_year || 'N/A'}
                  </div>
                  <div className="col-span-2 text-sm">
                    v{report.version}
                  </div>
                  <div className="col-span-2">
                    {getStatusBadge(report.status)}
                  </div>
                  <div className="col-span-2 flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewReport(report.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
