
Stakeholder Requested Updates & System Enhancements
1. Dashboard & Metrics
•	Modernize the dashboard design to improve user experience, Redesign dashboard to a modern, responsive UI.
•	Make metrics more informative 
•	Display ISO-related KPIs:
o	Number of audits (open, in-progress, closed)
o	Number of non-conformities
o	Compliance percentage by ISO clause
o	Risk heatmap (likelihood × impact)
o	Pending corrective actions (CAPA)
•	Add visualizations: charts, graphs, compliance score gauges
2. ISO-Compliant End to End Audit  Automation (ISO 19011)
The system must support the full ISO 19011 workflow:
2.1 Initiation
•	Create audit plan
•	Define audit objectives, scope & criteria
•	Assign audit team
2.2 Preparation
•	Prepare audit checklist (ISO-based)
•	Request documents from auditees
•	Conduct risk assessment
2.3 Execution
•	Collect evidence (upload files, timestamped logs)
•	Capture findings
•	Record non-conformities
•	Take interview notes, Include a "Notes" section for auditors/users to describe how controls are being met.
•	Allow users to upload supporting evidence (e.g., pictures, documents) for audits.
•	For each control, allow uploading of evidence to demonstrate compliance.
•	Support “Next Due Date” for certain controls (e.g., security awareness training, key rotations, data archiving).

2.4 Reporting
•	AI-generated audit report, Integrate AI to automatically generate audit reports using audit findings using 
•	Incorporate feature to export reports in multiple formats: PDF, Word, etc.
•	ISO-structured report sections
•	Summary of findings & CAPA recommendations
2.5 Follow-Up
•	Track corrective actions
•	Verify implementation
•	Automatically close audit
•	Move follow-ups from “Completed” → “Closed”
•	Clicking a follow-up should navigate the user to the relevant audit.
•	Display follow-ups in a list view respective to each user.
________________________________________
User Access & Workflow
•	Restrict audit visibility so users only see audits assigned to them; only admins can view all audits.
•	New workflow: when an audit is created, it can be assigned to multiple auditors to form a team. Follow-ups and AI-generated audit reports are team-based.
5. Evidence Management (ISO 27001)
•	Upload evidence (images, docs, logs, spreadsheets)
•	Automatic timestamping
•	Version control
•	Evidence linking to controls, findings & CAPA
6. Audit Planning & Execution
•	Improve audit plan flow, including:
o	Risk-based annual audit planning
o	Audit prioritization
o	Resource scheduling and assignment
•	Automate audit planning, execution, and reporting processes.
•	Improve current workflow execution for efficiency.
7. Compliance & Standards
•	Incorporate and strengthen compliance with ISO standards and frameworks, including:
o	ISO 27001, ISO 9001, ISO 20000, ISO 22301
o	COBIT 5, NIST frameworks
o	NDPR
•	Support standard policies including Clauses 4-10 documents, HR Manual, Business Continuity Policy, Access Control Policy, Cryptography Policy, Backup Policy, Acceptable Use Policy, etc.
8. Risk & Gap Analysis
•	Enable risk assessment functionality.
•	Track gap analysis and corrective/preventive actions.
9. Audit History & Log Registry
•	Implement a log registry to store and access all past audits.
10. Assets & Inventory Management
•	List all GBB assets with details:
o	Asset value, procurement date, responsible person, assignment history.
o	Record when an asset is sold, including sale date and amount.
12. Role & Vendor Management
•	Role Matrix: list all roles in GBB and systems they can access.
•	Vendor Management: list vendors, evaluation questionnaires, contact persons, SLA agreements, and other relevant vendor info.
•	.
________________________________________
3. ISO-Aligned Checklist Templates
•	Provide built-in templates for:
o	ISO 27001 (controls A.5–A.18)
o	ISO 9001
o	ISO 22301
o	ISO 45001
•	Each checklist item must include:
o	Clause reference (e.g., A.9.2.1)
o	Evidence upload option
o	Notes field
o	Compliance score
o	Next Review/Due Date
•	Allow custom checklist creation.
________________________________________
4. Corrective & Preventive Actions (CAPA)
•	Create corrective actions for non-conformities
•	Assign responsible users
•	Add due dates
•	Perform root-cause analysis (Five Whys )
•	Track implementation progress
•	Verify closure
•	Link CAPA to findings + evidence
(Required by ISO 9001 & ISO 27001)
________________________________________


•	ISO-required segregation of duties:
o	Admin
o	Auditors, Auditees,
o	Other depts 
o	employees and staff 
•	Auditors only see audits assigned to them
•	Admin sees all audits, basically everything in the system 
•	Audit teams: assign multiple auditors to an audit
•	The system is used by other depts as well cos of the workflow engine and also its integration to other inhouse systems. 
•	Other staff and other depts cant view audits, they can only view workflow for now 
•	Only affect the access filters and queries.
________________________________________
7. Risk Assessment Engine (ISO 31000 / 27005)
•	Likelihood scoring
•	Impact scoring
•	Generate automatic risk rating
•	Risk matrix (Green / Yellow / Red)
•	Suggest controls from ISO 27001
•	Link risks to assets, findings, and CAPA
________________________________________
8. Document Control System (ISO 9001 & ISO 27001)
•	Upload & manage all organizational documents:
o	HR Manual
o	Business Continuity Policy
o	Access Control Policy
o	Cryptography Policy
o	Backup Policy
o	Acceptable Use Policy
o	SOPs
o	Training records
o	Contracts & third-party agreements
Document Management Features:
•	Version control
•	Approval workflow
•	Expiry dates
•	Change history
•	Search & tagging
(ISO requires strict document control.)
________________________________________
9. Audit Trail (Mandatory for ISO 27001)
System must automatically log:
•	Who performed each action
•	Time & date
•	Before & after values
•	Login attempts
•	Document access
•	Evidence uploads
•	Status changes
________________________________________
10. Assets & Inventory Module
•	List all assets with:
o	Asset category
o	Value
o	Procurement date
o	Owner/responsible person
o	Assignment history
o	Disposal date/value
•	Link assets to:
o	Risks
o	Controls
o	Findings
________________________________________
11. Vendor & Third-Party Management
•	Store vendor details
•	SLA documents
•	Evaluation questionnaires
•	Contact persons
•	Risk rating
•	Evidence of compliance
________________________________________
12. Role Matrix Management
•	Define roles in the organization
•	Assign system access levels
•	Link roles to departments and policies
________________________________________
13. Gap Analysis Module
•	Compare current state vs. ISO requirements
•	Automatically compute gaps
•	Link gaps to CAPA
•	Track progress to closure
________________________________________
14. Audit History & Log Registry
•	Store all past audits
•	Ability to search, filter, and export
•	Include full audit trail of each audit
________________________________________
15. Workflow Optimization
•	Improve existing workflow execution speed
•	Enable automation in:
o	Audit planning
o	Execution
o	Reporting
o	Follow-up
•	Allow status transitions based on ISO rules
________________________________________
16. Exporting & Reporting
•	Export reports as PDF, Word, CSV
•	ISO-required report layout:
o	Executive summary
o	Objectives, scope, & criteria
o	Findings (conformity/non-conformity)
o	Evidence summary
o	CAPA plan
o	Closure verification
________________________________________
Got it.


✔ You already have the audit workflow (basic)
✔ You already have authentication
✔ You already have UI screens
These prompts will tell the AI/dev tool exactly what updates to implement.
________________________________________
These are the correct order and best possible structure for updating an existing audit system.
________________________________________
