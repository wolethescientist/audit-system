# Implementation Plan

- [x] 1. Implement Manager and Department Head User Management




  - [x] 1.1 Add authorization functions for user management


    - Create `can_manage_users()` function in auth.py
    - Create `get_assignable_roles()` function in auth.py
    - Implement department-scoped permission checks
    - _Requirements: 1.1, 1.2, 1.5_

  - [x] 1.2 Modify user creation endpoint with role-based authorization


    - Update `/users/` POST endpoint to check `can_manage_users()`
    - Add role assignment validation using `get_assignable_roles()`
    - Enforce department constraint for non-admin users
    - _Requirements: 1.3, 1.4, 1.5_

  - [x] 1.3 Create assignable roles endpoint


    - Implement `/users/assignable-roles` GET endpoint
    - Return filtered role list based on current user's role
    - _Requirements: 1.3, 1.4_

  - [x] 1.4 Update UserManagement frontend component


    - Add state for assignable roles
    - Fetch assignable roles on component mount
    - Filter role dropdown based on assignable roles
    - Show create user button for managers and department heads
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Fix Follow-Up Filter Functionality





  - [x] 2.1 Enhance follow-ups endpoint with comprehensive filters


    - Add query parameters: status, assigned_to_id, start_date, end_date, audit_id
    - Implement filter logic for each parameter
    - Add support for multiple simultaneous filters
    - Maintain role-based access control in filtered results
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.2 Update followups page with enhanced filter UI


    - Add filter state for all filter types
    - Create filter UI components (status, assignee, date range, audit)
    - Fetch users and audits for filter dropdowns
    - Update query to include all filter parameters
    - Implement clear filters functionality
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Implement Flexible Finding Assignment



  - [x] 3.1 Create audit team members endpoint


    - Implement `/audits/{audit_id}/team-members` GET endpoint
    - Query AuditTeam table for active team members
    - Return list of users assigned to the audit
    - _Requirements: 3.1_

  - [x] 3.2 Add team member validation to findings endpoint


    - Update findings creation endpoint
    - Validate assignee is a member of the audit team
    - Return appropriate error if assignee not on team
    - _Requirements: 3.1, 3.2_

  - [x] 3.3 Update findings frontend with team member selector



    - Fetch audit team members using new endpoint
    - Replace assignee input with team member dropdown
    - Display team member name and role in dropdown
    - Show assigned member in findings list
    - Add notification on assignment
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Simplify Access Control Interface




  - [x] 4.1 Create permission groups structure in backend


    - Define PERMISSION_GROUPS dictionary with logical groupings
    - Group permissions by functional area
    - Add clear labels and descriptions for each group
    - _Requirements: 4.1, 4.2_

  - [x] 4.2 Create permission groups endpoint


    - Implement `/rbac/permission-groups` GET endpoint
    - Return permission groups structure
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 4.3 Create role templates endpoint


    - Implement `/rbac/role-templates` GET endpoint
    - Define predefined role templates (auditor, risk assessor, manager)
    - Return templates with permission group mappings
    - _Requirements: 4.5_

  - [x] 4.4 Update AccessControl frontend with simplified UI


    - Fetch permission groups from backend
    - Create card-based permission group selection UI
    - Add contextual help tooltips for each group
    - Implement quick role template buttons
    - Replace complex permission checkboxes with grouped cards
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Implement Soft Delete for User Records




  - [x] 5.1 Add soft delete fields to User model


    - Add is_deleted, deleted_at, deleted_by_id, deletion_reason columns
    - Create relationship for deleted_by user
    - _Requirements: 5.1, 5.2_

  - [x] 5.2 Create database migration for soft delete fields



    - Generate Alembic migration
    - Add columns with appropriate types and constraints
    - Create index on is_deleted column
    - Create foreign key for deleted_by_id
    - _Requirements: 5.1, 5.2_

  - [x] 5.3 Update user list endpoint to exclude deleted users


    - Modify `/users/` GET endpoint
    - Add include_deleted query parameter
    - Filter out soft-deleted users by default
    - _Requirements: 5.4_

  - [x] 5.4 Create deleted users list endpoint


    - Implement `/users/deleted` GET endpoint
    - Require SYSTEM_ADMIN role
    - Return all soft-deleted users
    - _Requirements: 5.5_

  - [x] 5.5 Update user delete endpoint for soft delete


    - Modify `/users/{user_id}` DELETE endpoint
    - Set is_deleted=True instead of removing record
    - Record deletion timestamp and admin who deleted
    - Store optional deletion reason
    - Prevent self-deletion
    - Set is_active=False to prevent login
    - _Requirements: 5.1, 5.2, 5.3_



  - [x] 5.6 Create user restore endpoint





    - Implement `/users/{user_id}/restore` POST endpoint
    - Require SYSTEM_ADMIN role
    - Clear soft delete fields


    - Reactivate user account
    - _Requirements: 5.6_

  - [x] 5.7 Update authentication to block deleted users


    - Modify get_current_user() function
    - Check is_deleted flag
    - Return 403 error for deleted users with appropriate message


    - _Requirements: 5.3_

  - [x] 5.8 Update UserResponse schema

































    - Add soft delete fields to schema
    - Make fields optional and admin-only visible
    - _Requirements: 5.1, 5.2, 5.5_




  - [x] 5.9 Create DeletedUsers frontend component




    - Create new page/component for viewing deleted users
    - Fetch deleted users from backend
    - Display user details with deletion info
    - Add restore button for each user
    - Show deletion timestamp and reason
    - _Requirements: 5.5, 5.6_


  - [x] 5.10 Update UserManagement component for soft delete




    - Add delete confirmation dialog
    - Add optional deletion reason input
    - Update delete mutation to use soft delete endpoint
    - Add link to view deleted users page
    - Update success message to indicate soft delete
    - _Requirements: 5.1, 5.2, 5.5_

- [x] 6. Ensure Historical Data Integrity





  - [x] 6.1 Verify audit trail references to deleted users


    - Test that audit logs maintain references to soft-deleted users
    - Verify findings, follow-ups, and other records show deleted user names
    - Ensure reports can still display historical data with deleted users
    - _Requirements: 5.7_
