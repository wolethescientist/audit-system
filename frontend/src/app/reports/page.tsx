"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Simple icon components as fallbacks
const FileText = ({ className }: { className?: string }) => <span className={className}>📄</span>;
const Search = ({ className }: { className?: string }) => <span className={className}>🔍</span>;
const Filter = ({ className }: { className?: string }) => <span className={className}>🔽</span>;
const Calendar = ({ className }: { className?: string }) => <span className={className}>📅</span>;
const Eye = ({ className }: { className?: string }) => <span className={className}>👁️</span>;
const Download = ({ className }: { className?: string }) => <span className={className}>⬇️</span>;
const Plus = ({ className }: { className?: string }) => <span className={className}>➕</span>;
const Loader2 = ({ className }: { className?: string }) => <span className={`${className} animate-spin`}>⏳</span>;
const AlertCircle = ({ className }: { className?: string }) => <span className={className}>⚠️</span>;
import ReportViewer from '@/components/reports/ReportViewer';

interface Report {
  id: string;
  audit_id: string;
  audit_title: string;
  audit_year: number;
  version: number;
  status: string;
  created_at: string;
  created_by_name: string;
  word_count?: number;
}

interface Audit {
  id: string;
  title: string;
  year: number;
  status: string;
  department_name: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
    fetchAudits();
  }, []);

  const fetchReports = async () => {
    try {
      // This would be a real API call to get all reports
      // For now, we'll simulate it
      setReports([]);
    } catch (err) {
      setError('Failed to fetch reports');
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
    report.audit_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.created_by_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAudits = audits.filter(audit =>
    audit.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    ['executing', 'reporting', 'followup', 'closed'].includes(audit.status)
  );

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
      month: 'short',
      day: 'numeric'
    });
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

  if (selectedReport) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedReport(null)}
            className="mb-4"
          >
            ← Back to Reports
          </Button>
        </div>
        <ReportViewer reportId={selectedReport} />
      </div>
    );
  }

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
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports or audits..."
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Existing Reports */}
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
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedReport(report.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{report.audit_title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Version {report.version} • {formatDate(report.created_at)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          by {report.created_by_name}
                        </p>
                        {report.word_count && (
                          <p className="text-sm text-muted-foreground">
                            {report.word_count.toLocaleString()} words
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(report.status)}
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Audits for Report Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Generate New Report ({filteredAudits.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAudits.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No audits ready for reporting
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Audits must be in executing, reporting, followup, or closed status
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAudits.map((audit) => (
                  <div
                    key={audit.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{audit.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {audit.year} • {audit.department_name}
                        </p>
                        <Badge variant="outline" className="mt-2">
                          {audit.status}
                        </Badge>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => setSelectedAudit(audit.id)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Generation Modal/View */}
      {selectedAudit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Generate Report</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedAudit(null)}
                >
                  Close
                </Button>
              </div>
              
              <ReportViewer 
                auditId={selectedAudit}
                showGenerateButton={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}