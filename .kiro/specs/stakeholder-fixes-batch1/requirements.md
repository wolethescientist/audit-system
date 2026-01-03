# Requirements Document

## Introduction

This document captures stakeholder-identified fixes and improvements across multiple modules of the Galaxy ISO Audit System. The fixes span authentication (2FA), Role Matrix Management, Asset Management, Workflow Management, Audit Evidence Upload, and Risk Assessment modules. These improvements aim to enhance usability, data integrity, and user experience.

## Glossary

- **Galaxy_Audit_System**: The ISO compliance and audit management application
- **2FA**: Two-Factor Authentication - a security mechanism requiring two forms of verification
- **Role_Matrix**: The component managing user roles and their permissions
- **Asset_Management**: The module for tracking organizational assets
- **Workflow_Module**: The component managing approval workflows and document routing
- **Risk_Assessment_Module**: The component for conducting and managing risk assessments
- **Audit_Module**: The component for managing audit processes and evidence

## Requirements

### Requirement 1: Two-Factor Authentication

**User Story:** As a system administrator, I want users to authenticate using two-factor authentication, so that the system has enhanced security against unauthorized access.

#### Acceptance Criteria

1. WHEN a user enables 2FA, THE Galaxy_Audit_System SHALL generate a TOTP secret and display a QR code for authenticator app setup.
2. WHEN a user with 2FA enabled attempts to login, THE Galaxy_Audit_System SHALL prompt for a 6-digit verification code after successful password authentication.
3. WHEN a user enters an invalid 2FA code, THE Galaxy_Audit_System SHALL reject the login attempt and display an error message.
4. WHEN a user enters a valid 2FA code, THE Galaxy_Audit_System SHALL complete the authentication and grant access.
5. WHERE 2FA is enabled for a user, THE Galaxy_Audit_System SHALL provide backup recovery codes during initial setup.

### Requirement 2: Role Matrix Edit Form Pre-fill

**User Story:** As an administrator, I want the role name to be pre-filled when editing a role, so that I can see the current value and make targeted changes.

#### Acceptance Criteria

1. WHEN a user clicks the edit button for a role, THE Role_Matrix SHALL pre-populate the edit form with the existing role name.
2. WHEN a user clicks the edit button for a role, THE Role_Matrix SHALL pre-populate all existing permission settings.

### Requirement 3: Role Matrix View Button

**User Story:** As an administrator, I want the view (eye) button to display role details, so that I can review role configurations without entering edit mode.

#### Acceptance Criteria

1. WHEN a user clicks the view (eye) button for a role, THE Role_Matrix SHALL display a read-only view of the role details.
2. WHEN the view modal is displayed, THE Role_Matrix SHALL show the role name and all associated permissions.

### Requirement 4: Asset Warranty Date Picker

**User Story:** As an asset manager, I want a smoother date picker for warranty expiry, so that I can efficiently enter warranty dates.

#### Acceptance Criteria

1. WHEN creating or editing an asset, THE Asset_Management SHALL provide a calendar-based date picker for warranty expiry selection.
2. WHEN the date picker is opened, THE Asset_Management SHALL allow month and year navigation for efficient date selection.

### Requirement 5: Asset Procurement Date Validation

**User Story:** As an asset manager, I want the system to validate that procurement date is earlier than warranty expiry, so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN a user enters asset dates, THE Asset_Management SHALL validate that the procurement date is earlier than the warranty expiry date.
2. IF the procurement date is later than or equal to the warranty expiry date, THEN THE Asset_Management SHALL display a validation error and prevent form submission.

### Requirement 6: Asset Assignment Search by Name

**User Story:** As an asset manager, I want to search for users by name when assigning assets, so that I can quickly find the correct assignee.

#### Acceptance Criteria

1. WHEN assigning an asset to a user, THE Asset_Management SHALL provide a searchable dropdown that filters users by name.
2. WHEN a user types in the assignee field, THE Asset_Management SHALL display matching user names in real-time.

### Requirement 7: Workflow Action Required Text Input

