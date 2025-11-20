# Testing Guide

## Manual Testing Workflow

### 1. Authentication Testing

#### Sign Up
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test User",
    "role": "auditor",
    "department_id": null
  }'
```

#### Login
```bash
curl -X POST "http://localhost:8000/auth/login?email=test@example.com"
```

Save the returned token for subsequent requests.

#### Validate Token
```bash
curl -X GET http://localhost:8000/auth/validate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Department Testing

#### Create Department
```bash
curl -X POST http://localhost:8000/departments/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Finance Department",
    "parent_department_id": null
  }'
```

#### List Departments
```bash
curl -X GET http://localhost:8000/departments/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. User Management Testing

#### Create User (Admin Only)
```bash
curl -X POST http://localhost:8000/users/ \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "auditor@example.com",
    "full_name": "John Auditor",
    "role": "auditor",
    "department_id": "DEPARTMENT_UUID"
  }'
```

#### List Users
```bash
curl -X GET http://localhost:8000/users/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Audit Workflow Testing

#### Create Audit
```bash
curl -X POST http://localhost:8000/audits/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Q1 2024 Financial Audit",
    "year": 2024,
    "scope": "Review financial controls and processes",
    "risk_rating": "high",
    "department_id": "DEPARTMENT_UUID"
  }'
```

#### Add Team Member
```bash
curl -X POST http://localhost:8000/audits/AUDIT_UUID/team \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_UUID",
    "role_in_audit": "Lead Auditor"
  }'
```

#### Create Work Program
```bash
curl -X POST http://localhost:8000/audits/AUDIT_UUID/work-program \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "procedure_name": "Test Internal Controls",
    "description": "Test the effectiveness of internal controls"
  }'
```

#### Upload Evidence
```bash
curl -X POST http://localhost:8000/audits/AUDIT_UUID/evidence \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "file_name": "control_matrix.xlsx",
    "file_url": "https://storage.example.com/evidence/control_matrix.xlsx",
    "description": "Control matrix documentation"
  }'
```

#### Create Finding
```bash
curl -X POST http://localhost:8000/audits/AUDIT_UUID/findings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Segregation of Duties Issue",
    "severity": "high",
    "impact": "Risk of unauthorized transactions",
    "root_cause": "Lack of proper role separation",
    "recommendation": "Implement dual authorization for transactions above $10,000"
  }'
```

#### Create Query
```bash
curl -X POST http://localhost:8000/audits/AUDIT_UUID/queries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_user_id": "USER_UUID",
    "message": "Please provide the reconciliation reports for Q1",
    "parent_query_id": null
  }'
```

#### Create Report
```bash
curl -X POST http://localhost:8000/audits/AUDIT_UUID/report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Audit Report\n\n## Executive Summary\n\nThis audit reviewed..."
  }'
```

#### Create Follow-up
```bash
curl -X POST http://localhost:8000/audits/AUDIT_UUID/followup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "finding_id": "FINDING_UUID",
    "assigned_to_id": "USER_UUID",
    "due_date": "2024-12-31T00:00:00Z"
  }'
```

#### Finalize Audit
```bash
curl -X POST http://localhost:8000/audits/AUDIT_UUID/finalize \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Analytics Testing

#### Dashboard Overview
```bash
curl -X GET http://localhost:8000/analytics/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Findings Summary
```bash
curl -X GET http://localhost:8000/analytics/findings-summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Audit Completion
```bash
curl -X GET http://localhost:8000/analytics/audit-completion \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend Testing

### 1. Authentication Flow
1. Navigate to `http://localhost:3000`
2. Should redirect to `/login`
3. Enter email address
4. Click "Sign In"
5. Should redirect to `/dashboard`

### 2. Dashboard Testing
1. Verify all metrics display correctly
2. Check for loading states
3. Verify role-based navigation items

### 3. Audit Management
1. Navigate to `/audits`
2. Click "Create Audit"
3. Fill in audit details
4. Submit form
5. Verify redirect to audit detail page

### 4. Audit Detail Page
1. Navigate to specific audit
2. Verify all tabs are accessible
3. Test creating findings
4. Test uploading evidence
5. Test creating queries

