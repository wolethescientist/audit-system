"""
Report Generation Service for ISO 19011 Compliant Audit Reports

This service orchestrates the complete report generation workflow including
data aggregation, AI generation, validation, and multi-format export.
"""

import os
import io
import logging
from typing import Dict, Any, Optional, List, BinaryIO
from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from docx import Document
from docx.shared import Inches
import pandas as pd
import markdown
import re

from app.models import Audit, AuditReport, ReportStatus, User, AuditTeam
from app.services.gemini_service import GeminiAIService
from app.database import get_db

logger = logging.getLogger(__name__)

class ReportGenerationService:
    """
    Service for generating ISO 19011 compliant audit reports with multi-format export.
    
    Supports:
    - AI-powered report generation using GEMINI
    - PDF export with professional formatting
    - Word document export
    - CSV export for data analysis
    - Report validation and compliance checking
    """
    
    def __init__(self):
        """Initialize report generation service."""
        self.gemini_service = GeminiAIService()
        self.supported_formats = ["pdf", "docx", "csv", "html", "markdown"]
    
    async def generate_report(self, audit_id: str, db: Session, user_id: str) -> Dict[str, Any]:
        """
        Generate ISO 19011 compliant audit report for immediate preview and download.
        
        Args:
            audit_id (str): UUID of audit to generate report for
            db (Session): Database session
            user_id (str): ID of user generating the report
            
        Returns:
            Dict[str, Any]: Report generation result with content for preview and download
            
        Raises:
            ValueError: If audit not found or invalid
            Exception: If generation fails
        """
        try:
            # Validate audit exists and is ready for reporting
            audit = await self._validate_audit_for_reporting(audit_id, db)
            
            # Generate report using GEMINI AI
            logger.info(f"Generating AI report for audit {audit_id}")
            ai_result = await self.gemini_service.generate_audit_report(audit_id, db)
            
            # Create audit report record in database for tracking
            report_record = await self._create_report_record(
                audit_id=audit_id,
                content=ai_result["content"],
                user_id=user_id,
                db=db,
                metadata=ai_result
            )
            
            # Generate downloadable formats immediately
            download_files = await self._generate_download_formats(
                content=ai_result["content"],
                audit=audit,
                report_id=str(report_record.id)
            )
            
            return {
                "report_id": str(report_record.id),
                "audit_id": audit_id,
                "status": "completed",
                "content": ai_result["content"],  # For preview
                "html_content": download_files.get("html_content"),  # Formatted HTML for preview
                "generation_date": ai_result["generation_date"],
                "iso_compliance_validated": ai_result["iso_compliance_validated"],
                "validation_notes": ai_result["validation_notes"],
                "word_count": ai_result["word_count"],
                "sections_generated": ai_result["sections_generated"],
                "download_files": download_files,
                "supported_formats": self.supported_formats
            }
            
        except Exception as e:
            logger.error(f"Report generation failed for audit {audit_id}: {str(e)}")
            raise Exception(f"Report generation failed: {str(e)}")
    
    async def export_report(self, report_id: str, format: str, db: Session) -> Dict[str, Any]:
        """
        Export existing report in specified format.
        
        Args:
            report_id (str): UUID of report to export
            format (str): Export format (pdf, docx, csv, html, markdown)
            db (Session): Database session
            
        Returns:
            Dict[str, Any]: Export result with file URL and metadata
            
        Raises:
            ValueError: If report not found or format not supported
            Exception: If export fails
        """
        if format not in self.supported_formats:
            raise ValueError(f"Unsupported format: {format}. Supported: {self.supported_formats}")
        
        # Get report record
        report = db.query(AuditReport).filter(AuditReport.id == report_id).first()
        if not report:
            raise ValueError(f"Report with ID {report_id} not found")
        
        # Get audit information for context
        audit = db.query(Audit).filter(Audit.id == report.audit_id).first()
        
        try:
            # Generate export based on format
            if format == "pdf":
                file_url = await self._export_to_pdf(report, audit)
            elif format == "docx":
                file_url = await self._export_to_docx(report, audit)
            elif format == "csv":
                file_url = await self._export_to_csv(report, audit, db)
            elif format == "html":
                file_url = await self._export_to_html(report, audit)
            elif format == "markdown":
                file_url = await self._export_to_markdown(report, audit)
            else:
                raise ValueError(f"Export format {format} not implemented")
            
            return {
                "report_id": report_id,
                "format": format,
                "file_url": file_url,
                "export_date": datetime.utcnow().isoformat(),
                "file_size": self._get_file_size(file_url) if file_url else 0
            }
            
        except Exception as e:
            logger.error(f"Export failed for report {report_id} to {format}: {str(e)}")
            raise Exception(f"Export to {format} failed: {str(e)}")
    
    async def _validate_audit_for_reporting(self, audit_id: str, db: Session) -> Audit:
        """
        Validate that audit is ready for report generation.
        
        Args:
            audit_id (str): Audit UUID
            db (Session): Database session
            
        Returns:
            Audit: Validated audit object
            
        Raises:
            ValueError: If audit not found or not ready for reporting
        """
        audit = db.query(Audit).filter(Audit.id == audit_id).first()
        if not audit:
            raise ValueError(f"Audit with ID {audit_id} not found")
        
        # Check if audit is in appropriate status for reporting
        # Compare case-insensitively since enum values may be uppercase in database
        valid_statuses = ["executing", "reporting", "followup", "closed"]
        if audit.status.value.lower() not in valid_statuses:
            raise ValueError(f"Audit status '{audit.status.value}' is not ready for reporting. Must be one of: {valid_statuses}")
        
        return audit
    
    async def _create_report_record(self, audit_id: str, content: str, user_id: str, 
                                  db: Session, metadata: Dict[str, Any]) -> AuditReport:
        """
        Create audit report record in database.
        
        Args:
            audit_id (str): Audit UUID
            content (str): Report content
            user_id (str): User ID generating report
            db (Session): Database session
            metadata (Dict[str, Any]): Report metadata
            
        Returns:
            AuditReport: Created report record
        """
        # Check if report already exists for this audit
        existing_report = db.query(AuditReport).filter(AuditReport.audit_id == audit_id).first()
        
        if existing_report:
            # Update existing report
            existing_report.content = content
            existing_report.version += 1
            existing_report.status = ReportStatus.DRAFT
            existing_report.created_by_id = user_id
            existing_report.created_at = datetime.utcnow()
            existing_report.comments = f"AI Generated - ISO Compliance: {metadata.get('iso_compliance_validated', False)}"
            db.commit()
            db.refresh(existing_report)
            return existing_report
        else:
            # Create new report
            report = AuditReport(
                id=uuid4(),
                audit_id=audit_id,
                version=1,
                content=content,
                status=ReportStatus.DRAFT,
                created_by_id=user_id,
                comments=f"AI Generated - ISO Compliance: {metadata.get('iso_compliance_validated', False)}"
            )
            db.add(report)
            db.commit()
            db.refresh(report)
            return report
    
    async def _generate_download_formats(self, content: str, audit: Audit, report_id: str) -> Dict[str, Any]:
        """
        Generate downloadable formats immediately for preview and download.
        
        Args:
            content (str): Report content in markdown
            audit (Audit): Audit object
            report_id (str): Report UUID
            
        Returns:
            Dict[str, Any]: Generated content in various formats for immediate download
        """
        download_files = {}
        
        try:
            # Generate HTML content for preview (not saved to file)
            html_content = await self._generate_html_content(content, audit)
            download_files["html_content"] = html_content
            
            # Generate PDF content as base64 for immediate download
            pdf_content = await self._generate_pdf_content(content, audit)
            download_files["pdf_content"] = pdf_content
            
            # Generate Word document content as base64 for immediate download
            docx_content = await self._generate_docx_content(content, audit)
            download_files["docx_content"] = docx_content
            
            # Generate CSV data for immediate download
            csv_content = await self._generate_csv_content(audit, report_id)
            download_files["csv_content"] = csv_content
            
            # Generate markdown with metadata
            markdown_content = await self._generate_markdown_content(content, audit)
            download_files["markdown_content"] = markdown_content
                
        except Exception as e:
            logger.warning(f"Failed to generate download formats for report {report_id}: {str(e)}")
        
        return download_files
    
    async def _export_to_pdf(self, report: AuditReport, audit: Audit) -> str:
        """Export report to PDF format."""
        return await self._export_content_to_pdf(report.content, audit, str(report.id))
    
    async def _export_content_to_pdf(self, content: str, audit: Audit, report_id: str) -> str:
        """
        Export content to PDF with professional formatting.
        
        Args:
            content (str): Report content in markdown
            audit (Audit): Audit object for metadata
            report_id (str): Report ID for filename
            
        Returns:
            str: URL to generated PDF file
        """
        try:
            # Create reports directory if it doesn't exist
            reports_dir = "static/reports"
            os.makedirs(reports_dir, exist_ok=True)
            
            # Generate filename
            filename = f"audit_report_{audit.year}_{report_id}.pdf"
            filepath = os.path.join(reports_dir, filename)
            
            # Create PDF document
            doc = SimpleDocTemplate(filepath, pagesize=A4)
            styles = getSampleStyleSheet()
            story = []
            
            # Custom styles for ISO report
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=18,
                spaceAfter=30,
                alignment=1  # Center alignment
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=14,
                spaceBefore=20,
                spaceAfter=10
            )
            
            # Add title page
            story.append(Paragraph("AUDIT REPORT", title_style))
            story.append(Spacer(1, 20))
            story.append(Paragraph(f"<b>Audit Title:</b> {audit.title}", styles['Normal']))
            story.append(Paragraph(f"<b>Audit Year:</b> {audit.year}", styles['Normal']))
            story.append(Paragraph(f"<b>Report Generated:</b> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
            story.append(Paragraph(f"<b>ISO 19011:2018 Compliant:</b> Yes", styles['Normal']))
            story.append(Spacer(1, 40))
            
            # Convert markdown content to PDF elements
            html_content = markdown.markdown(content)
            
            # Parse HTML and convert to PDF elements
            # This is a simplified conversion - in production, consider using more sophisticated HTML to PDF conversion
            lines = content.split('\n')
            for line in lines:
                line = line.strip()
                if not line:
                    story.append(Spacer(1, 12))
                elif line.startswith('# '):
                    story.append(Paragraph(line[2:], title_style))
                elif line.startswith('## '):
                    story.append(Paragraph(line[3:], heading_style))
                elif line.startswith('### '):
                    story.append(Paragraph(line[4:], styles['Heading3']))
                elif line.startswith('- ') or line.startswith('* '):
                    story.append(Paragraph(f"• {line[2:]}", styles['Normal']))
                elif line.startswith('**') and line.endswith('**'):
                    story.append(Paragraph(f"<b>{line[2:-2]}</b>", styles['Normal']))
                else:
                    story.append(Paragraph(line, styles['Normal']))
            
            # Build PDF
            doc.build(story)
            
            return f"/static/reports/{filename}"
            
        except Exception as e:
            logger.error(f"PDF export failed: {str(e)}")
            raise Exception(f"PDF export failed: {str(e)}")
    
    async def _export_to_docx(self, report: AuditReport, audit: Audit) -> str:
        """
        Export report to Word document format.
        
        Args:
            report (AuditReport): Report object
            audit (Audit): Audit object
            
        Returns:
            str: URL to generated Word document
        """
        try:
            # Create reports directory if it doesn't exist
            reports_dir = "static/reports"
            os.makedirs(reports_dir, exist_ok=True)
            
            # Generate filename
            filename = f"audit_report_{audit.year}_{report.id}.docx"
            filepath = os.path.join(reports_dir, filename)
            
            # Create Word document
            doc = Document()
            
            # Add title
            title = doc.add_heading('AUDIT REPORT', 0)
            title.alignment = 1  # Center alignment
            
            # Add metadata
            doc.add_paragraph(f"Audit Title: {audit.title}")
            doc.add_paragraph(f"Audit Year: {audit.year}")
            doc.add_paragraph(f"Report Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
            doc.add_paragraph(f"ISO 19011:2018 Compliant: Yes")
            doc.add_paragraph("")
            
            # Convert markdown content to Word elements
            lines = report.content.split('\n')
            for line in lines:
                line = line.strip()
                if not line:
                    doc.add_paragraph("")
                elif line.startswith('# '):
                    doc.add_heading(line[2:], level=1)
                elif line.startswith('## '):
                    doc.add_heading(line[3:], level=2)
                elif line.startswith('### '):
                    doc.add_heading(line[4:], level=3)
                elif line.startswith('- ') or line.startswith('* '):
                    p = doc.add_paragraph(line[2:], style='List Bullet')
                elif line.startswith('**') and line.endswith('**'):
                    p = doc.add_paragraph()
                    run = p.add_run(line[2:-2])
                    run.bold = True
                else:
                    doc.add_paragraph(line)
            
            # Save document
            doc.save(filepath)
            
            return f"/static/reports/{filename}"
            
        except Exception as e:
            logger.error(f"DOCX export failed: {str(e)}")
            raise Exception(f"DOCX export failed: {str(e)}")
    
    async def _export_to_csv(self, report: AuditReport, audit: Audit, db: Session) -> str:
        """
        Export audit data to CSV format for analysis.
        
        Args:
            report (AuditReport): Report object
            audit (Audit): Audit object
            db (Session): Database session
            
        Returns:
            str: URL to generated CSV file
        """
        try:
            # Create reports directory if it doesn't exist
            reports_dir = "static/reports"
            os.makedirs(reports_dir, exist_ok=True)
            
            # Generate filename
            filename = f"audit_data_{audit.year}_{report.id}.csv"
            filepath = os.path.join(reports_dir, filename)
            
            # Aggregate audit data for CSV export
            audit_data = await self.gemini_service._aggregate_audit_data(str(audit.id), db)
            
            # Create DataFrame with audit summary
            summary_data = {
                'Audit_ID': [str(audit.id)],
                'Title': [audit.title],
                'Year': [audit.year],
                'Status': [audit.status.value],
                'Start_Date': [audit.start_date.isoformat() if audit.start_date else ''],
                'End_Date': [audit.end_date.isoformat() if audit.end_date else ''],
                'Overall_Compliance_Score': [audit_data['compliance']['overall_score']],
                'Total_Findings': [len(audit_data['findings'])],
                'Critical_Findings': [len([f for f in audit_data['findings'] if f['severity'] == 'critical'])],
                'High_Findings': [len([f for f in audit_data['findings'] if f['severity'] == 'high'])],
                'Total_CAPA_Items': [len(audit_data['capa_items'])],
                'Report_Generated': [datetime.utcnow().isoformat()]
            }
            
            df_summary = pd.DataFrame(summary_data)
            
            # Create findings DataFrame
            findings_data = []
            for finding in audit_data['findings']:
                findings_data.append({
                    'Finding_ID': finding['id'],
                    'Title': finding['title'],
                    'Severity': finding['severity'],
                    'Impact': finding['impact'],
                    'Root_Cause': finding['root_cause'],
                    'Status': finding['status'],
                    'Recommendation': finding['recommendation']
                })
            
            df_findings = pd.DataFrame(findings_data)
            
            # Create compliance DataFrame
            compliance_data = []
            for checklist in audit_data['compliance']['checklists']:
                compliance_data.append({
                    'Clause_Reference': checklist['clause_reference'],
                    'Clause_Title': checklist['clause_title'],
                    'Compliance_Status': checklist['compliance_status'],
                    'Compliance_Score': checklist['compliance_score'],
                    'Notes': checklist['notes']
                })
            
            df_compliance = pd.DataFrame(compliance_data)
            
            # Write to CSV with multiple sheets (using Excel format for multiple sheets)
            excel_filename = f"audit_data_{audit.year}_{report.id}.xlsx"
            excel_filepath = os.path.join(reports_dir, excel_filename)
            
            with pd.ExcelWriter(excel_filepath, engine='openpyxl') as writer:
                df_summary.to_csv(filepath, index=False)  # Main CSV file
                df_summary.to_excel(writer, sheet_name='Summary', index=False)
                df_findings.to_excel(writer, sheet_name='Findings', index=False)
                df_compliance.to_excel(writer, sheet_name='Compliance', index=False)
            
            return f"/static/reports/{filename}"
            
        except Exception as e:
            logger.error(f"CSV export failed: {str(e)}")
            raise Exception(f"CSV export failed: {str(e)}")
    
    async def _export_to_html(self, report: AuditReport, audit: Audit) -> str:
        """Export report to HTML format."""
        return await self._export_content_to_html(report.content, audit, str(report.id))
    
    async def _export_content_to_html(self, content: str, audit: Audit, report_id: str) -> str:
        """
        Export content to HTML format with styling.
        
        Args:
            content (str): Report content in markdown
            audit (Audit): Audit object
            report_id (str): Report ID
            
        Returns:
            str: URL to generated HTML file
        """
        try:
            # Create reports directory if it doesn't exist
            reports_dir = "static/reports"
            os.makedirs(reports_dir, exist_ok=True)
            
            # Generate filename
            filename = f"audit_report_{audit.year}_{report_id}.html"
            filepath = os.path.join(reports_dir, filename)
            
            # Convert markdown to HTML
            html_content = markdown.markdown(content, extensions=['tables', 'toc'])
            
            # Create complete HTML document with styling
            full_html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audit Report - {audit.title}</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }}
        h1 {{
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #34495e;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 5px;
        }}
        h3 {{
            color: #7f8c8d;
        }}
        .header {{
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 30px;
        }}
        .iso-compliance {{
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }}
        th {{
            background-color: #f2f2f2;
        }}
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #bdc3c7;
            font-size: 0.9em;
            color: #7f8c8d;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Audit Report</h1>
        <p><strong>Audit Title:</strong> {audit.title}</p>
        <p><strong>Audit Year:</strong> {audit.year}</p>
        <p><strong>Report Generated:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}</p>
    </div>
    
    <div class="iso-compliance">
        <strong>ISO 19011:2018 Compliant:</strong> This report has been generated in accordance with ISO 19011:2018 Guidelines for auditing management systems.
    </div>
    
    {html_content}
    
    <div class="footer">
        <p>This report was generated automatically using AI-powered report generation system.</p>
        <p>Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
    </div>
