# Soft Delete Implementation for User Records

## Overview
This document describes the soft delete functionality implemented for user records in the Galaxy ISO Audit System.

## Implementation Summary

### 1. Database Changes
- **File**: `backend/add_soft_delete_fields.sql`
- Added four new columns to the `users` table:
  - `is_deleted` (BOOLEAN): Flag indicating if user is soft-deleted
  - `deleted_at` (TIMESTAMP): When the user was deleted
  - `deleted_by_id` (UUID): ID of the admin who deleted the user
  - `deletion_reason` (TEXT): Optional reason for deletion
- Created index on `is_deleted` for query performance
- Added foreign key constraint for `deleted_by_id`

**To apply**: Run the SQL script against your database:
```bash
psql -U your_user -d your_database -f backend/add_soft_delete_fields.sql
```

### 2. Backend Changes

#### Models (`backend/app/models.py`)
- Updated `User` model with soft delete fields
- Added `deleted_by` relationship for tracking who deleted the user

#### Authentication (`backend/app/auth.py`)
- Updated `get_current_user()` to check `is_deleted` flag
- Deleted users receive 403 error with message: "This account has been deactivated. Please contact your administrator."

#### Schemas (`backend/app/schemas.py`)
- Updated `UserResponse` schema to include soft delete fields (optional, admin-only visible)

#### API Endpoints (`backend/app/routers/users.py`)
New and updated endpoints:

1. **GET /users/** - Updated to exclude deleted users by default
   - Query parameter: `include_deleted` (boolean) to include soft-deleted users

2. **GET /users/deleted** - List all soft-deleted users (SYSTEM_ADMIN only)

3. **DELETE /users/{user_id}** - Soft delete a user (SYSTEM_ADMIN only)
   - Query parameter: `deletion_reason` (optional string)
   - Prevents self-deletion
   - Sets `is_deleted=True`, `is_active=False`, records timestamp and admin

4. **POST /users/{user_id}/restore** - Restore a soft-deleted user (SYSTEM_ADMIN only)
   - Clears all soft delete fields
   - Reactivates the user account

### 3. Frontend Changes

#### Deleted Users Page (`frontend/src/app/users/deleted/page.tsx`)
New page for viewing and restoring deleted users:
- Lists all soft-deleted users with details
- Shows deletion timestamp and reason
- Provides restore button for each user
- Only accessible to SYSTEM_ADMIN users

#### User Management Component (`frontend/src/components/access/UserManagement.tsx`)
Updated with soft delete functionality:
- Added "View Deleted Users" button (SYSTEM_ADMIN only)
- Added "Delete User" button in user details panel
- Implemented delete confirmation dialog with optional reason input
- Prevents self-deletion
- Shows success message: "User has been soft deleted"

## Features

### Historical Data Integrity
- Deleted users remain in the database
- All audit trails, findings, follow-ups, and other records maintain references to deleted users
- Reports can still display historical data with deleted user names

### Security
- Only SYSTEM_ADMIN role can delete or restore users
- Users cannot delete their own accounts
- Deleted users cannot log in (checked in authentication)
- Deletion is logged with timestamp, admin ID, and optional reason

### User Experience
- Clear confirmation dialog before deletion
- Optional deletion reason field
- Easy restoration process for administrators
- Separate page for viewing deleted users
- Visual indicators for deleted status

## Testing Checklist

- [ ] Run SQL migration script
- [ ] Verify soft delete fields exist in database
- [ ] Test user deletion as SYSTEM_ADMIN
- [ ] Verify deleted user cannot log in
- [ ] Test viewing deleted users list
- [ ] Test restoring a deleted user
- [ ] Verify restored user can log in
- [ ] Test that non-admin users cannot access delete/restore endpoints
- [ ] Verify historical data still references deleted users
- [ ] Test self-deletion prevention

## API Examples

### Soft Delete a User
```bash
DELETE /users/{user_id}?deletion_reason=Account%20no%20longer%20needed
Authorization: Bearer {admin_token}
```

### List Deleted Users
```bash
GET /users/deleted
Authorization: Bearer {admin_token}
```

### Restore a User
```bash
POST /users/{user_id}/restore
Authorization: Bearer {admin_token}
```

### List Users (excluding deleted)
```bash
GET /users/
Authorization: Bearer {token}
```

### List Users (including deleted)
```bash
GET /users/?include_deleted=true
Authorization: Bearer {admin_token}
```

## Requirements Satisfied
- ✅ 5.1: User records marked as deleted without database removal
- ✅ 5.2: Deletion timestamp and admin recorded
- ✅ 5.3: Deleted users prevented from logging in
- ✅ 5.4: Soft-deleted users excluded from default user list
- ✅ 5.5: Admin interface for viewing deleted users
- ✅ 5.6: Restoration functionality for deleted users
- ✅ 5.7: Historical data integrity maintained
