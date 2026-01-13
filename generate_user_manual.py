"""
Galaxy ISO Audit Management System - User Manual PDF Generator
Generates a comprehensive, professional user manual in PDF format
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    PageBreak, ListFlowable, ListItem, Image, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from datetime import datetime
import os

# Page dimensions
PAGE_WIDTH, PAGE_HEIGHT = A4

def create_styles():
    """Create custom paragraph styles for the document"""
    styles = getSampleStyleSheet()
    
    # Title style
    styles.add(ParagraphStyle(
        name='MainTitle',
        parent=styles['Heading1'],
        fontSize=28,
        spaceAfter=30,
        spaceBefore=50,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1a365d'),
        fontName='Helvetica-Bold'
    ))
    
    # Subtitle style
    styles.add(ParagraphStyle(
        name='Subtitle',
        parent=styles['Normal'],
        fontSize=14,
        spaceAfter=20,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#4a5568'),
        fontName='Helvetica'
    ))
    
    # Chapter title
    styles.add(ParagraphStyle(
        name='ChapterTitle',
        parent=styles['Heading1'],
        fontSize=20,
        spaceBefore=20,
        spaceAfter=15,
        textColor=colors.HexColor('#2d3748'),
        fontName='Helvetica-Bold',
        borderWidth=0,
        borderPadding=0,
        borderColor=colors.HexColor('#3182ce'),
        borderRadius=None
    ))
    
    # Section title
    styles.add(ParagraphStyle(
        name='SectionTitle',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=15,
        spaceAfter=10,
        textColor=colors.HexColor('#2d3748'),
        fontName='Helvetica-Bold'
    ))
    
    # Subsection title
    styles.add(ParagraphStyle(
        name='SubsectionTitle',
        parent=styles['Heading3'],
        fontSize=12,
        spaceBefore=10,
        spaceAfter=8,
        textColor=colors.HexColor('#4a5568'),
        fontName='Helvetica-Bold'
    ))
    
    # Body text
    styles.add(ParagraphStyle(
        name='CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        spaceBefore=4,
        spaceAfter=8,
        alignment=TA_JUSTIFY,
        textColor=colors.HexColor('#2d3748'),
        fontName='Helvetica',
        leading=14
    ))
    
    # Bullet point
    styles.add(ParagraphStyle(
        name='BulletText',
        parent=styles['Normal'],
        fontSize=10,
        spaceBefore=2,
        spaceAfter=2,
        leftIndent=20,
        textColor=colors.HexColor('#2d3748'),
        fontName='Helvetica',
        leading=13
    ))
    
    # Note/Tip style
    styles.add(ParagraphStyle(
        name='NoteText',
        parent=styles['Normal'],
        fontSize=9,
        spaceBefore=8,
        spaceAfter=8,
        leftIndent=15,
        rightIndent=15,
        textColor=colors.HexColor('#2c5282'),
        fontName='Helvetica-Oblique',
        backColor=colors.HexColor('#ebf8ff'),
        borderPadding=8,
        leading=12
    ))
    
    # Table header
    styles.add(ParagraphStyle(
        name='TableHeader',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.white,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    ))
    
    # Table cell
    styles.add(ParagraphStyle(
        name='TableCell',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#2d3748'),
        fontName='Helvetica',
        leading=11
    ))
    
    # Footer
    styles.add(ParagraphStyle(
        name='Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#718096'),
        alignment=TA_CENTER
    ))
    
    return styles

def add_header_footer(canvas, doc):
    """Add header and footer to each page"""
    canvas.saveState()
    
    # Header line
    canvas.setStrokeColor(colors.HexColor('#3182ce'))
    canvas.setLineWidth(1)
    canvas.line(50, PAGE_HEIGHT - 40, PAGE_WIDTH - 50, PAGE_HEIGHT - 40)
    
    # Header text
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#4a5568'))
    canvas.drawString(50, PAGE_HEIGHT - 35, "Galaxy ISO Audit Management System")
    canvas.drawRightString(PAGE_WIDTH - 50, PAGE_HEIGHT - 35, "User Manual")
    
    # Footer line
    canvas.line(50, 40, PAGE_WIDTH - 50, 40)
    
    # Footer text
    canvas.drawString(50, 28, "Galaxy Backbone Limited")
    canvas.drawCentredString(PAGE_WIDTH / 2, 28, f"Page {doc.page}")
    canvas.drawRightString(PAGE_WIDTH - 50, 28, "Confidential")
    
    canvas.restoreState()

def create_cover_page(styles):
    """Create the cover page elements"""
    elements = []
    
    elements.append(Spacer(1, 2*inch))
    
    # Main title
    elements.append(Paragraph("Galaxy ISO Audit Management System", styles['MainTitle']))
    elements.append(Spacer(1, 0.3*inch))
    
    # Document type
    elements.append(Paragraph("USER MANUAL", styles['MainTitle']))
    elements.append(Spacer(1, 0.5*inch))
    
    # Subtitle
    elements.append(Paragraph("Comprehensive Guide to Enterprise Audit Management", styles['Subtitle']))
    elements.append(Paragraph("ISO 19011 Compliant Audit Workflow System", styles['Subtitle']))
    elements.append(Spacer(1, 1*inch))
    
    # Version info table
    version_data = [
        ['Document Version', '1.0'],
        ['Release Date', datetime.now().strftime('%B %d, %Y')],
        ['Classification', 'Internal Use'],
        ['Department', 'Internal Audit']
    ]
    
    version_table = Table(version_data, colWidths=[2*inch, 2*inch])
    version_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2d3748')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(version_table)
    
    elements.append(Spacer(1, 2*inch))
    
    # Copyright
    elements.append(Paragraph("Copyright 2025 Galaxy Backbone Limited", styles['Subtitle']))
    elements.append(Paragraph("All Rights Reserved", styles['Subtitle']))
    
    elements.append(PageBreak())
    return elements

def create_toc(styles):
    """Create table of contents"""
    elements = []
    
    elements.append(Paragraph("Table of Contents", styles['ChapterTitle']))
    elements.append(Spacer(1, 0.3*inch))
    
    toc_items = [
        ("1. Introduction", "4"),
        ("2. Getting Started", "5"),
        ("3. User Roles and Permissions", "7"),
        ("4. Dashboard Overview", "9"),
        ("5. Audit Management", "11"),
        ("6. Workflow Management", "16"),
        ("7. Risk Assessment", "18"),
        ("8. CAPA Management", "20"),
        ("9. Document Control", "22"),
        ("10. Gap Analysis", "24"),
        ("11. Reports and Analytics", "26"),
        ("12. Access Control", "28"),
        ("13. Asset and Vendor Management", "30"),
        ("14. Best Practices", "32"),
        ("15. Troubleshooting", "33"),
        ("16. Glossary", "34"),
    ]
    
    for item, page in toc_items:
        toc_line = f"{item} {'.' * (60 - len(item) - len(page))} {page}"
        elements.append(Paragraph(toc_line, styles['CustomBody']))
    
    elements.append(PageBreak())
    return elements

def create_introduction(styles):
    """Create introduction chapter"""
    elements = []
    
    elements.append(Paragraph("1. Introduction", styles['ChapterTitle']))
    
    elements.append(Paragraph("1.1 About This Manual", styles['SectionTitle']))
    elements.append(Paragraph(
        "This user manual provides comprehensive guidance for using the Galaxy ISO Audit Management System. "
        "The system is designed to digitize and streamline the entire organizational audit lifecycle, "
        "from planning through execution to follow-up and closure, in compliance with ISO 19011 guidelines.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("1.2 System Overview", styles['SectionTitle']))
    elements.append(Paragraph(
        "The Galaxy ISO Audit Management System is an enterprise-grade platform that replaces manual, "
        "paper-based audit processes with a modern, secure, role-based digital solution. The system supports "
        "multiple ISO frameworks including ISO 27001, ISO 9001, ISO 22301, and ISO 45001.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("Key Features:", styles['SubsectionTitle']))
    
    features = [
        "Complete audit lifecycle management following ISO 19011 guidelines",
        "Multi-role access control with six distinct user roles",
        "Digital working papers and evidence management",
        "Automated workflow approval processes",
        "AI-powered report generation",
        "Real-time collaboration through query threads",
        "Comprehensive analytics and dashboards",
        "Risk assessment with ISO 31000 compliance",
        "CAPA management per ISO 9001 requirements",
        "Document control system with version management"
    ]
    
    for feature in features:
        elements.append(Paragraph(f"  {feature}", styles['BulletText']))
    
    elements.append(Paragraph("1.3 ISO Compliance", styles['SectionTitle']))
    elements.append(Paragraph(
        "The system is built to comply with international standards for audit management and quality systems:",
        styles['CustomBody']
    ))
    
    iso_data = [
        ['Standard', 'Description', 'System Coverage'],
        ['ISO 19011:2018', 'Guidelines for auditing management systems', 'Full audit lifecycle'],
        ['ISO 27001', 'Information security management', 'Controls A.5-A.18'],
        ['ISO 9001', 'Quality management systems', 'Clause 10.2 CAPA'],
        ['ISO 31000', 'Risk management', 'Risk assessment module'],
        ['ISO 22301', 'Business continuity', 'Checklist templates']
    ]
    
    iso_table = Table(iso_data, colWidths=[1.3*inch, 2.5*inch, 1.8*inch])
    iso_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')])
    ]))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(iso_table)
    
    elements.append(PageBreak())
    return elements

def create_getting_started(styles):
    """Create getting started chapter"""
    elements = []
    
    elements.append(Paragraph("2. Getting Started", styles['ChapterTitle']))
    
    elements.append(Paragraph("2.1 System Requirements", styles['SectionTitle']))
    elements.append(Paragraph(
        "The Galaxy ISO Audit Management System is a web-based application accessible through modern web browsers. "
        "No software installation is required on user workstations.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("Supported Browsers:", styles['SubsectionTitle']))
    browsers = ["Google Chrome (recommended)", "Mozilla Firefox", "Microsoft Edge", "Safari"]
    for browser in browsers:
        elements.append(Paragraph(f"  {browser}", styles['BulletText']))
    
    elements.append(Paragraph("2.2 Accessing the System", styles['SectionTitle']))
    elements.append(Paragraph(
        "To access the system, open your web browser and navigate to the system URL provided by your administrator. "
        "You will be presented with the login page.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("2.3 Logging In", styles['SectionTitle']))
    elements.append(Paragraph("Follow these steps to log in:", styles['CustomBody']))
    
    login_steps = [
        "Enter your registered email address in the Email field",
        "Click the Sign In button",
        "If Two-Factor Authentication is enabled, enter the 6-digit code from your authenticator app",
        "Upon successful authentication, you will be redirected to the Dashboard"
    ]
    
    for i, step in enumerate(login_steps, 1):
        elements.append(Paragraph(f"  {i}. {step}", styles['BulletText']))
    
    elements.append(Paragraph(
        "Note: The system uses JWT token-based authentication. Your session will remain active until you log out "
        "or the token expires.",
        styles['NoteText']
    ))
    
    elements.append(Paragraph("2.4 Two-Factor Authentication", styles['SectionTitle']))
    elements.append(Paragraph(
        "For enhanced security, the system supports Two-Factor Authentication (2FA). When enabled, "
        "you will need to provide a verification code from your authenticator app in addition to your email.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("Setting up 2FA:", styles['SubsectionTitle']))
    tfa_steps = [
        "Access your profile settings",
        "Enable Two-Factor Authentication",
        "Scan the QR code with your authenticator app (Google Authenticator, Microsoft Authenticator, etc.)",
        "Enter the verification code to confirm setup",
        "Save your backup codes in a secure location"
    ]
    
    for i, step in enumerate(tfa_steps, 1):
        elements.append(Paragraph(f"  {i}. {step}", styles['BulletText']))
    
    elements.append(Paragraph("2.5 Navigation Overview", styles['SectionTitle']))
    elements.append(Paragraph(
        "The system interface consists of a sidebar navigation menu on the left and the main content area. "
        "The sidebar provides access to all system modules based on your assigned role.",
        styles['CustomBody']
    ))
    
    nav_items = [
        ("Dashboard", "Overview of audit program metrics and KPIs"),
        ("Audits", "Create and manage individual audits"),
        ("Workflows", "Manage approval processes"),
        ("Planning", "Annual audit planning"),
        ("Reports", "Generate and view audit reports"),
        ("Follow-ups", "Track corrective actions"),
        ("Risk Assessment", "Identify and assess risks"),
        ("CAPA Management", "Corrective and preventive actions"),
        ("Documents", "Document control system"),
        ("Assets", "Asset inventory management"),
        ("Vendors", "Third-party vendor management"),
        ("Analytics", "Advanced reporting and trends"),
        ("Users", "User management"),
        ("Departments", "Organizational structure"),
        ("Access Control", "Role-based permissions")
    ]
    
    nav_table = Table(
        [['Module', 'Description']] + [[item[0], item[1]] for item in nav_items],
        colWidths=[1.5*inch, 4*inch]
    )
    nav_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')])
    ]))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(nav_table)
    
    elements.append(PageBreak())
    return elements

def create_user_roles(styles):
    """Create user roles chapter"""
    elements = []
    
    elements.append(Paragraph("3. User Roles and Permissions", styles['ChapterTitle']))
    
    elements.append(Paragraph(
        "The system implements role-based access control (RBAC) to ensure proper segregation of duties "
        "as required by ISO standards. Each user is assigned a primary role that determines their access level.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("3.1 Role Definitions", styles['SectionTitle']))
    
    roles_data = [
        ['Role', 'Description', 'Access Level'],
        ['System Admin', 'Full system access including user management, configuration, and all modules', 'Full Access'],
        ['Audit Manager', 'Plans and oversees audits, assigns teams, reviews and approves reports', 'Planning, Analytics, Assets, Vendors'],
        ['Auditor', 'Conducts audits, collects evidence, documents findings, drafts reports', 'Audits, Evidence, Findings'],
        ['Department Head', 'Reviews audit findings for their department, approves corrective actions', 'View audits, Approve workflows'],
        ['Department Officer', 'Responds to audit queries, provides evidence, implements actions', 'View assigned audits, Upload evidence'],
        ['Viewer', 'Read-only access to audit information and reports', 'View only']
    ]
    
    roles_table = Table(roles_data, colWidths=[1.3*inch, 2.8*inch, 1.5*inch])
    roles_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP')
    ]))
    elements.append(roles_table)
    
    elements.append(Paragraph("3.2 Module Access by Role", styles['SectionTitle']))
    
    access_data = [
        ['Module', 'Admin', 'Manager', 'Auditor', 'Dept Head', 'Officer', 'Viewer'],
        ['Dashboard', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
        ['Audits', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
        ['Workflows', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
        ['Planning', 'Yes', 'Yes', 'No', 'No', 'No', 'No'],
        ['Reports', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
        ['Follow-ups', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
        ['Risk Assessment', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
        ['CAPA', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
        ['Documents', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
        ['Assets', 'Yes', 'Yes', 'No', 'No', 'No', 'No'],
        ['Vendors', 'Yes', 'Yes', 'No', 'No', 'No', 'No'],
        ['Analytics', 'Yes', 'Yes', 'No', 'No', 'No', 'No'],
        ['Users', 'Yes', 'No', 'No', 'No', 'No', 'No'],
        ['Departments', 'Yes', 'No', 'No', 'No', 'No', 'No'],
        ['Access Control', 'Yes', 'Yes', 'No', 'No', 'No', 'No']
    ]
    
    access_table = Table(access_data, colWidths=[1.2*inch, 0.7*inch, 0.8*inch, 0.7*inch, 0.8*inch, 0.7*inch, 0.7*inch])
    access_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')])
    ]))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(access_table)
    
    elements.append(Paragraph("3.3 Audit Visibility Rules", styles['SectionTitle']))
    elements.append(Paragraph(
        "Audit visibility is controlled based on user role and department assignment:",
        styles['CustomBody']
    ))
    
    visibility_rules = [
        "System Administrators can view all audits in the system",
        "Audit Managers can view audits in their department plus audits assigned to them",
        "Auditors can only view audits they are assigned to as team members",
        "Department Heads and Officers can view audits related to their department",
        "Viewers have read-only access to audits they are permitted to see"
    ]
    
    for rule in visibility_rules:
        elements.append(Paragraph(f"  {rule}", styles['BulletText']))
    
    elements.append(PageBreak())
    return elements



def create_dashboard_chapter(styles):
    """Create dashboard chapter"""
    elements = []
    
    elements.append(Paragraph("4. Dashboard Overview", styles['ChapterTitle']))
    
    elements.append(Paragraph(
        "The Dashboard provides a comprehensive overview of your audit program at a glance. "
        "It displays key metrics, compliance scores, risk information, and pending actions.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("4.1 Metrics Overview", styles['SectionTitle']))
    elements.append(Paragraph(
        "The top section displays key performance indicators for your audit program:",
        styles['CustomBody']
    ))
    
    metrics = [
        ("Total Audits", "Count of all audits in the system with status breakdown"),
        ("Open Findings", "Number of unresolved findings categorized by severity"),
        ("Compliance Score", "Overall compliance percentage across frameworks"),
        ("Pending Actions", "Count of overdue follow-ups and CAPA items")
    ]
    
    for metric, desc in metrics:
        elements.append(Paragraph(f"  {metric}: {desc}", styles['BulletText']))
    
    elements.append(Paragraph("4.2 Risk Heatmap", styles['SectionTitle']))
    elements.append(Paragraph(
        "The Risk Heatmap visualizes risks across a 5x5 matrix based on likelihood and impact scores. "
        "Colors indicate risk severity:",
        styles['CustomBody']
    ))
    
    risk_colors = [
        ("Green (1-4)", "Low risk - acceptable with monitoring"),
        ("Yellow (5-9)", "Medium risk - requires attention"),
        ("Orange (10-15)", "High risk - requires mitigation"),
        ("Red (16-25)", "Critical risk - immediate action required")
    ]
    
    for color, desc in risk_colors:
        elements.append(Paragraph(f"  {color}: {desc}", styles['BulletText']))
    
    elements.append(Paragraph("4.3 Compliance Gauges", styles['SectionTitle']))
    elements.append(Paragraph(
        "Circular gauges display compliance scores for each ISO framework being tracked. "
        "The gauges show the percentage of requirements that have been assessed as compliant.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("4.4 CAPA Tracker", styles['SectionTitle']))
    elements.append(Paragraph(
        "The CAPA Tracker section shows the status of Corrective and Preventive Actions:",
        styles['CustomBody']
    ))
    
    capa_statuses = [
        ("Open", "Newly created CAPA items awaiting action"),
        ("In Progress", "CAPA items currently being implemented"),
        ("Pending Verification", "Completed actions awaiting effectiveness review"),
        ("Closed", "Verified and completed CAPA items")
    ]
    
    for status, desc in capa_statuses:
        elements.append(Paragraph(f"  {status}: {desc}", styles['BulletText']))
    
    elements.append(Paragraph("4.5 Quick Actions", styles['SectionTitle']))
    elements.append(Paragraph(
        "The Quick Actions section provides shortcuts to common tasks:",
        styles['CustomBody']
    ))
    
    quick_actions = [
        "New Audit - Create a new audit",
        "Risk Assessment - Start a new risk assessment",
        "Generate Report - Create an AI-powered audit report",
        "CAPA Management - Access corrective action tracking"
    ]
    
    for action in quick_actions:
        elements.append(Paragraph(f"  {action}", styles['BulletText']))
    
    elements.append(PageBreak())
    return elements

def create_audit_management(styles):
    """Create audit management chapter"""
    elements = []
    
    elements.append(Paragraph("5. Audit Management", styles['ChapterTitle']))
    
    elements.append(Paragraph(
        "The Audits module is the core of the system, managing the complete audit lifecycle "
        "in accordance with ISO 19011:2018 guidelines.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("5.1 Audit Lifecycle", styles['SectionTitle']))
    elements.append(Paragraph(
        "Each audit progresses through defined phases as specified in ISO 19011:",
        styles['CustomBody']
    ))
    
    lifecycle_data = [
        ['Phase', 'ISO Clause', 'Description'],
        ['Planned', '6.2', 'Audit is scheduled but not yet started'],
        ['Initiated', '6.2', 'Objectives, scope, criteria defined; team assigned'],
        ['Preparation', '6.3', 'Checklists created, documents requested, interviews planned'],
        ['Executing', '6.4', 'Evidence collection, interviews, observations documented'],
        ['Reporting', '6.5', 'Audit report generated with findings and recommendations'],
        ['Follow-up', '6.6', 'Corrective actions tracked and verified'],
        ['Closed', '-', 'Audit complete, all actions verified']
    ]
    
    lifecycle_table = Table(lifecycle_data, colWidths=[1.2*inch, 0.8*inch, 3.5*inch])
    lifecycle_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')])
    ]))
    elements.append(lifecycle_table)
    
    elements.append(Paragraph("5.2 Creating an Audit", styles['SectionTitle']))
    elements.append(Paragraph("To create a new audit:", styles['CustomBody']))
    
    create_steps = [
        "Navigate to Audits from the sidebar",
        "Click the Create Audit button",
        "Enter the audit title and select the audit year",
        "Define the audit scope and select the target department",
        "Assign a risk rating (Low, Medium, High, Critical)",
        "Click Create to save the audit"
    ]
    
    for i, step in enumerate(create_steps, 1):
        elements.append(Paragraph(f"  {i}. {step}", styles['BulletText']))
    
    elements.append(Paragraph("5.3 Audit Initiation (ISO 19011 Clause 6.2)", styles['SectionTitle']))
    elements.append(Paragraph(
        "During initiation, you define the audit parameters:",
        styles['CustomBody']
    ))
    
    init_items = [
        ("Objectives", "What the audit aims to achieve"),
        ("Scope", "Boundaries and extent of the audit"),
        ("Criteria", "Standards and requirements to audit against"),
        ("Methodology", "Approach and techniques to be used"),
        ("Feasibility", "Confirmation that the audit can be conducted")
    ]
    
    for item, desc in init_items:
        elements.append(Paragraph(f"  {item}: {desc}", styles['BulletText']))
    
    elements.append(Paragraph("5.4 Team Assignment", styles['SectionTitle']))
    elements.append(Paragraph(
        "Assign qualified personnel to the audit team:",
        styles['CustomBody']
    ))
    
    team_roles = [
        ("Lead Auditor", "Heads the audit team, responsible for overall audit conduct"),
        ("Senior Auditor", "Experienced auditor who can mentor others"),
        ("Auditor", "Conducts audit procedures and collects evidence"),
        ("Technical Specialist", "Provides expertise in specific technical areas"),
        ("Observer", "Watches the audit process for training or oversight"),
        ("Trainee Auditor", "Learning auditor under supervision")
    ]
    
    for role, desc in team_roles:
        elements.append(Paragraph(f"  {role}: {desc}", styles['BulletText']))
    
    elements.append(Paragraph("5.5 Audit Preparation (ISO 19011 Clause 6.3)", styles['SectionTitle']))
    elements.append(Paragraph(
        "Preparation activities include:",
        styles['CustomBody']
    ))
    
    prep_items = [
        "Creating audit checklists based on ISO requirements",
        "Sending document requests to auditees",
        "Conducting preliminary risk assessment",
        "Planning interview schedules",
        "Reviewing previous audit findings"
    ]
    
    for item in prep_items:
        elements.append(Paragraph(f"  {item}", styles['BulletText']))
    
    elements.append(Paragraph("5.6 Audit Execution (ISO 19011 Clause 6.4)", styles['SectionTitle']))
    elements.append(Paragraph(
        "During execution, auditors collect evidence and document findings:",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("Evidence Collection:", styles['SubsectionTitle']))
    evidence_items = [
        "Upload supporting documents (images, PDFs, spreadsheets)",
        "Record interview notes and observations",
        "Link evidence to specific controls or requirements",
        "Automatic timestamping for audit trail"
    ]
    
    for item in evidence_items:
        elements.append(Paragraph(f"  {item}", styles['BulletText']))
    
    elements.append(Paragraph("Documenting Findings:", styles['SubsectionTitle']))
    finding_types = [
        ("Major Non-conformity", "Significant failure to meet requirements"),
        ("Minor Non-conformity", "Isolated lapse that does not affect system effectiveness"),
        ("Observation", "Area for potential improvement"),
        ("Opportunity for Improvement", "Suggestion for enhancement")
    ]
    
    for ftype, desc in finding_types:
        elements.append(Paragraph(f"  {ftype}: {desc}", styles['BulletText']))
    
    elements.append(Paragraph("5.7 Query Management", styles['SectionTitle']))
    elements.append(Paragraph(
        "The Queries feature enables communication between auditors and auditees:",
        styles['CustomBody']
    ))
    
    query_features = [
        "Create queries requesting clarification or additional information",
        "Auditees receive notifications and can respond directly",
        "Full conversation history maintained for audit trail",
        "Queries can be linked to specific findings or evidence"
    ]
    
    for feature in query_features:
        elements.append(Paragraph(f"  {feature}", styles['BulletText']))
    
    elements.append(PageBreak())
    
    elements.append(Paragraph("5.8 Work Program", styles['SectionTitle']))
    elements.append(Paragraph(
        "The Work Program defines the audit procedures to be performed:",
        styles['CustomBody']
    ))
    
    work_program_items = [
        "Define specific audit procedures and tests",
        "Assign procedures to team members",
        "Track completion status of each procedure",
        "Link procedures to evidence collected"
    ]
    
    for item in work_program_items:
        elements.append(Paragraph(f"  {item}", styles['BulletText']))
    
    elements.append(Paragraph("5.9 Audit Reporting (ISO 19011 Clause 6.5)", styles['SectionTitle']))
    elements.append(Paragraph(
        "Generate comprehensive audit reports:",
        styles['CustomBody']
    ))
    
    report_features = [
        "AI-powered report generation from audit findings",
        "ISO-structured report sections (Executive Summary, Scope, Findings, Recommendations)",
        "Version control for report revisions",
        "Multi-level approval workflow",
        "Export to PDF and Word formats"
    ]
    
    for feature in report_features:
        elements.append(Paragraph(f"  {feature}", styles['BulletText']))
    
    elements.append(Paragraph("5.10 Follow-up (ISO 19011 Clause 6.6)", styles['SectionTitle']))
    elements.append(Paragraph(
        "Track corrective actions after the audit:",
        styles['CustomBody']
    ))
    
    followup_items = [
        "Create follow-up items for each finding",
        "Assign responsible persons and due dates",
        "Track implementation progress",
        "Upload evidence of completion",
        "Verify effectiveness of corrective actions"
    ]
    
    for item in followup_items:
        elements.append(Paragraph(f"  {item}", styles['BulletText']))
    
    elements.append(Paragraph("5.11 Closing an Audit", styles['SectionTitle']))
    elements.append(Paragraph(
        "To close an audit, ensure all follow-up items are complete and verified. "
        "Click the Close Audit button to finalize. Once closed, the audit status is locked "
        "and the audit is archived for future reference.",
        styles['CustomBody']
    ))
    
    elements.append(PageBreak())
    return elements

def create_workflow_chapter(styles):
    """Create workflow management chapter"""
    elements = []
    
    elements.append(Paragraph("6. Workflow Management", styles['ChapterTitle']))
    
    elements.append(Paragraph(
        "The Workflow module manages approval processes for audit reports and documents, "
        "ensuring proper authorization as required by ISO standards.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("6.1 Understanding Workflows", styles['SectionTitle']))
    elements.append(Paragraph(
        "Workflows define the sequence of approvals required before a document or report "
        "can be finalized. Each workflow consists of multiple steps, with each step assigned "
        "to a specific user or department.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("6.2 Creating a Workflow", styles['SectionTitle']))
    elements.append(Paragraph("To create a new workflow:", styles['CustomBody']))
    
    workflow_steps = [
        "Navigate to Workflows from the sidebar",
        "Click Create Workflow",
        "Select the audit or document to associate with the workflow",
        "Add approval steps in sequence",
        "Assign each step to a user or department",
        "Save the workflow"
    ]
    
    for i, step in enumerate(workflow_steps, 1):
        elements.append(Paragraph(f"  {i}. {step}", styles['BulletText']))
    
    elements.append(Paragraph("6.3 Workflow Actions", styles['SectionTitle']))
    elements.append(Paragraph(
        "Users can perform the following actions on workflow steps:",
        styles['CustomBody']
    ))
    
    actions_data = [
        ['Action', 'Description'],
        ['Approve', 'Accept the item and move to the next step'],
        ['Reject', 'Send back with comments for revision'],
        ['Return', 'Request changes without full rejection'],
        ['Sign', 'Add digital signature to the document'],
        ['Review', 'Mark as reviewed without formal approval'],
        ['Acknowledge', 'Confirm receipt of the document']
    ]
    
    actions_table = Table(actions_data, colWidths=[1.2*inch, 4.3*inch])
    actions_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')])
    ]))
    elements.append(actions_table)
    
    elements.append(Paragraph("6.4 Workflow Status", styles['SectionTitle']))
    elements.append(Paragraph(
        "Workflows progress through the following statuses:",
        styles['CustomBody']
    ))
    
    status_items = [
        ("Pending", "Workflow created but not yet started"),
        ("In Progress", "Currently being processed through approval steps"),
        ("Approved", "All steps completed successfully"),
        ("Rejected", "Workflow rejected at one of the steps")
    ]
    
    for status, desc in status_items:
        elements.append(Paragraph(f"  {status}: {desc}", styles['BulletText']))
    
    elements.append(Paragraph("6.5 My Tasks", styles['SectionTitle']))
    elements.append(Paragraph(
        "The Workflows badge in the sidebar shows the count of pending tasks assigned to you. "
        "Click on Workflows to view and action your pending approvals.",
        styles['CustomBody']
    ))
    
    elements.append(PageBreak())
    return elements

def create_risk_chapter(styles):
    """Create risk assessment chapter"""
    elements = []
    
    elements.append(Paragraph("7. Risk Assessment", styles['ChapterTitle']))
    
    elements.append(Paragraph(
        "The Risk Assessment module enables identification, assessment, and management of risks "
        "in compliance with ISO 31000 and ISO 27005 standards.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("7.1 Risk Assessment Process", styles['SectionTitle']))
    elements.append(Paragraph(
        "The risk assessment process follows these steps:",
        styles['CustomBody']
    ))
    
    risk_process = [
        "Identify the risk and provide a description",
        "Assess likelihood (1-5 scale)",
        "Assess impact (1-5 scale)",
        "System calculates risk rating (Likelihood x Impact)",
        "Define mitigation plans and controls",
        "Link risks to assets, findings, or CAPA items"
    ]
    
    for i, step in enumerate(risk_process, 1):
        elements.append(Paragraph(f"  {i}. {step}", styles['BulletText']))
    
    elements.append(Paragraph("7.2 Risk Scoring", styles['SectionTitle']))
    elements.append(Paragraph(
        "Risks are scored using a 5x5 matrix:",
        styles['CustomBody']
    ))
    
    scoring_data = [
        ['Score Range', 'Category', 'Action Required'],
        ['1-4', 'Low', 'Monitor and review periodically'],
        ['5-9', 'Medium', 'Implement controls within defined timeframe'],
        ['10-15', 'High', 'Prioritize mitigation actions'],
        ['16-25', 'Critical', 'Immediate action required']
    ]
    
    scoring_table = Table(scoring_data, colWidths=[1.2*inch, 1*inch, 3.3*inch])
    scoring_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')])
    ]))
    elements.append(scoring_table)
    
    elements.append(Paragraph("7.3 Risk Matrix View", styles['SectionTitle']))
    elements.append(Paragraph(
        "The Risk Matrix tab provides a visual representation of all risks plotted on a 5x5 grid. "
        "Click on any cell to view risks at that likelihood/impact intersection.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("7.4 Control Suggestions", styles['SectionTitle']))
    elements.append(Paragraph(
        "The system provides AI-suggested controls based on ISO 27001 Annex A. "
        "When viewing a risk, you can see recommended controls and add them to your mitigation plan.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("7.5 Risk Linking", styles['SectionTitle']))
    elements.append(Paragraph(
        "Risks can be linked to other entities in the system:",
        styles['CustomBody']
    ))
    
    link_items = [
        "Assets - Link risks to specific organizational assets",
        "Audits - Associate risks with audit findings",
        "CAPA - Create corrective actions for risk mitigation",
        "Controls - Map risks to implemented controls"
    ]
    
    for item in link_items:
        elements.append(Paragraph(f"  {item}", styles['BulletText']))
    
    elements.append(PageBreak())
    return elements

def create_capa_chapter(styles):
    """Create CAPA management chapter"""
    elements = []
    
    elements.append(Paragraph("8. CAPA Management", styles['ChapterTitle']))
    
    elements.append(Paragraph(
        "The CAPA (Corrective and Preventive Action) module manages actions to address "
        "non-conformities and prevent recurrence, as required by ISO 9001 Clause 10.2.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("8.1 CAPA Types", styles['SectionTitle']))
    
    capa_types = [
        ("Corrective", "Actions to fix existing problems and prevent recurrence"),
        ("Preventive", "Actions to prevent potential problems from occurring"),
        ("Both", "Combined corrective and preventive approach")
    ]
    
    for ctype, desc in capa_types:
        elements.append(Paragraph(f"  {ctype}: {desc}", styles['BulletText']))
    
    elements.append(Paragraph("8.2 CAPA Workflow", styles['SectionTitle']))
    elements.append(Paragraph(
        "CAPA items progress through the following statuses:",
        styles['CustomBody']
    ))
    
    capa_workflow = [
        ("Open", "CAPA created and awaiting action"),
        ("In Progress", "Actions being implemented"),
        ("Pending Verification", "Awaiting effectiveness check"),
        ("Closed", "Verified and complete")
    ]
    
    for status, desc in capa_workflow:
        elements.append(Paragraph(f"  {status}: {desc}", styles['BulletText']))
    
    elements.append(Paragraph("8.3 Creating a CAPA", styles['SectionTitle']))
    elements.append(Paragraph("To create a new CAPA:", styles['CustomBody']))
    
    create_steps = [
        "Navigate to CAPA Management from the sidebar",
        "Click Create New CAPA",
        "Enter the CAPA title and description",
        "Select the CAPA type (Corrective, Preventive, or Both)",
        "Link to related findings, risks, or gaps",
        "Assign a responsible person and due date",
        "Save the CAPA"
    ]
    
    for i, step in enumerate(create_steps, 1):
        elements.append(Paragraph(f"  {i}. {step}", styles['BulletText']))
    
    elements.append(Paragraph("8.4 Root Cause Analysis", styles['SectionTitle']))
    elements.append(Paragraph(
        "The system supports root cause analysis using the Five Whys technique. "
        "Click Root Cause Analysis on a CAPA to document the analysis process.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("8.5 Effectiveness Review", styles['SectionTitle']))
    elements.append(Paragraph(
        "After implementing corrective actions, conduct an effectiveness review to verify "
        "that the actions have resolved the issue and prevented recurrence.",
        styles['CustomBody']
    ))
    
    review_items = [
        "Document the review date and reviewer",
        "Assess whether the root cause was addressed",
        "Verify that the problem has not recurred",
        "Record any additional observations",
        "Close the CAPA if effective"
    ]
    
    for item in review_items:
        elements.append(Paragraph(f"  {item}", styles['BulletText']))
    
    elements.append(Paragraph("8.6 CAPA Tracker", styles['SectionTitle']))
    elements.append(Paragraph(
        "The CAPA Tracker provides an overview of all CAPA items with filtering options:",
        styles['CustomBody']
    ))
    
    tracker_features = [
        "Filter by status, type, or assignee",
        "View progress percentage for each CAPA",
        "Track overdue items",
        "Export CAPA data for reporting"
    ]
    
    for feature in tracker_features:
        elements.append(Paragraph(f"  {feature}", styles['BulletText']))
    
    elements.append(PageBreak())
    return elements



def create_document_chapter(styles):
    """Create document control chapter"""
    elements = []
    
    elements.append(Paragraph("9. Document Control", styles['ChapterTitle']))
    
    elements.append(Paragraph(
        "The Document Control module provides ISO 9001 and ISO 27001 compliant document management "
        "with version control, approval workflows, and expiry tracking.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("9.1 Document Lifecycle", styles['SectionTitle']))
    elements.append(Paragraph(
        "Documents progress through the following stages:",
        styles['CustomBody']
    ))
    
    doc_lifecycle = [
        ("Draft", "Document created but not yet submitted for review"),
        ("Under Review", "Document submitted for approval"),
        ("Approved", "Document approved and ready for use"),
        ("Active", "Document currently in use"),
        ("Expired", "Document past its expiry date"),
        ("Archived", "Document no longer active but retained for records")
    ]
    
    for stage, desc in doc_lifecycle:
        elements.append(Paragraph(f"  {stage}: {desc}", styles['BulletText']))
    
    elements.append(Paragraph("9.2 Uploading Documents", styles['SectionTitle']))
    elements.append(Paragraph("To upload a new document:", styles['CustomBody']))
    
    upload_steps = [
        "Navigate to Documents from the sidebar",
        "Click Upload Document",
        "Select the file to upload",
        "Enter document metadata (title, number, type)",
        "Select the department and confidentiality level",
        "Set the expiry date if applicable",
        "Assign a responsible person",
        "Click Upload"
    ]
    
    for i, step in enumerate(upload_steps, 1):
        elements.append(Paragraph(f"  {i}. {step}", styles['BulletText']))
    
    elements.append(Paragraph("9.3 Document Types", styles['SectionTitle']))
    elements.append(Paragraph(
        "The system supports various document types:",
        styles['CustomBody']
    ))
    
    doc_types = [
        "Policies and Procedures",
        "HR Manual",
        "Business Continuity Policy",
        "Access Control Policy",
        "Cryptography Policy",
        "Backup Policy",
        "Acceptable Use Policy",
        "Standard Operating Procedures (SOPs)",
        "Training Records",
        "Contracts and Agreements"
    ]
    
    for dtype in doc_types:
        elements.append(Paragraph(f"  {dtype}", styles['BulletText']))
    
    elements.append(Paragraph("9.4 Confidentiality Levels", styles['SectionTitle']))
    
    conf_levels = [
        ("Public", "Available to all users"),
        ("Internal", "Available to internal staff only"),
        ("Confidential", "Restricted to specific departments"),
        ("Restricted", "Highly sensitive, limited access")
    ]
    
    for level, desc in conf_levels:
        elements.append(Paragraph(f"  {level}: {desc}", styles['BulletText']))
    
    elements.append(Paragraph("9.5 Version Control", styles['SectionTitle']))
    elements.append(Paragraph(
        "The system maintains version history for all documents. When uploading a new version, "
        "the previous version is retained for audit trail purposes.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("9.6 Document Approval", styles['SectionTitle']))
    elements.append(Paragraph(
        "Documents requiring approval go through a workflow process. Approvers can review "
        "the document, add comments, and approve or reject.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("9.7 Expiry Tracking", styles['SectionTitle']))
    elements.append(Paragraph(
        "The system tracks document expiry dates and provides alerts for documents expiring soon. "
        "The Expiring tab shows all documents requiring attention.",
        styles['CustomBody']
    ))
    
    elements.append(PageBreak())
    return elements

def create_gap_analysis_chapter(styles):
    """Create gap analysis chapter"""
    elements = []
    
    elements.append(Paragraph("10. Gap Analysis", styles['ChapterTitle']))
    
    elements.append(Paragraph(
        "The Gap Analysis module enables comparison of your organization against ISO framework "
        "requirements to identify compliance gaps and track remediation.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("10.1 Compliance Dashboard", styles['SectionTitle']))
    elements.append(Paragraph(
        "The Compliance Dashboard provides an overview of your compliance status:",
        styles['CustomBody']
    ))
    
    dashboard_items = [
        "Overall compliance percentage across frameworks",
        "Gaps by severity (Critical, High, Medium, Low)",
        "Remediation progress tracking",
        "Trend analysis over time"
    ]
    
    for item in dashboard_items:
        elements.append(Paragraph(f"  {item}", styles['BulletText']))
    
    elements.append(Paragraph("10.2 Framework Analysis", styles['SectionTitle']))
    elements.append(Paragraph(
        "Compare your organization against multiple ISO frameworks:",
        styles['CustomBody']
    ))
    
    frameworks = [
        "ISO 27001 - Information Security Management",
        "ISO 9001 - Quality Management",
        "ISO 22301 - Business Continuity",
        "ISO 45001 - Occupational Health and Safety"
    ]
    
    for framework in frameworks:
        elements.append(Paragraph(f"  {framework}", styles['BulletText']))
    
    elements.append(Paragraph("10.3 Conducting Gap Analysis", styles['SectionTitle']))
    elements.append(Paragraph("To conduct a gap analysis:", styles['CustomBody']))
    
    gap_steps = [
        "Select the ISO framework to assess against",
        "Review each clause or control requirement",
        "Assess current compliance status",
        "Document gaps and evidence",
        "Assign severity to each gap",
        "Create remediation plans"
    ]
    
    for i, step in enumerate(gap_steps, 1):
        elements.append(Paragraph(f"  {i}. {step}", styles['BulletText']))
    
    elements.append(Paragraph("10.4 Compliance Tracker", styles['SectionTitle']))
    elements.append(Paragraph(
        "The Compliance Tracker monitors individual gaps across frameworks and departments. "
        "Filter by status, severity, or framework to focus on priority items.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("10.5 Gap Remediation", styles['SectionTitle']))
    elements.append(Paragraph(
        "Manage gap closure through CAPA integration:",
        styles['CustomBody']
    ))
    
    remediation_items = [
        "Create CAPA items directly from gaps",
        "Track remediation progress",
        "Upload evidence of closure",
        "Verify effectiveness of remediation"
    ]
    
    for item in remediation_items:
        elements.append(Paragraph(f"  {item}", styles['BulletText']))
    
    elements.append(PageBreak())
    return elements

def create_reports_chapter(styles):
    """Create reports and analytics chapter"""
    elements = []
    
    elements.append(Paragraph("11. Reports and Analytics", styles['ChapterTitle']))
    
    elements.append(Paragraph("11.1 Report Generation", styles['SectionTitle']))
    elements.append(Paragraph(
        "The Reports module enables generation of ISO 19011 compliant audit reports:",
        styles['CustomBody']
    ))
    
    report_features = [
        "AI-powered report generation from audit findings",
        "ISO-structured report sections",
        "Version control for report revisions",
        "Multi-level approval workflow",
        "Export to PDF and Word formats"
    ]
    
    for feature in report_features:
        elements.append(Paragraph(f"  {feature}", styles['BulletText']))
    
    elements.append(Paragraph("11.2 Generating a Report", styles['SectionTitle']))
    elements.append(Paragraph("To generate a new report:", styles['CustomBody']))
    
    gen_steps = [
        "Navigate to Reports from the sidebar",
        "Click Generate New Report",
        "Select the audit to generate a report for",
        "The system will compile findings and generate the report",
        "Review and edit the generated content",
        "Submit for approval through workflow"
    ]
    
    for i, step in enumerate(gen_steps, 1):
        elements.append(Paragraph(f"  {i}. {step}", styles['BulletText']))
    
    elements.append(Paragraph("11.3 Report Structure", styles['SectionTitle']))
    elements.append(Paragraph(
        "Generated reports follow the ISO 19011 structure:",
        styles['CustomBody']
    ))
    
    report_sections = [
        "Executive Summary",
        "Audit Objectives and Scope",
        "Audit Criteria",
        "Audit Methodology",
        "Findings (Conformities and Non-conformities)",
        "Evidence Summary",
        "Recommendations",
        "CAPA Plan",
        "Conclusion"
    ]
    
    for section in report_sections:
        elements.append(Paragraph(f"  {section}", styles['BulletText']))
    
    elements.append(Paragraph("11.4 Analytics Dashboard", styles['SectionTitle']))
    elements.append(Paragraph(
        "The Analytics module provides advanced reporting and trend analysis:",
        styles['CustomBody']
    ))
    
    analytics_items = [
        "Audit completion trends over time",
        "Finding trends by severity",
        "Compliance score trends",
        "Risk distribution analysis",
        "CAPA effectiveness metrics",
        "Department performance comparison"
    ]
    
    for item in analytics_items:
        elements.append(Paragraph(f"  {item}", styles['BulletText']))
    
    elements.append(Paragraph(
        "Note: Analytics is available to System Administrators and Audit Managers only.",
        styles['NoteText']
    ))
    
    elements.append(PageBreak())
    return elements

def create_access_control_chapter(styles):
    """Create access control chapter"""
    elements = []
    
    elements.append(Paragraph("12. Access Control", styles['ChapterTitle']))
    
    elements.append(Paragraph(
        "The Access Control module provides fine-grained permission management with enhanced "
        "Role-Based Access Control (RBAC) in compliance with ISO 27001.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("12.1 Team Assignment", styles['SectionTitle']))
    elements.append(Paragraph(
        "Assign auditors to audit teams with proper roles per ISO 19011 requirements:",
        styles['CustomBody']
    ))
    
    team_steps = [
        "Enter or select an Audit ID",
        "Select a Lead Auditor from available users",
        "Add team members and assign their role in the audit",
        "Click Assign Team"
    ]
    
    for i, step in enumerate(team_steps, 1):
        elements.append(Paragraph(f"  {i}. {step}", styles['BulletText']))
    
    elements.append(Paragraph("12.2 User Management", styles['SectionTitle']))
    elements.append(Paragraph(
        "Manage users and assign additional roles from the role matrix:",
        styles['CustomBody']
    ))
    
    user_features = [
        "Search and filter users by name, role, or department",
        "View user details and current role assignments",
        "Assign additional roles with reasons",
        "Set temporary assignments with expiry dates"
    ]
    
    for feature in user_features:
        elements.append(Paragraph(f"  {feature}", styles['BulletText']))
    
    elements.append(Paragraph("12.3 Audit Visibility", styles['SectionTitle']))
    elements.append(Paragraph(
        "Control which audits users can see based on their role and department:",
        styles['CustomBody']
    ))
    
    visibility_levels = [
        ("Full Access", "System Administrators - All audits"),
        ("Department + Assigned", "Audit Managers - Department audits plus assigned"),
        ("Assigned Only", "Auditors - Only audits assigned to them"),
        ("Department Audits", "Department Staff - Audits related to their department")
    ]
    
    for level, desc in visibility_levels:
        elements.append(Paragraph(f"  {level}: {desc}", styles['BulletText']))
    
    elements.append(Paragraph("12.4 Role Matrix", styles['SectionTitle']))
    elements.append(Paragraph(
        "Define custom roles with specific permissions:",
        styles['CustomBody']
    ))
    
    role_categories = [
        ("System", "High-level system administration"),
        ("Audit", "Audit-related activities"),
        ("Business", "Business operations"),
        ("Compliance", "Compliance activities")
    ]
    
    for category, desc in role_categories:
        elements.append(Paragraph(f"  {category}: {desc}", styles['BulletText']))
    
    elements.append(Paragraph("12.5 Available Permissions", styles['SectionTitle']))
    
    permissions_data = [
        ['Category', 'Permissions'],
        ['Audit Management', 'Create, View All, View Assigned, Edit, Delete, Approve Reports'],
        ['System Management', 'Manage Users, Manage Departments, View Analytics, Export Data'],
        ['Risk and CAPA', 'Create Risks, Assess Risks, Approve Treatments, Create/Assign/Close CAPA'],
        ['Document Control', 'Upload Documents, Approve Documents, Archive Documents'],
        ['Asset and Vendor', 'Manage Assets, Assign Assets, Manage Vendors, Evaluate Vendors']
    ]
    
    perm_table = Table(permissions_data, colWidths=[1.5*inch, 4*inch])
    perm_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP')
    ]))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(perm_table)
    
    elements.append(PageBreak())
    return elements

def create_asset_vendor_chapter(styles):
    """Create asset and vendor management chapter"""
    elements = []
    
    elements.append(Paragraph("13. Asset and Vendor Management", styles['ChapterTitle']))
    
    elements.append(Paragraph("13.1 Asset Management", styles['SectionTitle']))
    elements.append(Paragraph(
        "The Assets module manages organizational assets for audit scope definition "
        "in compliance with ISO 27001 Annex A.8.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("Asset Categories:", styles['SubsectionTitle']))
    asset_categories = [
        "Hardware - Physical computing equipment",
        "Software - Applications and systems",
        "Data - Information assets",
        "People - Human resources",
        "Facilities - Physical locations",
        "Services - External services"
    ]
    
    for category in asset_categories:
        elements.append(Paragraph(f"  {category}", styles['BulletText']))
    
    elements.append(Paragraph("Asset Information:", styles['SubsectionTitle']))
    asset_info = [
        "Asset value and procurement date",
        "Responsible person and assignment history",
        "Criticality assessment",
        "Link to risks and controls",
        "Disposal date and value (if applicable)"
    ]
    
    for info in asset_info:
        elements.append(Paragraph(f"  {info}", styles['BulletText']))
    
    elements.append(Paragraph("13.2 Vendor Management", styles['SectionTitle']))
    elements.append(Paragraph(
        "The Vendors module manages third-party vendors and suppliers "
        "in compliance with ISO 27001 Annex A.15.",
        styles['CustomBody']
    ))
    
    elements.append(Paragraph("Vendor Information:", styles['SubsectionTitle']))
    vendor_info = [
        "Vendor registry with contact details",
        "Risk rating (Low, Medium, High, Critical)",
        "Compliance tracking and evidence",
        "Contract and SLA management",
        "Performance monitoring",
        "Evaluation questionnaires"
    ]
    
    for info in vendor_info:
        elements.append(Paragraph(f"  {info}", styles['BulletText']))
    
    elements.append(Paragraph(
        "Note: Asset and Vendor Management is available to System Administrators and Audit Managers only.",
        styles['NoteText']
    ))
    
    elements.append(PageBreak())
    return elements

def create_best_practices(styles):
    """Create best practices chapter"""
    elements = []
    
    elements.append(Paragraph("14. Best Practices", styles['ChapterTitle']))
    
    elements.append(Paragraph("14.1 Audit Best Practices", styles['SectionTitle']))
    
    audit_practices = [
        "Always upload evidence - Every finding should have supporting documentation",
        "Use the workflow system - Get proper approvals for all reports",
        "Document everything - The system maintains a full audit trail",
        "Follow ISO 19011 phases - Progress through each phase systematically",
        "Verify team competency - Ensure audit team members are qualified"
    ]
    
    for practice in audit_practices:
        elements.append(Paragraph(f"  {practice}", styles['BulletText']))
    
    elements.append(Paragraph("14.2 Access Control Best Practices", styles['SectionTitle']))
    
    access_practices = [
        "Follow least privilege - Give users only the permissions they need",
        "Use temporary assignments - For short-term access needs, set expiry dates",
        "Document override reasons - Always explain why emergency access was granted",
        "Review roles regularly - Audit role assignments quarterly",
        "Segregate duties - Do not let one person control entire processes"
    ]
    
    for practice in access_practices:
        elements.append(Paragraph(f"  {practice}", styles['BulletText']))
    
    elements.append(Paragraph("14.3 CAPA Best Practices", styles['SectionTitle']))
    
    capa_practices = [
        "Track CAPA items diligently - Do not let corrective actions slip",
        "Perform root cause analysis - Address the underlying cause, not just symptoms",
        "Verify effectiveness - Confirm that actions have resolved the issue",
        "Link to findings - Maintain traceability between findings and actions",
        "Set realistic due dates - Allow adequate time for implementation"
    ]
    
    for practice in capa_practices:
        elements.append(Paragraph(f"  {practice}", styles['BulletText']))
    
    elements.append(Paragraph("14.4 Document Control Best Practices", styles['SectionTitle']))
    
    doc_practices = [
        "Maintain version control - Track all document revisions",
        "Set appropriate expiry dates - Review documents before they expire",
        "Use proper confidentiality levels - Protect sensitive information",
        "Follow approval workflows - Ensure documents are properly authorized",
        "Archive obsolete documents - Retain for audit trail but mark as inactive"
    ]
    
    for practice in doc_practices:
        elements.append(Paragraph(f"  {practice}", styles['BulletText']))
    
    elements.append(PageBreak())
    return elements

def create_troubleshooting(styles):
    """Create troubleshooting chapter"""
    elements = []
    
    elements.append(Paragraph("15. Troubleshooting", styles['ChapterTitle']))
    
    elements.append(Paragraph("15.1 Common Issues", styles['SectionTitle']))
    
    issues = [
        ("Cannot log in", "Verify your email address is correct. If 2FA is enabled, ensure you are entering the correct code from your authenticator app."),
        ("Cannot see audits", "Check your role and department assignment. You may only have access to audits assigned to you or your department."),
        ("Workflow not progressing", "Ensure all required approvers have actioned their steps. Check for rejected or returned items."),
        ("Cannot upload documents", "Verify the file size is within limits and the file type is supported."),
        ("Report generation fails", "Ensure the audit has findings documented. The AI report generator requires audit data to create the report.")
    ]
    
    for issue, solution in issues:
        elements.append(Paragraph(f"  Issue: {issue}", styles['BulletText']))
        elements.append(Paragraph(f"  Solution: {solution}", styles['CustomBody']))
        elements.append(Spacer(1, 0.1*inch))
    
    elements.append(Paragraph("15.2 Getting Help", styles['SectionTitle']))
    elements.append(Paragraph(
        "Contact your System Administrator for:",
        styles['CustomBody']
    ))
    
    help_items = [
        "Password resets and account issues",
        "Role changes and permission requests",
        "Access issues and visibility problems",
        "Training requests and user guides",
        "System configuration questions"
    ]
    
    for item in help_items:
        elements.append(Paragraph(f"  {item}", styles['BulletText']))
    
    elements.append(PageBreak())
    return elements

def create_glossary(styles):
    """Create glossary chapter"""
    elements = []
    
    elements.append(Paragraph("16. Glossary", styles['ChapterTitle']))
    
    glossary_items = [
        ("Audit", "Systematic, independent, and documented process for obtaining audit evidence and evaluating it objectively"),
        ("Audit Criteria", "Set of policies, procedures, or requirements used as a reference against which audit evidence is compared"),
        ("Audit Evidence", "Records, statements of fact, or other information relevant to the audit criteria and verifiable"),
        ("Audit Finding", "Results of the evaluation of the collected audit evidence against audit criteria"),
        ("CAPA", "Corrective and Preventive Action - actions to eliminate the cause of a detected nonconformity or potential nonconformity"),
        ("Compliance", "Fulfillment of a requirement"),
        ("Gap Analysis", "Comparison of actual performance or compliance against potential or desired performance"),
        ("ISO 19011", "International standard providing guidelines for auditing management systems"),
        ("ISO 27001", "International standard for information security management systems"),
        ("ISO 9001", "International standard for quality management systems"),
        ("Non-conformity", "Non-fulfillment of a requirement"),
        ("RBAC", "Role-Based Access Control - method of regulating access based on roles of individual users"),
        ("Risk", "Effect of uncertainty on objectives"),
        ("Risk Assessment", "Overall process of risk identification, risk analysis, and risk evaluation"),
        ("Workflow", "Sequence of steps through which a piece of work passes from initiation to completion")
    ]
    
    for term, definition in glossary_items:
        elements.append(Paragraph(f"  {term}: {definition}", styles['BulletText']))
        elements.append(Spacer(1, 0.05*inch))
    
    return elements

def generate_manual():
    """Generate the complete user manual PDF"""
    
    # Create the document
    doc = SimpleDocTemplate(
        "User_Manual.pdf",
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=60,
        bottomMargin=60
    )
    
    # Create styles
    styles = create_styles()
    
    # Build document elements
    elements = []
    
    # Cover page
    elements.extend(create_cover_page(styles))
    
    # Table of contents
    elements.extend(create_toc(styles))
    
    # Chapters
    elements.extend(create_introduction(styles))
    elements.extend(create_getting_started(styles))
    elements.extend(create_user_roles(styles))
    elements.extend(create_dashboard_chapter(styles))
    elements.extend(create_audit_management(styles))
    elements.extend(create_workflow_chapter(styles))
    elements.extend(create_risk_chapter(styles))
    elements.extend(create_capa_chapter(styles))
    elements.extend(create_document_chapter(styles))
    elements.extend(create_gap_analysis_chapter(styles))
    elements.extend(create_reports_chapter(styles))
    elements.extend(create_access_control_chapter(styles))
    elements.extend(create_asset_vendor_chapter(styles))
    elements.extend(create_best_practices(styles))
    elements.extend(create_troubleshooting(styles))
    elements.extend(create_glossary(styles))
    
    # Build the PDF
    doc.build(elements, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
    
    print("User Manual generated successfully: User_Manual.pdf")

if __name__ == "__main__":
    generate_manual()