### 5. User Management (Admin Only)
1. Navigate to `/users`
2. Verify user list displays
3. Test user creation
4. Test role assignment

### 6. Analytics Dashboard
1. Navigate to `/analytics`
2. Verify charts display
3. Check data accuracy

## Role-Based Access Testing

### System Admin
- ✅ Can access all pages
- ✅ Can create users
- ✅ Can create departments
- ✅ Can manage all audits

### Audit Manager
- ✅ Can create audits
- ✅ Can assign teams
- ✅ Can approve reports
- ❌ Cannot access user management

### Auditor
- ✅ Can execute audits
- ✅ Can create findings
- ✅ Can draft reports
- ❌ Cannot finalize audits

### Department Head
- ✅ Can view department audits
- ✅ Can respond to queries
- ❌ Cannot create audits

### Viewer
- ✅ Can view audits
- ✅ Can view reports
- ❌ Cannot create or edit anything

## API Documentation Testing

1. Navigate to `http://localhost:8000/docs`
2. Test each endpoint using Swagger UI
3. Verify request/response schemas
4. Test authentication with "Authorize" button

## Performance Testing

### Load Testing with Apache Bench
```bash
# Test login endpoint
ab -n 1000 -c 10 -p login.json -T application/json \
  http://localhost:8000/auth/login

# Test audit listing
ab -n 1000 -c 10 -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/audits/
```

### Database Query Performance
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

## Security Testing

### 1. Authentication
- ✅ Verify token expiration works
- ✅ Test invalid token rejection
- ✅ Test missing token rejection

### 2. Authorization
- ✅ Test role-based access control
- ✅ Verify 403 responses for unauthorized access
- ✅ Test cross-user data access prevention

### 3. Input Validation
- ✅ Test SQL injection prevention
- ✅ Test XSS prevention
- ✅ Test invalid data rejection

## Automated Testing (Future)

### Backend Tests (pytest)
```python
# tests/test_auth.py
def test_signup():
    response = client.post("/auth/signup", json={
        "email": "test@example.com",
        "full_name": "Test User",
        "role": "auditor"
    })
    assert response.status_code == 200

def test_login():
    response = client.post("/auth/login?email=test@example.com")
    assert response.status_code == 200
    assert "access_token" in response.json()
```

### Frontend Tests (Jest + React Testing Library)
```typescript
// __tests__/Login.test.tsx
test('renders login form', () => {
  render(<LoginPage />);
  expect(screen.getByText('Sign in to continue')).toBeInTheDocument();
});

test('submits login form', async () => {
  render(<LoginPage />);
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'test@example.com' }
  });
  fireEvent.click(screen.getByText('Sign In'));
  // Assert API call was made
});
```

## Test Data Setup

### Create Test Users
```sql
INSERT INTO users (id, email, full_name, role, is_active)
VALUES 
  (gen_random_uuid(), 'admin@test.com', 'Admin User', 'system_admin', true),
  (gen_random_uuid(), 'manager@test.com', 'Manager User', 'audit_manager', true),
  (gen_random_uuid(), 'auditor@test.com', 'Auditor User', 'auditor', true);
```

### Create Test Departments
```sql
INSERT INTO departments (id, name)
VALUES 
  (gen_random_uuid(), 'Finance'),
  (gen_random_uuid(), 'IT'),
  (gen_random_uuid(), 'Operations');
```

## Troubleshooting Tests

### Backend Issues
- Check logs: `tail -f backend.log`
- Verify database connection
- Check environment variables

### Frontend Issues
- Check browser console
- Verify API URL in `.env.local`
- Check network tab for failed requests

### Database Issues
- Check connection string
- Verify migrations are applied
- Check table existence

## Test Checklist

- [ ] Authentication works
- [ ] All user roles function correctly
- [ ] Audit creation works
- [ ] Evidence upload works
- [ ] Findings can be created
- [ ] Reports can be generated
- [ ] Follow-ups can be tracked
- [ ] Analytics display correctly
- [ ] Role-based access is enforced
- [ ] API documentation is accessible
- [ ] Frontend pages load correctly
- [ ] Navigation works
- [ ] Forms validate input
- [ ] Error messages display
- [ ] Loading states work
