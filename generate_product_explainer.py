"""
Galaxy ISO Audit Management System - Product Explainer PDF Generator
Generates a comprehensive product explainer document in PDF format
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, ListFlowable, ListItem
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from datetime import datetime

def create_product_explainer():
    """Generate the Product Explainer PDF"""
    
    doc = SimpleDocTemplate(
        "Product_Explainer.pdf",
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1a365d')
    )
    
    heading1_style = ParagraphStyle(
        'CustomHeading1',
        parent=styles['Heading1'],
        fontSize=16,
        spaceBefore=20,
        spaceAfter=12,
        textColor=colors.HexColor('#2c5282')
    )
    
    heading2_style = ParagraphStyle(
        'CustomHeading2',
        parent=styles['Heading2'],
        fontSize=13,
        spaceBefore=15,
        spaceAfter=8,
        textColor=colors.HexColor('#2d3748')
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=8,
        alignment=TA_JUSTIFY,
        leading=14
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=20,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#4a5568')
    )
    
    story = []
    
    # Title Page
    story.append(Spacer(1, 2*inch))
    story.append(Paragraph("Galaxy ISO Audit Management System", title_style))
    story.append(Paragraph("Product Explainer", subtitle_style))
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("Enterprise Audit Workflow Digitization Platform", subtitle_style))
    story.append(Spacer(1, 2*inch))
    story.append(Paragraph(f"Version 1.0", body_style))
    story.append(Paragraph(f"Date: {datetime.now().strftime('%B %d, %Y')}", body_style))
    story.append(PageBreak())
    
    # Table of Contents
    story.append(Paragraph("Table of Contents", heading1_style))
    story.append(Spacer(1, 0.2*inch))
    
    toc_items = [
        "1. Executive Summary",
        "2. What is Galaxy Audit System",
        "3. Key Benefits",
        "4. Core Features",
        "5. User Roles and Access",
        "6. The Audit Lifecycle",
        "7. Module Descriptions",
        "8. ISO Compliance",
        "9. Technical Architecture",
        "10. Security Features",
        "11. Getting Started"
    ]
    
    for item in toc_items:
        story.append(Paragraph(item, body_style))
    
    story.append(PageBreak())
    
    # Section 1: Executive Summary
    story.append(Paragraph("1. Executive Summary", heading1_style))
    story.append(Paragraph(
        "The Galaxy ISO Audit Management System is an enterprise-grade platform designed to digitize "
        "and streamline the entire organizational audit lifecycle. It replaces traditional paper-based "
        "audit processes with a modern, secure, and role-based digital solution that ensures compliance "
        "with international standards including ISO 19011, ISO 27001, ISO 9001, and other frameworks.",
        body_style
    ))
    story.append(Paragraph(
        "This system enables organizations to manage audits from initial planning through execution, "
        "reporting, follow-up, and final closure. It provides real-time visibility into audit status, "
        "findings, corrective actions, and compliance metrics through intuitive dashboards and analytics.",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    # Section 2: What is Galaxy Audit System
    story.append(Paragraph("2. What is Galaxy Audit System", heading1_style))
    story.append(Paragraph(
        "Galaxy Audit System is a comprehensive audit management platform that helps organizations:",
        body_style
    ))
    
    what_is_items = [
        ["Plan and schedule audits", "Create annual audit programmes with risk-based prioritization"],
        ["Execute audits efficiently", "Collect evidence, document findings, and track progress"],
        ["Generate reports", "AI-powered report generation with ISO-compliant formatting"],
        ["Manage corrective actions", "Track CAPA items from identification to closure"],
        ["Ensure compliance", "Built-in support for multiple ISO frameworks"],
        ["Analyze trends", "Dashboard analytics for continuous improvement"]
    ]
    
    what_is_table = Table(what_is_items, colWidths=[2*inch, 4*inch])
    what_is_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e2e8f0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2d3748')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0'))
    ]))
    story.append(what_is_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Section 3: Key Benefits
    story.append(Paragraph("3. Key Benefits", heading1_style))
    
    story.append(Paragraph("3.1 For Organizations", heading2_style))
    org_benefits = [
        "Reduced audit cycle time through automation and streamlined workflows",
        "Improved compliance with ISO standards and regulatory requirements",
        "Centralized repository for all audit documentation and evidence",
        "Real-time visibility into audit status and organizational risk posture",
        "Cost savings through elimination of paper-based processes",
        "Better decision-making with analytics and trend analysis"
    ]
    for benefit in org_benefits:
        story.append(Paragraph(f"- {benefit}", body_style))
    
    story.append(Paragraph("3.2 For Audit Teams", heading2_style))
    team_benefits = [
        "Structured workflow guidance following ISO 19011 methodology",
        "Easy evidence collection and management",
        "Collaborative tools for team-based audits",
        "AI-assisted report generation saves time",
        "Mobile-friendly interface for field audits",
        "Clear task assignments and progress tracking"
    ]
    for benefit in team_benefits:
        story.append(Paragraph(f"- {benefit}", body_style))
    
    story.append(Paragraph("3.3 For Management", heading2_style))
    mgmt_benefits = [
        "Executive dashboard with key performance indicators",
        "Risk heatmaps for quick risk assessment",
        "Compliance score tracking across frameworks",
        "Audit programme oversight and resource planning",
        "Trend analysis for continuous improvement initiatives"
    ]
    for benefit in mgmt_benefits:
        story.append(Paragraph(f"- {benefit}", body_style))
    
    story.append(PageBreak())
    
    # Section 4: Core Features
    story.append(Paragraph("4. Core Features", heading1_style))
    
    features = [
        ["Multi-Role Access Control", "Six distinct user roles with granular permissions ensure proper segregation of duties"],
        ["Complete Audit Lifecycle", "End-to-end support from planning through closure following ISO 19011"],
        ["Digital Working Papers", "Electronic evidence management with version control and timestamping"],
        ["Automated Workflows", "Multi-level approval processes for reports and documents"],
        ["Real-Time Collaboration", "Query threads between auditors and auditees"],
        ["AI-Powered Reports", "Automatic report generation using audit findings"],
        ["Risk Assessment", "5x5 risk matrix with likelihood and impact scoring"],
        ["CAPA Management", "Corrective and preventive action tracking with root cause analysis"],
        ["Document Control", "Centralized document library with approval workflows"],
        ["Analytics Dashboard", "Executive insights with charts, graphs, and KPIs"],
        ["Gap Analysis", "Compare current state against ISO requirements"],
        ["Asset Management", "Track organizational assets linked to audits and risks"]
    ]
    
    features_table = Table(features, colWidths=[2*inch, 4*inch])
    features_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#ebf8ff')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2d3748')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#bee3f8'))
    ]))
    story.append(features_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Section 5: User Roles
    story.append(Paragraph("5. User Roles and Access", heading1_style))
    story.append(Paragraph(
        "The system implements role-based access control (RBAC) with six predefined roles. "
        "Each role has specific permissions aligned with ISO requirements for segregation of duties.",
        body_style
    ))
    
    roles_data = [
        ["Role", "Description", "Key Permissions"],
        ["System Admin", "Full system access", "All features, user management, configuration"],
        ["Audit Manager", "Plans and oversees audits", "Create audits, assign teams, approve reports, analytics"],
        ["Auditor", "Conducts audits", "Execute audits, collect evidence, document findings"],
        ["Department Head", "Reviews findings", "View department audits, approve workflows, CAPA"],
        ["Department Officer", "Responds to audits", "View assigned audits, upload evidence, respond to queries"],
        ["Viewer", "Read-only access", "View audits and reports only"]
    ]
    
    roles_table = Table(roles_data, colWidths=[1.3*inch, 1.7*inch, 3*inch])
    roles_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5282')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#a0aec0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')])
    ]))
    story.append(roles_table)
    story.append(PageBreak())
    
    # Section 6: Audit Lifecycle
    story.append(Paragraph("6. The Audit Lifecycle", heading1_style))
    story.append(Paragraph(
        "The system follows the ISO 19011 audit methodology with seven distinct phases:",
        body_style
    ))
    
    lifecycle_data = [
        ["Phase", "ISO Reference", "Activities"],
        ["1. Planned", "Clause 6.2", "Audit is scheduled in the annual programme"],
        ["2. Initiated", "Clause 6.2", "Define objectives, scope, criteria, assign team"],
        ["3. Preparation", "Clause 6.3", "Create checklists, request documents, plan interviews"],
        ["4. Executing", "Clause 6.4", "Collect evidence, conduct interviews, document findings"],
        ["5. Reporting", "Clause 6.5", "Generate report, submit for approval"],
        ["6. Follow-up", "Clause 6.6", "Track corrective actions, verify implementation"],
        ["7. Closed", "-", "All actions complete, audit archived"]
    ]
    
    lifecycle_table = Table(lifecycle_data, colWidths=[1.2*inch, 1.2*inch, 3.6*inch])
    lifecycle_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5282')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#a0aec0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')])
    ]))
    story.append(lifecycle_table)
    story.append(Spacer(1, 0.3*inch))
    
    story.append(Paragraph("Audit Workflow Summary", heading2_style))
    story.append(Paragraph(
        "Planning: Create audit in the system with title, scope, and risk rating. "
        "Initiation: Define detailed objectives, criteria, and methodology. "
        "Team Assignment: Assign lead auditor and team members with specific roles. "
        "Preparation: Create checklists, send document requests, conduct risk assessment. "
        "Execution: Collect evidence, document observations, record findings. "
        "Reporting: Generate AI-assisted report, route through approval workflow. "
        "Follow-up: Create CAPA items, assign responsible persons, track completion. "
        "Closure: Verify all actions complete, finalize and archive the audit.",
        body_style
    ))
    story.append(PageBreak())
    
    # Section 7: Module Descriptions
    story.append(Paragraph("7. Module Descriptions", heading1_style))
    
    modules = [
        ("Dashboard", "Provides a real-time overview of your audit programme including audit status distribution, open findings by severity, risk heatmap, compliance scores, CAPA status, and overdue follow-ups."),
        ("Audits", "Central hub for managing individual audits through their complete lifecycle. Includes sub-sections for initiation, team assignment, preparation, work program, evidence, findings, queries, reports, and follow-up."),
        ("Workflows", "Manages approval processes for audit reports and documents. Supports actions including approve, reject, return, sign, review, and acknowledge."),
        ("Planning", "Annual audit programme management with risk-based scheduling, resource allocation, and audit prioritization."),
        ("Reports", "Generate and manage audit reports with AI-powered content generation, version control, and export capabilities."),
        ("Follow-ups", "Track corrective actions across all audits with status filtering, due date management, and completion verification."),
        ("Risk Assessment", "Identify and assess risks using a 5x5 matrix. Calculate risk scores, define mitigation plans, and link controls to risks."),
        ("CAPA Management", "Manage Corrective and Preventive Actions with root cause analysis, progress tracking, and effectiveness review."),
        ("Documents", "Central document library with version control, approval workflows, expiry tracking, and confidentiality levels."),
        ("Assets", "Manage organizational assets including hardware, software, data, people, facilities, and services."),
        ("Vendors", "Third-party vendor management with risk ratings, compliance tracking, and contract management."),
        ("Analytics", "Advanced reporting and trend analysis including audit completion trends, finding trends, and compliance scores."),
        ("Access Control", "Fine-grained permission management with team assignment, user management, audit visibility, and role matrix.")
    ]
    
    for module_name, module_desc in modules:
        story.append(Paragraph(f"{module_name}", heading2_style))
        story.append(Paragraph(module_desc, body_style))
    
    story.append(PageBreak())
    
    # Section 8: ISO Compliance
    story.append(Paragraph("8. ISO Compliance", heading1_style))
    story.append(Paragraph(
        "The Galaxy Audit System is designed to support compliance with multiple international standards:",
        body_style
    ))
    
    iso_data = [
        ["Standard", "Coverage"],
        ["ISO 19011:2018", "Complete audit methodology from planning to follow-up"],
        ["ISO 27001", "Information security controls, risk assessment, CAPA"],
        ["ISO 9001", "Quality management, document control, corrective actions"],
        ["ISO 31000", "Risk management framework and assessment"],
        ["ISO 22301", "Business continuity management"],
        ["COBIT 5", "IT governance framework support"],
        ["NIST", "Cybersecurity framework alignment"]
    ]
    
    iso_table = Table(iso_data, colWidths=[1.5*inch, 4.5*inch])
    iso_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5282')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#a0aec0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')])
    ]))
    story.append(iso_table)
    story.append(Spacer(1, 0.3*inch))
    
    story.append(Paragraph("Built-in Compliance Features", heading2_style))
    compliance_features = [
        "EARS-compliant requirements documentation",
        "ISO-structured audit checklists with clause references",
        "Evidence upload with automatic timestamping",
        "Complete audit trail logging",
        "Segregation of duties through role-based access",
        "Document control with version history",
        "Gap analysis against ISO requirements",
        "CAPA tracking with root cause analysis"
    ]
    for feature in compliance_features:
        story.append(Paragraph(f"- {feature}", body_style))
    
    story.append(PageBreak())
    
    # Section 9: Technical Architecture
    story.append(Paragraph("9. Technical Architecture", heading1_style))
    
    story.append(Paragraph("9.1 Technology Stack", heading2_style))
    
    tech_data = [
        ["Component", "Technology"],
        ["Backend Framework", "FastAPI (Python)"],
        ["Frontend Framework", "Next.js 14 with React"],
        ["Database", "PostgreSQL (Supabase)"],
        ["Authentication", "JWT Token-based"],
        ["ORM", "SQLAlchemy"],
        ["Styling", "TailwindCSS"],
        ["State Management", "Zustand"],
        ["API Client", "Axios with React Query"]
    ]
    
    tech_table = Table(tech_data, colWidths=[2*inch, 4*inch])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5282')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#a0aec0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')])
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("9.2 Architecture Highlights", heading2_style))
    arch_highlights = [
        "Stateless architecture with no file storage in database",
        "RESTful API design with comprehensive documentation",
        "Responsive web interface accessible from any device",
        "Scalable cloud-native deployment options",
        "Database migrations managed through Alembic",
        "Type-safe development with TypeScript and Pydantic"
    ]
    for highlight in arch_highlights:
        story.append(Paragraph(f"- {highlight}", body_style))
    
    # Section 10: Security Features
    story.append(Paragraph("10. Security Features", heading1_style))
    
    security_features = [
        ["JWT Authentication", "Secure token-based authentication with configurable expiration"],
        ["Role-Based Access", "Granular permissions based on user roles"],
        ["Audit Trail", "Complete logging of all user actions with timestamps"],
        ["Input Validation", "Server-side validation using Pydantic schemas"],
        ["SQL Injection Prevention", "ORM-based queries prevent injection attacks"],
        ["XSS Protection", "Built-in cross-site scripting prevention"],
        ["CORS Configuration", "Controlled cross-origin resource sharing"],
        ["HTTPS Support", "SSL/TLS encryption for data in transit"]
    ]
    
    security_table = Table(security_features, colWidths=[2*inch, 4*inch])
    security_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#fef3c7')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2d3748')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#fcd34d'))
    ]))
    story.append(security_table)
    story.append(PageBreak())
    
    # Section 11: Getting Started
    story.append(Paragraph("11. Getting Started", heading1_style))
    
    story.append(Paragraph("11.1 System Requirements", heading2_style))
    requirements = [
        "Modern web browser (Chrome, Firefox, Safari, Edge)",
        "Internet connection",
        "Valid user account with assigned role"
    ]
    for req in requirements:
        story.append(Paragraph(f"- {req}", body_style))
    
    story.append(Paragraph("11.2 First Steps", heading2_style))
    first_steps = [
        "1. Navigate to the system URL provided by your administrator",
        "2. Enter your email address on the login page",
        "3. Complete authentication (password or two-factor if enabled)",
        "4. You will be directed to the Dashboard",
        "5. Explore the sidebar menu to access different modules",
        "6. Your available features depend on your assigned role"
    ]
    for step in first_steps:
        story.append(Paragraph(step, body_style))
    
    story.append(Paragraph("11.3 Quick Tips", heading2_style))
    tips = [
        "Check the Dashboard daily for overdue items and pending tasks",
        "Use the Workflows section to see tasks requiring your action",
        "Upload evidence for every finding to maintain audit quality",
        "Create CAPA items promptly for non-conformities",
        "Use the Analytics section to track improvement trends",
        "Contact your System Administrator for access issues"
    ]
    for tip in tips:
        story.append(Paragraph(f"- {tip}", body_style))
    
    story.append(Spacer(1, 0.5*inch))
    
    # Footer
    story.append(Paragraph("Support", heading2_style))
    story.append(Paragraph(
        "For technical support, training requests, or feature inquiries, please contact your "
        "System Administrator or the IT Help Desk.",
        body_style
    ))
    
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph(
        "This system follows ISO 19011:2018 Guidelines for auditing management systems.",
        ParagraphStyle('Footer', parent=body_style, alignment=TA_CENTER, textColor=colors.HexColor('#718096'))
    ))
    
    # Build PDF
    doc.build(story)
    print("Product Explainer PDF generated successfully: Product_Explainer.pdf")

if __name__ == "__main__":
    create_product_explainer()
