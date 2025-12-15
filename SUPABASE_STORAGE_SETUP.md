# Supabase Storage Setup for Evidence Upload

## Overview
The audit evidence upload feature now uses Supabase Storage (S3-compatible) for secure file storage with integrity checking and metadata tracking.

## Configuration

### 1. Environment Variables
Add the following to your `backend/.env` file:

```env
SUPABASE_URL=https://jyvstpksqrdifxpgywvd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dnN0cGtzcXJkaWZ4cGd5d3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDIyMjIsImV4cCI6MjA3OTIxODIyMn0._aQ4tH7hRemWTthvKtbmI3MdU_72gqwKxBYjVByKT1o
SUPABASE_BUCKET_NAME=audit-evidence
```

### 2. Supabase Storage Bucket Setup

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to Storage section
3. Create a new bucket named `audit-evidence`
4. Configure bucket settings:
   - **Public bucket**: Yes (for easy file access)
   - **File size limit**: 50MB
   - **Allowed MIME types**: 
     - application/pdf
     - application/msword
     - application/vnd.openxmlformats-officedocument.wordprocessingml.document
     - application/vnd.ms-excel
     - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
     - image/jpeg
     - image/png
     - image/gif
     - text/plain
     - text/csv

### 3. Storage Policies (RLS)

If you want to add Row Level Security, create these policies in Supabase:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audit-evidence');

-- Allow authenticated users to read files
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'audit-evidence');

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audit-evidence');
```

## Features

### Backend Features
- **File Upload**: Single and multiple file uploads via `/audits/{audit_id}/evidence/upload`
- **File Validation**: Size limits (50MB) and MIME type checking
- **Integrity Checking**: SHA-256 hash calculation for each file
- **Metadata Tracking**: File size, MIME type, upload timestamp
- **Evidence Linking**: Link evidence to checklist items and findings
- **File Management**: Download and delete operations

### Frontend Features
- **Drag & Drop**: Easy file selection interface
- **Upload Progress**: Real-time upload status indicators
- **Evidence List**: View all uploaded evidence with metadata
- **File Preview**: Direct links to view files in Supabase Storage
- **Delete Confirmation**: Safe deletion with confirmation dialog

## API Endpoints

### Upload Single File
```http
POST /audits/{audit_id}/evidence/upload
Content-Type: multipart/form-data

Parameters:
- file: File (required)
- description: string (optional)
- evidence_type: string (optional, default: "document")
- evidence_category: string (optional)
- linked_checklist_id: UUID (optional)
- linked_finding_id: UUID (optional)
```

### Upload Multiple Files
```http
POST /audits/{audit_id}/evidence/upload-multiple
Content-Type: multipart/form-data

Parameters:
- files: File[] (required, max 10 files)
- description: string (optional)
- evidence_type: string (optional)
```

### List Evidence
```http
GET /audits/{audit_id}/evidence
```

### Delete Evidence
```http
DELETE /audits/{audit_id}/evidence/{evidence_id}
```

### Download Evidence
```http
GET /audits/{audit_id}/evidence/{evidence_id}/download
```

## File Organization

Files are organized in Supabase Storage with the following structure:
```
audit-evidence/
  └── audits/
      └── {audit_id}/
          └── {timestamp}_{filename}
```

Example: `audits/123e4567-e89b-12d3-a456-426614174000/20231215_143022_audit_report.pdf`

## Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **File Validation**: Only allowed file types can be uploaded
3. **Size Limits**: Maximum 50MB per file
4. **Integrity Checking**: SHA-256 hash stored for each file
5. **Access Control**: Role-based access (Audit Manager, Auditor)

## ISO 19011 Compliance

This implementation follows ISO 19011 Clause 6.4.5 requirements:
- Evidence collection with integrity checking
- Chain of custody tracking
- Metadata preservation
- Secure storage and retrieval
- Audit trail of all operations

## Testing

### Test File Upload
```bash
curl -X POST "http://localhost:8000/audits/{audit_id}/evidence/upload" \
  -H "Authorization: Bearer {token}" \
  -F "file=@test_document.pdf" \
  -F "description=Test evidence" \
  -F "evidence_type=document"
```

### Test File List
```bash
curl -X GET "http://localhost:8000/audits/{audit_id}/evidence" \
  -H "Authorization: Bearer {token}"
```

## Troubleshooting

### Issue: "Failed to upload file"
- Check Supabase credentials in `.env`
- Verify bucket name is correct
- Ensure bucket exists and is public

### Issue: "File type not allowed"
- Check the file MIME type
- Update allowed types in `backend/app/routers/evidence.py`

### Issue: "File size exceeds limit"
- Default limit is 50MB
- Adjust `max_size` in the upload endpoint if needed

## Dependencies

Backend:
- `supabase-py`: Python client for Supabase
- `python-multipart`: For handling file uploads in FastAPI

Frontend:
- `@tanstack/react-query`: For data fetching and caching
- Native File API for file handling

## Next Steps

1. ✅ Backend service created
2. ✅ Upload endpoints implemented
3. ✅ Frontend UI updated
4. ✅ Configuration added
5. 🔄 Test the integration
6. 🔄 Deploy to production

## Support

For issues or questions:
- Check Supabase Dashboard for storage logs
- Review backend logs for upload errors
- Verify network connectivity to Supabase
