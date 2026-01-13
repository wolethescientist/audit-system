# Requirements Document

## Introduction

This document captures the second batch of stakeholder-identified improvements for the Galaxy ISO Audit System. These enhancements focus on user management capabilities, access control simplification, follow-up filtering, finding assignment flexibility, and implementing soft delete functionality for user records.

## Glossary

- **Galaxy_Audit_System**: The ISO compliance and audit management application
- **User_Management_Module**: The component responsible for creating, managing, and deactivating user accounts
- **Access_Control_Module**: The component managing user permissions and role-based access
- **Follow_Up_Module**: The component tracking and managing audit follow-up actions
- **Finding_Assignment_Module**: The component for assigning audit findings to team members
- **Soft_Delete**: A data management pattern where records are marked as deleted but retained in the database

## Requirements

### Requirement 1: Manager and Head of Department User Management

**User Story:** As a manager or head of department, I want the ability to add users and assign roles, so that I can manage my team's access without requiring administrator intervention.

#### Acceptance Criteria

1. WHEN a user with Manager role accesses the user management interface, THE User_Management_Module SHALL display options to create new users.
2. WHEN a user with Head_of_Department role accesses the user management interface, THE User_Management_Module SHALL display options to create new users.
3. WHEN a Manager creates a new user, THE User_Management_Module SHALL allow role assignment from a predefined list of roles.
4. WHEN a Head_of_Department creates a new user, THE User_Management_Module SHALL allow role assignment from a predefined list of roles.
5. WHEN a Manager or Head_of_Department assigns a role, THE User_Management_Module SHALL validate that the assigned role is within their authorization scope.

### Requirement 2: Follow-Up Filter Functionality

**User Story:** As an auditor, I want the follow-up filter to work correctly, so that I can efficiently locate specific follow-up items based on status, date, or assignee.

#### Acceptance Criteria

1. WHEN a user applies a status filter in the follow-up list, THE Follow_Up_Module SHALL display only follow-ups matching the selected status.
2. WHEN a user applies a date range filter, THE Follow_Up_Module SHALL display only follow-ups within the specified date range.
3. WHEN a user applies an assignee filter, THE Follow_Up_Module SHALL display only follow-ups assigned to the selected user.
4. WHEN multiple filters are applied simultaneously, THE Follow_Up_Module SHALL display follow-ups matching all filter criteria.
5. WHEN a user clears filters, THE Follow_Up_Module SHALL display all follow-up items.

### Requirement 3: Flexible Finding Assignment

**User Story:** As an audit team lead, I want to assign findings to any team member assigned to the audit, so that work can be distributed flexibly among the audit team.

#### Acceptance Criteria

1. WHEN assigning a finding, THE Finding_Assignment_Module SHALL display all users who are members of the audit team.
2. WHEN a user selects an assignee for a finding, THE Finding_Assignment_Module SHALL allow selection of any audit team member regardless of their specific role.
3. WHEN a finding is assigned, THE Finding_Assignment_Module SHALL record the assignee and notify them of the assignment.
4. WHEN viewing findings, THE Finding_Assignment_Module SHALL display the assigned team member's name for each finding.

### Requirement 4: Simplified Access Control

**User Story:** As a system user, I want a more intuitive and streamlined access control interface, so that I can easily understand and manage permissions without confusion.

#### Acceptance Criteria

1. THE Access_Control_Module SHALL present permissions in logical groupings based on functional areas.
2. THE Access_Control_Module SHALL use clear, non-technical language for permission descriptions.
3. WHEN a user views access control settings, THE Access_Control_Module SHALL display a simplified interface with reduced complexity.
4. WHEN assigning permissions, THE Access_Control_Module SHALL provide contextual help or tooltips explaining each permission's purpose.
5. THE Access_Control_Module SHALL minimize the number of clicks required to assign common permission sets.

### Requirement 5: Soft Delete for User Records

**User Story:** As an administrator, I want deleted users to be moved to a soft-deleted state rather than permanently removed, so that historical data integrity is maintained and users can be restored if needed.

#### Acceptance Criteria

1. WHEN an administrator deletes a user, THE User_Management_Module SHALL mark the user record as deleted without removing it from the database.
2. WHEN a user is soft-deleted, THE User_Management_Module SHALL record the deletion timestamp and the administrator who performed the deletion.
3. WHEN a user is soft-deleted, THE User_Management_Module SHALL prevent the user from logging in.
4. WHEN viewing the user list, THE User_Management_Module SHALL exclude soft-deleted users from the default view.
5. WHEN an administrator accesses deleted records, THE User_Management_Module SHALL display a list of all soft-deleted users with restoration options.
6. WHEN an administrator restores a soft-deleted user, THE User_Management_Module SHALL reactivate the user account and restore login access.
7. WHEN querying historical data, THE Galaxy_Audit_System SHALL maintain references to soft-deleted users for audit trail integrity.