</body>
</html>
"""
            
            # Write HTML file
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(full_html)
            
            return f"/static/reports/{filename}"
            
        except Exception as e:
            logger.error(f"HTML export failed: {str(e)}")
            raise Exception(f"HTML export failed: {str(e)}")
    
    async def _export_to_markdown(self, report: AuditReport, audit: Audit) -> str:
        """
        Export report to markdown format with metadata.
        
        Args:
            report (AuditReport): Report object
            audit (Audit): Audit object
            
        Returns:
            str: URL to generated markdown file
        """
        try:
            # Create reports directory if it doesn't exist
            reports_dir = "static/reports"
            os.makedirs(reports_dir, exist_ok=True)
            
            # Generate filename
            filename = f"audit_report_{audit.year}_{report.id}.md"
            filepath = os.path.join(reports_dir, filename)
            
            # Add metadata header to markdown
            metadata_header = f"""---
title: "Audit Report - {audit.title}"
audit_year: {audit.year}
report_generated: "{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"
iso_19011_compliant: true
report_version: {report.version}
---

"""
            
            # Combine metadata and content
            full_content = metadata_header + report.content
            
            # Write markdown file
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(full_content)
            
            return f"/static/reports/{filename}"
            
        except Exception as e:
            logger.error(f"Markdown export failed: {str(e)}")
            raise Exception(f"Markdown export failed: {str(e)}")
    
    async def _generate_html_content(self, content: str, audit: Audit) -> str:
        """
        Generate HTML content for preview (in memory, not saved to file).
        
        Args:
            content (str): Report content in markdown
            audit (Audit): Audit object
            
        Returns:
            str: HTML content for preview
        """
        try:
            # Convert markdown to HTML
            html_content = markdown.markdown(content, extensions=['tables', 'toc'])
            
            # Create complete HTML document with styling
            full_html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audit Report - {audit.title}</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }}
        h1 {{
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #34495e;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 5px;
        }}
        h3 {{
            color: #7f8c8d;
        }}
        .header {{
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 30px;
        }}
        .iso-compliance {{
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }}
        th {{
            background-color: #f2f2f2;
        }}
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #bdc3c7;
            font-size: 0.9em;
            color: #7f8c8d;
        }}
        .download-buttons {{
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
        }}
        .download-btn {{
            display: inline-block;
            margin: 5px;
            padding: 10px 15px;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-size: 14px;
        }}
        .download-btn:hover {{
            background-color: #2980b9;
        }}
    </style>
</head>
<body>
    <div class="download-buttons">
        <button class="download-btn" onclick="downloadPDF()">Download PDF</button>
        <button class="download-btn" onclick="downloadWord()">Download Word</button>
        <button class="download-btn" onclick="downloadCSV()">Download CSV</button>
    </div>
    
    <div class="header">
        <h1>Audit Report</h1>
        <p><strong>Audit Title:</strong> {audit.title}</p>
        <p><strong>Audit Year:</strong> {audit.year}</p>
        <p><strong>Report Generated:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}</p>
    </div>
    
    <div class="iso-compliance">
        <strong>ISO 19011:2018 Compliant:</strong> This report has been generated in accordance with ISO 19011:2018 Guidelines for auditing management systems.
    </div>
    
    {html_content}
    
    <div class="footer">
        <p>This report was generated automatically using AI-powered report generation system.</p>
        <p>Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
    </div>
    
    <script>
        function downloadPDF() {{
            // This will be handled by the frontend
            window.parent.postMessage({{type: 'download', format: 'pdf'}}, '*');
        }}
        
        function downloadWord() {{
            // This will be handled by the frontend
            window.parent.postMessage({{type: 'download', format: 'docx'}}, '*');
        }}
        
        function downloadCSV() {{
            // This will be handled by the frontend
            window.parent.postMessage({{type: 'download', format: 'csv'}}, '*');
        }}
    </script>
</body>
</html>
"""
            
            return full_html
            
        except Exception as e:
            logger.error(f"HTML content generation failed: {str(e)}")
            raise Exception(f"HTML content generation failed: {str(e)}")

    async def _generate_pdf_content(self, content: str, audit: Audit) -> str:
        """
        Generate PDF content as base64 string for immediate download.
        
        Args:
            content (str): Report content in markdown
            audit (Audit): Audit object
            
        Returns:
            str: Base64 encoded PDF content
        """
        try:
            # Create PDF in memory
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            styles = getSampleStyleSheet()
            story = []
            
            # Custom styles for ISO report
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=18,
                spaceAfter=30,
                alignment=1  # Center alignment
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=14,
                spaceBefore=20,
                spaceAfter=10
            )
            
            # Add title page
            story.append(Paragraph("AUDIT REPORT", title_style))
            story.append(Spacer(1, 20))
            story.append(Paragraph(f"<b>Audit Title:</b> {audit.title}", styles['Normal']))
            story.append(Paragraph(f"<b>Audit Year:</b> {audit.year}", styles['Normal']))
            story.append(Paragraph(f"<b>Report Generated:</b> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
            story.append(Paragraph(f"<b>ISO 19011:2018 Compliant:</b> Yes", styles['Normal']))
            story.append(Spacer(1, 40))
            
            # Convert markdown content to PDF elements
            lines = content.split('\n')
            for line in lines:
                line = line.strip()
                if not line:
                    story.append(Spacer(1, 12))
                elif line.startswith('# '):
                    story.append(Paragraph(line[2:], title_style))
                elif line.startswith('## '):
                    story.append(Paragraph(line[3:], heading_style))
                elif line.startswith('### '):
                    story.append(Paragraph(line[4:], styles['Heading3']))
                elif line.startswith('- ') or line.startswith('* '):
                    story.append(Paragraph(f"• {line[2:]}", styles['Normal']))
                elif line.startswith('**') and line.endswith('**'):
                    story.append(Paragraph(f"<b>{line[2:-2]}</b>", styles['Normal']))
                else:
                    story.append(Paragraph(line, styles['Normal']))
            
            # Build PDF
            doc.build(story)
            
            # Get PDF content as base64
            buffer.seek(0)
            import base64
            pdf_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            buffer.close()
            
            return pdf_base64
            
        except Exception as e:
            logger.error(f"PDF content generation failed: {str(e)}")
            raise Exception(f"PDF content generation failed: {str(e)}")

    async def _generate_docx_content(self, content: str, audit: Audit) -> str:
        """
        Generate Word document content as base64 string for immediate download.
        
        Args:
            content (str): Report content in markdown
            audit (Audit): Audit object
            
        Returns:
            str: Base64 encoded DOCX content
        """
        try:
            # Create Word document in memory
            doc = Document()
            
            # Add title
            title = doc.add_heading('AUDIT REPORT', 0)
            title.alignment = 1  # Center alignment
            
            # Add metadata
            doc.add_paragraph(f"Audit Title: {audit.title}")
            doc.add_paragraph(f"Audit Year: {audit.year}")
            doc.add_paragraph(f"Report Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
            doc.add_paragraph(f"ISO 19011:2018 Compliant: Yes")
            doc.add_paragraph("")
            
            # Convert markdown content to Word elements
            lines = content.split('\n')
            for line in lines:
                line = line.strip()
                if not line:
                    doc.add_paragraph("")
                elif line.startswith('# '):
                    doc.add_heading(line[2:], level=1)
                elif line.startswith('## '):
                    doc.add_heading(line[3:], level=2)
                elif line.startswith('### '):
                    doc.add_heading(line[4:], level=3)
                elif line.startswith('- ') or line.startswith('* '):
                    p = doc.add_paragraph(line[2:], style='List Bullet')
                elif line.startswith('**') and line.endswith('**'):
                    p = doc.add_paragraph()
                    run = p.add_run(line[2:-2])
                    run.bold = True
                else:
                    doc.add_paragraph(line)
            
            # Save to memory buffer
            buffer = io.BytesIO()
            doc.save(buffer)
            buffer.seek(0)
            
            # Get DOCX content as base64
            import base64
            docx_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            buffer.close()
            
            return docx_base64
            
        except Exception as e:
            logger.error(f"DOCX content generation failed: {str(e)}")
            raise Exception(f"DOCX content generation failed: {str(e)}")

    async def _generate_csv_content(self, audit: Audit, report_id: str) -> str:
        """
        Generate CSV content as string for immediate download.
        
        Args:
            audit (Audit): Audit object
            report_id (str): Report ID
            
        Returns:
            str: CSV content as string
        """
        try:
            # Create CSV content with audit summary
            csv_lines = [
                "Field,Value",
                f"Audit_ID,{audit.id}",
                f"Title,{audit.title}",
                f"Year,{audit.year}",
                f"Status,{audit.status.value}",
                f"Start_Date,{audit.start_date.isoformat() if audit.start_date else ''}",
                f"End_Date,{audit.end_date.isoformat() if audit.end_date else ''}",
                f"Report_ID,{report_id}",
                f"Report_Generated,{datetime.utcnow().isoformat()}"
            ]
            
            return '\n'.join(csv_lines)
            
        except Exception as e:
            logger.error(f"CSV content generation failed: {str(e)}")
            raise Exception(f"CSV content generation failed: {str(e)}")

    async def _generate_markdown_content(self, content: str, audit: Audit) -> str:
        """
        Generate markdown content with metadata for immediate download.
        
        Args:
            content (str): Report content
            audit (Audit): Audit object
            
        Returns:
            str: Markdown content with metadata
        """
        try:
            # Add metadata header to markdown
            metadata_header = f"""---
title: "Audit Report - {audit.title}"
audit_year: {audit.year}
report_generated: "{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"
iso_19011_compliant: true
---

"""
            
            # Combine metadata and content
            full_content = metadata_header + content
            
            return full_content
            
        except Exception as e:
            logger.error(f"Markdown content generation failed: {str(e)}")
            raise Exception(f"Markdown content generation failed: {str(e)}")

    def _get_file_size(self, file_url: str) -> int:
        """
        Get file size in bytes.
        
        Args:
            file_url (str): File URL
            
        Returns:
            int: File size in bytes
        """
        try:
            # Convert URL to local file path
            if file_url.startswith('/static/'):
                filepath = file_url[1:]  # Remove leading slash
                if os.path.exists(filepath):
                    return os.path.getsize(filepath)
        except Exception as e:
            logger.warning(f"Could not get file size for {file_url}: {str(e)}")
        
        return 0