**User Story:** As a workflow initiator, I want to specify custom action instructions, so that I can communicate specific requirements to workflow participants.

#### Acceptance Criteria

1. WHEN creating a workflow, THE Workflow_Module SHALL provide a text input field for specifying custom action required instructions.
2. WHEN a workflow is received, THE Workflow_Module SHALL display the custom action required text to the recipient.

### Requirement 8: Workflow Document Attachment

**User Story:** As a workflow initiator, I want to attach reference documents to workflows, so that recipients have the necessary context for their actions.

#### Acceptance Criteria

1. WHEN creating a workflow, THE Workflow_Module SHALL provide an option to upload reference documents.
2. WHEN a workflow is received, THE Workflow_Module SHALL display attached documents for download by the recipient.
3. WHEN uploading documents, THE Workflow_Module SHALL support common document formats (PDF, DOCX, XLSX).

### Requirement 9: Audit Evidence Upload Button Label

**User Story:** As an auditor, I want clear button labels for evidence upload, so that I understand the action being performed.

#### Acceptance Criteria

1. THE Audit_Module SHALL display "Upload" as the button label instead of "Upload to Supabase" for evidence upload actions.

### Requirement 10: Audit Duplicate Evidence Detection

**User Story:** As an auditor, I want the system to detect duplicate evidence uploads, so that only unique records are maintained.

#### Acceptance Criteria

1. WHEN uploading evidence, THE Audit_Module SHALL check for existing files with the same name and content hash.
2. IF a duplicate file is detected, THEN THE Audit_Module SHALL notify the user and prevent the duplicate upload.
3. WHEN a duplicate is detected, THE Audit_Module SHALL provide an option to replace the existing file or cancel the upload.

### Requirement 11: Risk Assessment Mandatory Asset

**User Story:** As a risk assessor, I want the related asset field to be mandatory, so that all risks are properly linked to organizational assets.

#### Acceptance Criteria

1. WHEN conducting a risk assessment, THE Risk_Assessment_Module SHALL require selection of a related asset.
2. IF no asset is selected, THEN THE Risk_Assessment_Module SHALL display a validation error and prevent form submission.

### Requirement 12: Remove Related Audit from Risk Assessment

**User Story:** As a risk assessor, I want the risk assessment form simplified, so that I only see relevant fields.

#### Acceptance Criteria

1. THE Risk_Assessment_Module SHALL NOT display the "Related Audit" field in the risk assessment form.

### Requirement 13: Risk Impact Without Monetary Amount

**User Story:** As a risk assessor, I want to specify risk impact using qualitative categories, so that assessment is based on severity levels rather than monetary values.

#### Acceptance Criteria

1. WHEN assessing risk impact, THE Risk_Assessment_Module SHALL provide qualitative options (Critical, Major, Moderate, Minor, Negligible).
2. THE Risk_Assessment_Module SHALL NOT require monetary amount input for risk impact assessment.

### Requirement 14: Risk Assessment Next Review Date Validation

**User Story:** As a risk assessor, I want the system to prevent past dates for next review, so that review schedules are always in the future.

#### Acceptance Criteria

1. WHEN entering a next review date, THE Risk_Assessment_Module SHALL validate that the date is in the future.
2. IF a past date is entered for next review, THEN THE Risk_Assessment_Module SHALL display a validation error and prevent form submission.

### Requirement 15: Workflow Enhancements - Standalone Workflows

**User Story:** As a workflow initiator, I want to create workflows independent of audits with sender details and flexible action options, so that workflows can be used for general document routing and approvals.

#### Acceptance Criteria

1. WHEN creating a workflow, THE Workflow_Module SHALL allow creation without linking to an audit.
2. WHEN creating a workflow, THE Workflow_Module SHALL capture and display the sender's name and department.
3. WHEN creating a workflow, THE Workflow_Module SHALL provide an "Action Required" dropdown with options including "Create New Document" and "Add Minutes to Selected Document".
4. WHEN creating a workflow, THE Workflow_Module SHALL provide an option to upload custom documents instead of selecting from existing documents.
