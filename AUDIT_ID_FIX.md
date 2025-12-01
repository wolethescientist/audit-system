# Audit ID Generation Fix

## Problem

When creating audits or audit reports, the system was throwing this error:

```
psycopg2.errors.NotNullViolation: null value in column "id" of relation "audits" violates not-null constraint
```

## Root Cause

The `Audit` model was configured to use PostgreSQL's `gen_random_uuid()` function for generating IDs:

```python
id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
```

This approach has issues:
1. Requires the `pgcrypto` extension to be enabled in PostgreSQL
2. The extension might not be available in all environments (especially managed databases like Supabase)
3. Inconsistent with other models which use Python's `uuid.uuid4()`

## Solution

Changed the Audit model to use Python's UUID generation, consistent with all other models:

```python
id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
```

## Changes Made

1. **Updated Model** (`backend/app/models.py`):
   - Changed `Audit.id` from `server_default=text("gen_random_uuid()")` to `default=uuid.uuid4`

2. **Created Migration** (`backend/alembic/versions/1ce5a50cd7cc_fix_audit_id_generation.py`):
   - Removes the server default from the `audits.id` column
   - Allows SQLAlchemy to generate UUIDs using Python

3. **Applied Migration**:
   - Ran `alembic upgrade head` to apply the fix

## Testing

After applying this fix, you should be able to:
- ✅ Create new audits without errors
- ✅ Create audit reports without errors
- ✅ All UUID generation happens consistently in Python

## Why This Works

- Python's `uuid.uuid4()` generates UUIDs in the application layer before inserting into the database
- No dependency on database extensions
- Works consistently across all database environments
- Matches the pattern used by all other models in the system

## No Data Loss

This migration only changes how new IDs are generated. All existing audit records remain unchanged and functional.
