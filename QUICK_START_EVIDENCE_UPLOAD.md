# Quick Start: Evidence Upload with Supabase

## 🚀 5-Minute Setup

### Step 1: Supabase Bucket Setup (2 minutes)
1. Go to https://supabase.com/dashboard/project/jyvstpksqrdifxpgywvd
2. Click **Storage** in left sidebar
3. Click **New bucket**
4. Name: `audit-evidence`
5. Make it **Public**
6. Click **Create bucket**

### Step 2: Verify Backend Config (30 seconds)
Check `backend/.env` has:
```env
SUPABASE_URL=https://jyvstpksqrdifxpgywvd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dnN0cGtzcXJkaWZ4cGd5d3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDIyMjIsImV4cCI6MjA3OTIxODIyMn0._aQ4tH7hRemWTthvKtbmI3MdU_72gqwKxBYjVByKT1o
SUPABASE_BUCKET_NAME=audit-evidence
```

### Step 3: Test Connection (1 minute)
```bash
cd backend
python test_supabase_connection.py
```

Expected output:
```
✓ Connection successful!
✓ Upload successful!
✓ Deletion successful!
All tests passed! ✓
```

### Step 4: Start Services (1 minute)
```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 5: Test Upload (30 seconds)
1. Open http://localhost:3000
2. Login
3. Go to any audit
4. Click **Evidence** tab
5. Click **Select Files**
6. Choose a file
7. Click **Upload to Supabase**
8. ✅ File appears in the list!

## 📋 What You Get

### Backend
- ✅ File upload to Supabase S3
- ✅ SHA-256 integrity checking
- ✅ Metadata tracking
- ✅ Secure storage

### Frontend
- ✅ Drag & drop interface
- ✅ Upload progress
- ✅ File preview
- ✅ Delete files

## 🔧 Troubleshooting

### "Connection failed"
→ Check bucket name is exactly `audit-evidence`
→ Verify bucket is public

### "Upload failed"
→ Check file size < 50MB
→ Verify file type is allowed

### "Import error: supabase"
→ Run: `pip install supabase`

## 📁 Allowed File Types
- PDF (`.pdf`)
- Word (`.doc`, `.docx`)
- Excel (`.xls`, `.xlsx`)
- Images (`.jpg`, `.jpeg`, `.png`, `.gif`)
- Text (`.txt`, `.csv`)

## 🎯 Quick Test

```bash
# Test with curl
curl -X POST "http://localhost:8000/audits/{audit_id}/evidence/upload" \
  -H "Authorization: Bearer {your_token}" \
  -F "file=@test.pdf" \
  -F "description=Test file" \
  -F "evidence_type=document"
```

## ✅ Success Checklist
- [ ] Bucket created in Supabase
- [ ] Test script passes
- [ ] Backend starts without errors
- [ ] Frontend loads evidence page
- [ ] Can upload files
- [ ] Files appear in list
- [ ] Can view files
- [ ] Can delete files

## 🆘 Need Help?
1. Check `SUPABASE_STORAGE_SETUP.md` for detailed setup
2. Check `EVIDENCE_UPLOAD_IMPLEMENTATION.md` for technical details
3. Run test script: `python backend/test_supabase_connection.py`
4. Check Supabase Dashboard → Storage → audit-evidence

## 🎉 You're Done!
Your evidence upload system is ready to use with Supabase Storage!
