# Evidence Upload Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (Next.js Frontend)                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Evidence Upload Page                                     │  │
│  │  /audits/[id]/evidence                                    │  │
│  │                                                           │  │
│  │  ┌─────────────────┐    ┌──────────────────────────┐    │  │
│  │  │  Upload Section │    │  Evidence List Section   │    │  │
│  │  │                 │    │                          │    │  │
│  │  │  • Select Files │    │  • View Files            │    │  │
│  │  │  • Description  │    │  • Download Links        │    │  │
│  │  │  • Type Select  │    │  • Delete Files          │    │  │
│  │  │  • Upload Btn   │    │  • File Metadata         │    │  │
│  │  └─────────────────┘    └──────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP POST (multipart/form-data)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API                                │
│                   (FastAPI Python)                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Evidence Router                                          │  │
│  │  /audits/{audit_id}/evidence/upload                       │  │
│  │                                                           │  │
│  │  1. Validate file (type, size)                           │  │
│  │  2. Read file content                                     │  │
│  │  3. Call Supabase Storage Service                        │  │
│  │  4. Create database record                                │  │
│  │  5. Return response                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Supabase Storage Service                                 │  │
│  │                                                           │  │
│  │  • Calculate SHA-256 hash                                 │  │
│  │  • Generate unique file path                              │  │
│  │  • Upload to Supabase                                     │  │
│  │  • Get public URL                                         │  │
│  │  • Return metadata                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Supabase Client API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE STORAGE                             │
│                      (S3 Bucket)                                │
│                                                                 │
│  Bucket: audit-evidence                                         │
│                                                                 │
│  audits/                                                        │
│  └── {audit_id}/                                                │
│      ├── 20231215_143022_document1.pdf                          │
│      ├── 20231215_143045_image1.jpg                             │
│      └── 20231215_143102_spreadsheet1.xlsx                      │
│                                                                 │
│  Features:                                                      │
│  • Public access                                                │
│  • 50MB file limit                                              │
│  • CDN delivery                                                 │
│  • Automatic backups                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Store metadata
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL DATABASE                          │
│                                                                 │
│  Table: audit_evidence                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ id                  UUID                                  │  │
│  │ audit_id            UUID                                  │  │
│  │ file_name           VARCHAR                               │  │
│  │ file_url            VARCHAR (Supabase URL)                │  │
│  │ file_hash           VARCHAR (SHA-256)                     │  │
│  │ file_size           INTEGER                               │  │
│  │ mime_type           VARCHAR                               │  │
│  │ description         TEXT                                  │  │
│  │ evidence_type       VARCHAR                               │  │
│  │ uploaded_by_id      UUID                                  │  │
│  │ created_at          TIMESTAMP                             │  │
│  │ linked_checklist_id UUID                                  │  │
│  │ linked_finding_id   UUID                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Upload Flow Sequence

```
User                Frontend              Backend API           Supabase Service      Supabase Storage      Database
 │                     │                      │                       │                      │                │
 │  Select File        │                      │                       │                      │                │
 ├────────────────────>│                      │                       │                      │                │
 │                     │                      │                       │                      │                │
 │  Click Upload       │                      │                       │                      │                │
 ├────────────────────>│                      │                       │                      │                │
 │                     │                      │                       │                      │                │
 │                     │  POST /evidence/upload                       │                      │                │
 │                     ├─────────────────────>│                       │                      │                │
 │                     │                      │                       │                      │                │
 │                     │                      │  Validate File        │                      │                │
 │                     │                      ├──────────────┐        │                      │                │
 │                     │                      │              │        │                      │                │
 │                     │                      │<─────────────┘        │                      │                │
 │                     │                      │                       │                      │                │
 │                     │                      │  upload_file()        │                      │                │
 │                     │                      ├──────────────────────>│                      │                │
 │                     │                      │                       │                      │                │
 │                     │                      │                       │  Calculate Hash      │                │
 │                     │                      │                       ├─────────────┐        │                │
 │                     │                      │                       │             │        │                │
 │                     │                      │                       │<────────────┘        │                │
 │                     │                      │                       │                      │                │
 │                     │                      │                       │  Upload File         │                │
 │                     │                      │                       ├─────────────────────>│                │
 │                     │                      │                       │                      │                │
 │                     │                      │                       │  File Stored         │                │
 │                     │                      │                       │<─────────────────────┤                │
 │                     │                      │                       │                      │                │
 │                     │                      │                       │  Get Public URL      │                │
 │                     │                      │                       ├─────────────────────>│                │
 │                     │                      │                       │                      │                │
 │                     │                      │                       │  Return URL          │                │
 │                     │                      │                       │<─────────────────────┤                │
 │                     │                      │                       │                      │                │
 │                     │                      │  Return Metadata      │                      │                │
 │                     │                      │<──────────────────────┤                      │                │
 │                     │                      │                       │                      │                │
 │                     │                      │  Save to Database     │                      │                │
 │                     │                      ├──────────────────────────────────────────────────────────────>│
 │                     │                      │                       │                      │                │
 │                     │                      │  Record Saved         │                      │                │
 │                     │                      │<──────────────────────────────────────────────────────────────┤
 │                     │                      │                       │                      │                │
 │                     │  Success Response    │                       │                      │                │
 │                     │<─────────────────────┤                       │                      │                │
 │                     │                      │                       │                      │                │
 │  Upload Complete    │                      │                       │                      │                │
 │<────────────────────┤                      │                       │                      │                │
 │                     │                      │                       │                      │                │
 │  View File          │                      │                       │                      │                │
 ├────────────────────>│                      │                       │                      │                │
 │                     │                      │                       │                      │                │
 │                     │  Open Supabase URL   │                       │                      │                │
 │                     ├──────────────────────────────────────────────────────────────────────────────────────>│
 │                     │                      │                       │                      │                │
```

