# Implementation Plan

- [x] 1. Implement Two-Factor Authentication (2FA)


  - [x] 1.1 Add 2FA fields to User model and create database migration


    - Add `totp_secret`, `totp_enabled`, `backup_codes` columns to User model
    - Create Alembic migration for new columns
    - _Requirements: 1.1, 1.5_



  - [x] 1.2 Create 2FA backend service and endpoints


    - Install `pyotp` and `qrcode` packages
    - Create `/auth/2fa/setup` endpoint to generate TOTP secret and QR code
    - Create `/auth/2fa/verify` endpoint to validate codes
    - Create `/auth/2fa/disable` endpoint


    - Generate backup codes during setup
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.3 Modify login flow to support 2FA verification


    - Update `/auth/login` to check `totp_enabled` status
    - Return `requires_2fa: true` flag when 2FA is enabled
    - Create `/auth/login/2fa` endpoint for second-step verification
    - _Requirements: 1.2, 1.3, 1.4_



  - [x] 1.4 Create frontend 2FA setup component


    - Add 2FA settings section in user profile/settings


    - Display QR code for authenticator app scanning


    - Show backup codes with copy/download option
    - _Requirements: 1.1, 1.5_



  - [x] 1.5 Update login page with 2FA verification step


    - Add 2FA code input form after password verification

    - Handle `requires_2fa` response from login


    - Support backup code entry
    - _Requirements: 1.2, 1.3, 1.4_


- [x] 2. Fix Role Matrix Management Issues

  - [x] 2.1 Fix edit form pre-fill in RoleMatrix component


    - Update `handleEditClick` to populate formData with selected role values
    - Ensure all permission checkboxes reflect current role state
    - _Requirements: 2.1, 2.2_



  - [x] 2.2 Implement view button functionality
    - Add `showViewModal` state and view modal component
    - Create read-only display of role details and permissions

    - Wire eye button click to open view modal


    - _Requirements: 3.1, 3.2_

- [x] 3. Fix Asset Management Issues
  - [x] 3.1 Enhance warranty expiry date picker


    - Replace basic date input with calendar-based picker
    - Add month/year navigation for easier date selection
    - _Requirements: 4.1, 4.2_

  - [x] 3.2 Add procurement date validation


    - Implement frontend validation: procurement date < warranty expiry

    - Add backend validation in asset create/update endpoints
    - Display clear error message when validation fails
    - _Requirements: 5.1, 5.2_



  - [x] 3.3 Implement user search by name for asset assignment
    - Replace user ID input with searchable dropdown
    - Fetch and display users with names

    - Filter users by name as user types
    - _Requirements: 6.1, 6.2_

- [x] 4. Implement Workflow Enhancements
  - [x] 4.1 Add custom action text input for workflow steps

    - Add `custom_action_text` field to WorkflowStep model
    - Create database migration for new column
    - Update workflow schemas

    - _Requirements: 7.1, 7.2_

  - [x] 4.2 Update workflow creation form with custom action option

    - Add "Custom" option to action_required dropdown
    - Show text input when custom is selected
    - Save custom action text with step data
    - _Requirements: 7.1, 7.2_



  - [x] 4.3 Create WorkflowDocument model and migration
    - Define WorkflowDocument model with file metadata fields


    - Create Alembic migration
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 4.4 Implement workflow document upload endpoint
    - Create `/workflows/{id}/documents` POST endpoint
    - Store files in Supabase storage
    - Return document metadata
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 4.5 Add document upload UI to workflow creation
    - Add file upload section in workflow form
    - Display uploaded documents list
    - Allow document removal before submission
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 4.6 Make workflow audit_id optional and add sender fields
    - Update Workflow model: make audit_id nullable
    - Add sender_name, sender_department fields
    - Create database migration
    - Update schemas and API endpoints
    - _Requirements: 15.1, 15.2_

  - [x] 4.7 Update workflow creation form for standalone workflows
    - Make audit selection optional
    - Auto-populate sender info from current user
    - Add expanded action type options (Create Document, Add Minutes)
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [x] 5. Fix Audit Evidence Upload Issues
  - [x] 5.1 Change upload button label
    - Update button text from "Upload to Supabase" to "Upload"
    - _Requirements: 9.1_

  - [x] 5.2 Implement duplicate evidence detection
    - Add `file_hash` column to Evidence model
    - Create database migration
    - Calculate SHA256 hash on file upload
    - Check for existing files with same hash
    - _Requirements: 10.1, 10.2_

  - [x] 5.3 Add duplicate handling UI
    - Handle 409 conflict response from backend
    - Show dialog with replace/cancel options
    - Implement replace functionality
    - _Requirements: 10.2, 10.3_

- [x] 6. Fix Risk Assessment Issues
  - [x] 6.1 Make related asset field mandatory


    - Add required attribute to asset dropdown
    - Add frontend validation before form submission
    - Add backend validation in risk creation endpoint
    - _Requirements: 11.1, 11.2_


  - [x] 6.2 Remove Related Audit field from form
    - Remove audit_id dropdown from RiskAssessmentForm
    - Remove audit_id from form state
    - Update form layout
    - _Requirements: 12.1_


  - [x] 6.3 Update risk impact to qualitative categories
    - Remove monetary/financial references from impact options
    - Display only qualitative labels (Critical, Major, Moderate, Minor, Negligible)
    - Update impact scale display
    - _Requirements: 13.1, 13.2_


  - [x] 6.4 Add next review date validation

    - Implement frontend validation: date must be in future
    - Set min attribute on date input to today
    - Add backend validation
    - Display error for past dates
    - _Requirements: 14.1, 14.2_


