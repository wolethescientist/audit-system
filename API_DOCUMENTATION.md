# API Documentation

Base URL: `http://localhost:8000`

## Authentication

### Sign Up
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "auditor",
  "department_id": "uuid-here"
}
```

### Login
```http
POST /auth/login?email=user@example.com

Response:
{
  "access_token": "jwt-token",
  "token_type": "bearer"
}
```

### Validate Token
```http
GET /auth/validate
Authorization: Bearer {token}
```

## Users

### Create User
```http
POST /users/
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "user@example.com",
  "full_name": "Jane Smith",
  "role": "auditor",
  "department_id": "uuid"
}
```

### List Users
```http
GET /users/
Authorization: Bearer {token}
```

### Get User
```http
GET /users/{user_id}
Authorization: Bearer {token}
```

### Update User
```http
PUT /users/{user_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "full_name": "Updated Name",
  "role": "audit_manager"
}
```

### Disable User
```http
DELETE /users/{user_id}
Authorization: Bearer {token}
```

## Departments

### Create Department
```http
POST /departments/
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Finance Department",
  "parent_department_id": "uuid-optional"
}
```

### List Departments
```http
GET /departments/
Authorization: Bearer {token}
```

## Audits

### Create Audit
```http
POST /audits/
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Annual Financial Audit 2024",
  "year": 2024,
  "scope": "Review financial controls",
  "risk_rating": "high",
  "department_id": "uuid",
  "assigned_manager_id": "uuid"
}
```

### List Audits
```http
GET /audits/
Authorization: Bearer {token}
```

### Get Audit
```http
GET /audits/{audit_id}
Authorization: Bearer {token}
```

### Update Audit
```http
PUT /audits/{audit_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "executing",
  "scope": "Updated scope"
}
```

### Add Team Member
```http
POST /audits/{audit_id}/team
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": "uuid",
  "role_in_audit": "Lead Auditor"
}
```

### Create Work Program
```http
POST /audits/{audit_id}/work-program
Authorization: Bearer {token}
Content-Type: application/json

{
  "procedure_name": "Test Controls",
  "description": "Test internal controls"
}
```

### Upload Evidence
```http
POST /audits/{audit_id}/evidence
Authorization: Bearer {token}
Content-Type: application/json

{
  "file_name": "evidence.pdf",
  "file_url": "https://storage.url/file.pdf",
  "description": "Supporting document"
}
```

### Create Finding
```http
POST /audits/{audit_id}/findings
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Control Weakness",
  "severity": "high",
  "impact": "Financial misstatement risk",
  "root_cause": "Lack of segregation of duties",
  "recommendation": "Implement dual authorization"
}
```

### Create Query
```http
POST /audits/{audit_id}/queries
Authorization: Bearer {token}
Content-Type: application/json

{
  "to_user_id": "uuid",
  "message": "Please provide supporting documents",
  "parent_query_id": "uuid-optional"
}
```

### Create Report
```http
POST /audits/{audit_id}/report
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Audit report content in markdown or HTML"
}
```

### Update Report
```http
PUT /audits/{audit_id}/report/{report_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "under_review",
  "comments": "Please review section 3"
}
```

### Create Follow-up
```http
POST /audits/{audit_id}/followup
Authorization: Bearer {token}
Content-Type: application/json

{
  "finding_id": "uuid",
  "assigned_to_id": "uuid",
  "due_date": "2024-12-31T00:00:00Z"
}
```

### Finalize Audit
```http
POST /audits/{audit_id}/finalize
Authorization: Bearer {token}
```

## Analytics

### Dashboard Overview
```http
GET /analytics/dashboard
Authorization: Bearer {token}

Response:
{
  "total_audits": 10,
  "planned_audits": 3,
  "executing_audits": 4,
  "completed_audits": 3,
  "total_findings": 25,
  "critical_findings": 5,
  "overdue_followups": 2
}
```

### Findings Summary
```http
GET /analytics/findings-summary
Authorization: Bearer {token}
```

### Audit Completion Chart
```http
GET /analytics/audit-completion
Authorization: Bearer {token}
```

## Role-Based Access Control

### Roles and Permissions

**System Admin**
- Full access to all endpoints
- User management
- Department management
- System configuration

**Audit Manager**
- Create and manage audits
- Assign team members
- Review and approve reports
- View all analytics

**Auditor**
- Execute audits
- Create findings
- Upload evidence
- Draft reports

**Department Head**
- View audits for their department
- Respond to queries
- Review findings

**Department Officer**
- View assigned audits
- Respond to queries
- Upload evidence

**Viewer**
- Read-only access to audits and reports

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