## Data Flow

### 1. Upload Request
```javascript
FormData {
  file: File,
  description: "Audit evidence document",
  evidence_type: "document"
}
```

### 2. Backend Processing
```python
{
  "file_content": bytes,
  "file_name": "document.pdf",
  "audit_id": "uuid",
  "user_id": "uuid",
  "content_type": "application/pdf"
}
```

### 3. Supabase Storage
```python
{
  "file_path": "audits/uuid/20231215_143022_document.pdf",
  "file_hash": "sha256_hash",
  "file_size": 1024000,
  "mime_type": "application/pdf"
}
```

### 4. Database Record
```sql
INSERT INTO audit_evidence (
  id, audit_id, file_name, file_url,
  file_hash, file_size, mime_type,
  description, evidence_type, uploaded_by_id
) VALUES (...)
```

### 5. Response to Frontend
```json
{
  "id": "uuid",
  "audit_id": "uuid",
  "file_name": "document.pdf",
  "file_url": "https://...supabase.co/.../document.pdf",
  "file_hash": "sha256_hash",
  "file_size": 1024000,
  "mime_type": "application/pdf",
  "description": "Audit evidence document",
  "evidence_type": "document",
  "created_at": "2023-12-15T14:30:22Z"
}
```

## Security Layers

```
┌─────────────────────────────────────────┐
│  Layer 1: Authentication                │
│  • JWT token required                   │
│  • User must be logged in               │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Layer 2: Authorization                 │
│  • Role check (Auditor/Manager)         │
│  • Audit access verification            │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Layer 3: File Validation               │
│  • Type check (MIME type)               │
│  • Size check (max 50MB)                │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Layer 4: Integrity Check               │
│  • SHA-256 hash calculation             │
│  • Hash stored in database              │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Layer 5: Secure Storage                │
│  • Supabase S3 bucket                   │
│  • Encrypted at rest                    │
│  • CDN delivery                         │
└─────────────────────────────────────────┘
```

## File Organization

```
Supabase Storage Bucket: audit-evidence
│
├── audits/
│   ├── audit-uuid-1/
│   │   ├── 20231215_143022_policy_document.pdf
│   │   ├── 20231215_143045_compliance_photo.jpg
│   │   └── 20231215_143102_audit_checklist.xlsx
│   │
│   ├── audit-uuid-2/
│   │   ├── 20231216_091530_interview_notes.docx
│   │   └── 20231216_092015_observation_photo.png
│   │
│   └── audit-uuid-3/
│       └── 20231217_103045_evidence_report.pdf
│
└── test-connection/
    └── test_connection.txt (for testing)
```

## Error Handling Flow

```
Upload Request
      │
      ▼
┌─────────────┐
│ File Valid? │──No──> Return 400: Invalid file type/size
└─────────────┘
      │ Yes
      ▼
┌─────────────┐
│ Auth Valid? │──No──> Return 401: Unauthorized
└─────────────┘
      │ Yes
      ▼
┌─────────────┐
│Upload Works?│──No──> Return 500: Upload failed
└─────────────┘
      │ Yes
      ▼
┌─────────────┐
│ DB Insert?  │──No──> Return 500: Database error
└─────────────┘
      │ Yes
      ▼
  Success 200
```

## Performance Considerations

- **File Size**: Max 50MB per file
- **Concurrent Uploads**: Max 10 files at once
- **Storage**: Unlimited (Supabase plan dependent)
- **CDN**: Automatic via Supabase
- **Caching**: React Query caches evidence list
- **Bandwidth**: Optimized with compression

## Monitoring Points

1. **Upload Success Rate**: Track successful vs failed uploads
2. **File Sizes**: Monitor average and max file sizes
3. **Storage Usage**: Track total storage consumption
4. **Response Times**: Monitor upload duration
5. **Error Rates**: Track validation and upload errors
6. **User Activity**: Track uploads per user/audit
