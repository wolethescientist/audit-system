"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api';
// Simple icon components as fallbacks
const ArrowLeft = ({ className }: { className?: string }) => <span className={className}>←</span>;
const FileText = ({ className }: { className?: string }) => <span className={className}>📄</span>;
const Loader2 = ({ className }: { className?: string }) => <span className={`${className} animate-spin`}>⏳</span>;
const AlertCircle = ({ className }: { className?: string }) => <span className={className}>⚠️</span>;
import ReportGenerator from '@/components/reports/ReportGenerator';
import ReportViewer from '@/components/reports/ReportViewer';

interface Audit {
  id: string;
  title: string;
  year: number;
  status: string;
  scope: string;
  department_name: string;
}

export default function AuditReportPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;

  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  useEffect(() => {
    fetchAudit();
  }, [auditId]);

  const fetchAudit = async () => {
    try {
      const response = await api.get(`/audits/${auditId}`);
      const data = response.data;
      setAudit(data);

      // Check if audit is ready for reporting
      const reportReadyStatuses = ['executing', 'reporting', 'followup', 'closed'];
      if (!reportReadyStatuses.includes(data.status)) {
        setError(`Audit status "${data.status}" is not ready for reporting. Must be one of: ${reportReadyStatuses.join(', ')}`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit');
    } finally {
      setLoading(false);
    }
  };

  const handleReportGenerated = (reportData: any) => {
    setReportGenerated(true);
    setShowGenerator(false);
  };

  const handleGenerateClick = () => {
    setShowGenerator(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading audit...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Audit not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Audit
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Audit Report
          </h1>
          <p className="text-muted-foreground">
            {audit.title} ({audit.year})
          </p>
        </div>
      </div>

      {/* Audit Information */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Title</div>
              <div className="font-medium">{audit.title}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Year</div>
              <div className="font-medium">{audit.year}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <div className="font-medium capitalize">{audit.status.replace('_', ' ')}</div>
            </div>
            {audit.scope && (
              <div className="md:col-span-3">
                <div className="text-sm font-medium text-muted-foreground">Scope</div>
                <div className="font-medium">{audit.scope}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Generation/Viewing */}
      {showGenerator ? (
        <ReportGenerator
          auditId={auditId}
          auditTitle={audit.title}
          onReportGenerated={handleReportGenerated}
        />
      ) : (
        <ReportViewer
          auditId={auditId}
          showGenerateButton={true}
          onGenerateClick={handleGenerateClick}
        />
      )}

      {/* ISO Compliance Information */}
      <Card>
        <CardHeader>
          <CardTitle>ISO 19011:2018 Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Report Structure</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Executive Summary with audit conclusions</li>
                  <li>• Audit identification (objectives, scope, criteria)</li>
                  <li>• Audit team and auditee identification</li>
                  <li>• Audit dates and locations</li>
                  <li>• Audit criteria documents</li>
                  <li>• Detailed findings with objective evidence</li>
                  <li>• Audit conclusions with conformity assessment</li>
                  <li>• CAPA recommendations</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">AI Generation Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Automated data aggregation from audit records</li>
                  <li>• ISO-compliant terminology and structure</li>
                  <li>• Objective evidence correlation</li>
                  <li>• Multi-format export (PDF, Word, CSV, HTML)</li>
                  <li>• Compliance validation and verification</li>
                  <li>• Professional formatting and presentation</li>
                </ul>
              </div>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                All generated reports strictly follow ISO 19011:2018 Guidelines for auditing management systems, 
                ensuring compliance with international auditing standards.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}