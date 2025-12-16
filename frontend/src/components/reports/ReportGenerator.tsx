"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';


interface ReportGeneratorProps {
  auditId: string;
  auditTitle: string;
  onReportGenerated?: (reportData: any) => void;
}

interface GenerationProgress {
  step: string;
  progress: number;
  message: string;
}

interface ReportData {
  report_id: string;
  audit_id: string;
  status: string;
  content: string;
  html_content?: string;
  generation_date: string;
  iso_compliance_validated: boolean;
  validation_notes: string[];
  word_count: number;
  sections_generated: number;
  download_files: {
    pdf_content?: string;
    docx_content?: string;
    csv_content?: string;
    markdown_content?: string;
  };
  supported_formats: string[];
}

export default function ReportGenerator({ 
  auditId, 
  auditTitle, 
  onReportGenerated 
}: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    step: '',
    progress: 0,
    message: ''
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    setError(null);
    setReportData(null);
    
    try {
      // Simulate progress updates
      setGenerationProgress({
        step: 'Initializing',
        progress: 10,
        message: 'Preparing audit data for AI analysis...'
      });

      const response = await api.post(`/api/v1/reports/generate/${auditId}`);

      setGenerationProgress({
        step: 'Processing',
        progress: 50,
        message: 'AI is analyzing audit data and generating ISO 19011 compliant report...'
      });

      const result = response.data;
      
      setGenerationProgress({
        step: 'Finalizing',
        progress: 90,
        message: 'Preparing download formats...'
      });

      // Simulate final processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGenerationProgress({
        step: 'Complete',
        progress: 100,
        message: 'Report generated successfully!'
      });

      setReportData(result.data);
      onReportGenerated?.(result.data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async (format: string) => {
    if (!reportData) return;

    try {
      const response = await api.get(`/api/v1/reports/${reportData.report_id}/download/${format}`, {
        responseType: 'blob'
      });

      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_report_${auditTitle.replace(/\s+/g, '_')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to download ${format} report`);
    }
  };



  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'pdf':
        return 'PDF Document';
      case 'docx':
        return 'Word Document';
      case 'csv':
        return 'CSV Data';
      case 'html':
        return 'HTML Page';
      case 'markdown':
        return 'Markdown';
      default:
        return format.toUpperCase();
    }
  };

  return (
    <div className="space-y-6">
      {/* Generation Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            AI Report Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{auditTitle}</h3>
              <p className="text-sm text-muted-foreground">
                Generate ISO 19011:2018 compliant audit report using AI
              </p>
            </div>
            <Button 
              onClick={generateReport} 
              disabled={isGenerating}
              className="min-w-[120px]"
            >
              {isGenerating ? (
                <>
                  <span className="mr-2 animate-spin">⏳</span>
                  Generating...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>
          </div>

          {/* Progress Indicator */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{generationProgress.step}</span>
                <span>{generationProgress.progress}%</span>
              </div>
              <Progress value={generationProgress.progress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {generationProgress.message}
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>
              Report Generated Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Report Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {reportData.word_count.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Words</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {reportData.sections_generated}
                </div>
                <div className="text-sm text-muted-foreground">Sections</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {reportData.iso_compliance_validated ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-yellow-600">⚠</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">ISO Compliant</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {reportData.supported_formats.length}
                </div>
                <div className="text-sm text-muted-foreground">Formats</div>
              </div>
            </div>

            {/* ISO Compliance Status */}
            <div className="flex items-center gap-2">
              <Badge variant={reportData.iso_compliance_validated ? "default" : "secondary"}>
                ISO 19011:2018 {reportData.iso_compliance_validated ? "Compliant" : "Validation Pending"}
              </Badge>
              {reportData.validation_notes.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {reportData.validation_notes.length} validation note(s)
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Hide Preview' : 'Preview Report'}
              </Button>
              
              {/* Download Buttons */}
              {reportData.supported_formats.map((format) => (
                <Button
                  key={format}
                  variant="outline"
                  onClick={() => downloadReport(format)}
                >
                  Download {getFormatLabel(format)}
                </Button>
              ))}
            </div>

            {/* Validation Notes */}
            {reportData.validation_notes.length > 0 && (
              <Alert>
                <AlertDescription>
                  <div className="font-medium mb-2">Validation Notes:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {reportData.validation_notes.map((note, index) => (
                      <li key={index} className="text-sm">{note}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Report Preview */}
      {showPreview && reportData?.html_content && (
        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
              <div 
                dangerouslySetInnerHTML={{ __html: reportData.html_content }}
                className="prose prose-sm max-w-none"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}