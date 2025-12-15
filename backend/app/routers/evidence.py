"""
Evidence Upload Router with Supabase Storage Integration
ISO 19011 Clause 6.4.5 - Evidence Collection and Management
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.models import Audit, User, AuditEvidence, UserRole
from app.schemas import EvidenceResponse
from app.auth import get_current_user, require_roles
from app.services.supabase_storage_service import supabase_storage

router = APIRouter(prefix="/audits", tags=["Evidence"])

@router.post("/{audit_id}/evidence/upload", response_model=EvidenceResponse)
async def upload_evidence_file(
    audit_id: UUID,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    evidence_type: Optional[str] = Form("document"),
    evidence_category: Optional[str] = Form(None),
    linked_checklist_id: Optional[str] = Form(None),
    linked_finding_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload evidence file to Supabase Storage
    ISO 19011 Clause 6.4.5 - Evidence collection with integrity checking
    """
    # Verify audit exists
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Validate file size (max 50MB)
    max_size = 50 * 1024 * 1024  # 50MB
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(status_code=400, detail="File size exceeds 50MB limit")
    
    # Validate file type
    allowed_types = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
        "image/gif",
        "text/plain",
        "text/csv"
    ]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file.content_type} not allowed. Allowed types: PDF, Word, Excel, Images, Text"
        )
    
    # Upload to Supabase Storage
    upload_result = supabase_storage.upload_file(
        file_content=file_content,
        file_name=file.filename,
        audit_id=str(audit_id),
        user_id=str(current_user.id),
        content_type=file.content_type
    )
    
    if not upload_result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file: {upload_result.get('error')}"
        )
    
    # Create evidence record in database
    evidence = AuditEvidence(
        audit_id=audit_id,
        file_name=file.filename,
        file_url=upload_result["file_url"],
        uploaded_by_id=current_user.id,
        description=description,
        evidence_type=evidence_type,
        file_hash=upload_result["file_hash"],
        file_size=upload_result["file_size"],
        mime_type=upload_result["mime_type"],
        linked_checklist_id=UUID(linked_checklist_id) if linked_checklist_id else None,
        linked_finding_id=UUID(linked_finding_id) if linked_finding_id else None
    )
    
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    
    return evidence

@router.post("/{audit_id}/evidence/upload-multiple")
async def upload_multiple_evidence_files(
    audit_id: UUID,
    files: List[UploadFile] = File(...),
    description: Optional[str] = Form(None),
    evidence_type: Optional[str] = Form("document"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload multiple evidence files at once
    """
    # Verify audit exists
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files per upload")
    
    uploaded_evidence = []
    errors = []
    
    for file in files:
        try:
            # Read file content
            file_content = await file.read()
            
            # Validate file size
            max_size = 50 * 1024 * 1024
            if len(file_content) > max_size:
                errors.append(f"{file.filename}: File size exceeds 50MB")
                continue
            
            # Upload to Supabase
            upload_result = supabase_storage.upload_file(
                file_content=file_content,
                file_name=file.filename,
                audit_id=str(audit_id),
                user_id=str(current_user.id),
                content_type=file.content_type
            )
            
            if not upload_result.get("success"):
                errors.append(f"{file.filename}: {upload_result.get('error')}")
                continue
            
            # Create evidence record
            evidence = AuditEvidence(
                audit_id=audit_id,
                file_name=file.filename,
                file_url=upload_result["file_url"],
                uploaded_by_id=current_user.id,
                description=description,
                evidence_type=evidence_type,
                file_hash=upload_result["file_hash"],
                file_size=upload_result["file_size"],
                mime_type=upload_result["mime_type"]
            )
            
            db.add(evidence)
            uploaded_evidence.append(evidence)
        
        except Exception as e:
            errors.append(f"{file.filename}: {str(e)}")
    
    db.commit()
    
    return {
        "success": True,
        "uploaded_count": len(uploaded_evidence),
        "total_files": len(files),
        "evidence": uploaded_evidence,
        "errors": errors if errors else None
    }

@router.get("/{audit_id}/evidence", response_model=List[EvidenceResponse])
def list_evidence(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all evidence for an audit
    """
    try:
        evidence_list = db.query(AuditEvidence).filter(
            AuditEvidence.audit_id == audit_id
        ).order_by(AuditEvidence.created_at.desc()).all()
        
        return evidence_list
    except Exception as e:
        import traceback
        print(f"ERROR in list_evidence: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list evidence: {str(e)}"
        )

@router.delete("/{audit_id}/evidence/{evidence_id}")
def delete_evidence(
    audit_id: UUID,
    evidence_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    """
    Delete evidence file and record
    """
    evidence = db.query(AuditEvidence).filter(
        AuditEvidence.id == evidence_id,
        AuditEvidence.audit_id == audit_id
    ).first()
    
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    # Extract file path from URL
    # URL format: https://...supabase.co/storage/v1/object/public/bucket-name/path
    file_path = evidence.file_url.split(f"/{supabase_storage.bucket_name}/")[-1]
    
    # Delete from Supabase Storage
    supabase_storage.delete_file(file_path)
    
    # Delete from database
    db.delete(evidence)
    db.commit()
    
    return {"success": True, "message": "Evidence deleted successfully"}

@router.get("/{audit_id}/evidence/{evidence_id}/download")
def download_evidence(
    audit_id: UUID,
    evidence_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get download URL for evidence file
    """
    evidence = db.query(AuditEvidence).filter(
        AuditEvidence.id == evidence_id,
        AuditEvidence.audit_id == audit_id
    ).first()
    
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    return {
        "file_name": evidence.file_name,
        "file_url": evidence.file_url,
        "file_size": evidence.file_size,
        "mime_type": evidence.mime_type
    }
