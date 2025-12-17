from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc, func
from typing import List, Optional
from datetime import datetime, timedelta
import hashlib
import os
import uuid
import mimetypes
from pathlib import Path

from app.database import get_db
from app.auth import get_current_user
from app.models import (
    DocumentRepository, DocumentTag, User, Department, 
    DocumentStatus, SystemAuditLog
)
from app.schemas import (
    DocumentUpload, DocumentApproval, DocumentResponse, 
    DocumentDetailResponse, DocumentSearchRequest, DocumentSearchResponse,
    DocumentExpiringResponse, DocumentTagCreate, DocumentTagResponse,
    UserResponse
)
from app.services.supabase_storage_service import supabase_storage

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])

# File storage configuration
UPLOAD_DIR = Path("uploads/documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "image/jpeg",
    "image/png",
    "image/gif"
]

def generate_document_number() -> str:
    """Generate unique document number following ISO 9001 requirements."""
    timestamp = datetime.now().strftime("%Y%m%d")
    random_suffix = str(uuid.uuid4())[:8].upper()
    return f"DOC-{timestamp}-{random_suffix}"

def calculate_file_hash(file_path: str) -> str:
    """Calculate SHA-256 hash for file integrity checking."""
    hash_sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_sha256.update(chunk)
    return hash_sha256.hexdigest()

def virus_scan_file(file_path: str) -> bool:
    """
    Placeholder for virus scanning functionality.
    In production, integrate with antivirus solution like ClamAV.
    """
    # TODO: Implement actual virus scanning
    # For now, just check file size and type
    file_size = os.path.getsize(file_path)
    if file_size > MAX_FILE_SIZE:
        return False
    return True

def log_document_action(
    db: Session, 
    user_id: uuid.UUID, 
    action_type: str, 
    document_id: uuid.UUID,
    before_values: dict = None,
    after_values: dict = None
):
    """Log document control actions for ISO 27001 compliance."""
    audit_log = SystemAuditLog(
        user_id=user_id,
        action_type=action_type,
        resource_type="document",
        resource_id=str(document_id),
        table_name="document_repository",
        before_values=before_values,
        after_values=after_values,
        business_context="Document Control System",
        security_event=action_type in ["DELETE", "APPROVE", "REJECT"]
    )
    db.add(audit_log)
    db.commit()

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    document_name: str = Form(...),
    document_type: str = Form(...),
    category: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    keywords: Optional[str] = Form(None),
    department_id: Optional[str] = Form(None),
    confidentiality_level: str = Form("internal"),
    review_frequency_months: int = Form(12),
    is_controlled: bool = Form(True),
    effective_date: Optional[str] = Form(None),
    expiry_date: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Upload document to Supabase Storage with integrity checking.
    Implements ISO 9001 Clause 7.5.3 document control requirements.
    """
    # Validate file type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"File type {file.content_type} not allowed"
        )
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Validate file size
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE} bytes"
        )
    
    # Generate document number
    document_number = generate_document_number()
    
    try:
        # Upload to Supabase Storage
        upload_result = supabase_storage.upload_file(
            file_content=file_content,
            file_name=file.filename,
            audit_id=f"documents/{document_number}",  # Use documents folder
            user_id=str(current_user.id),
            content_type=file.content_type
        )
        
        if not upload_result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload to storage: {upload_result.get('error', 'Unknown error')}"
            )
        
        # Parse dates
        effective_dt = None
        expiry_dt = None
        if effective_date:
            try:
                effective_dt = datetime.fromisoformat(effective_date.replace('Z', '+00:00'))
            except ValueError:
                # Try parsing as date only (YYYY-MM-DD)
                try:
                    effective_dt = datetime.strptime(effective_date, "%Y-%m-%d")
                except ValueError:
                    pass
        if expiry_date:
            try:
                expiry_dt = datetime.fromisoformat(expiry_date.replace('Z', '+00:00'))
            except ValueError:
                # Try parsing as date only (YYYY-MM-DD)
                try:
                    expiry_dt = datetime.strptime(expiry_date, "%Y-%m-%d")
                except ValueError:
                    pass
        
        # Calculate next review date
        next_review_dt = None
        if effective_dt:
            next_review_dt = effective_dt + timedelta(days=review_frequency_months * 30)
        
        # Parse department_id
        dept_id = None
        if department_id and department_id.strip():
            try:
                dept_id = uuid.UUID(department_id)
            except ValueError:
                pass
        
        # Create document record
        document = DocumentRepository(
            document_number=document_number,
            document_name=document_name,
            document_type=document_type,
            category=category,
            version="1.0",
            file_url=upload_result["file_url"],
            file_name=file.filename,
            file_hash=upload_result["file_hash"],
            file_size=file_size,
            mime_type=file.content_type,
            approval_status=DocumentStatus.DRAFT,
            effective_date=effective_dt,
            expiry_date=expiry_dt,
            review_frequency_months=review_frequency_months,
            next_review_date=next_review_dt,
            uploaded_by_id=current_user.id,
            department_id=dept_id,
            confidentiality_level=confidentiality_level,
            is_controlled=is_controlled,
            description=description,
            keywords=keywords
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        # Log the action
        log_document_action(
            db, current_user.id, "CREATE", document.id,
            after_values={
                "document_number": document_number,
                "document_name": document_name,
                "document_type": document_type,
                "storage": "supabase"
            }
        )
        
        return document
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")

@router.put("/{doc_id}/approve", response_model=DocumentResponse)
def approve_document(
    doc_id: uuid.UUID,
    approval_data: DocumentApproval,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Approve document following ISO 9001 approval workflow requirements.
    Implements digital signature support and approval tracking.
    """
    # Get document
    document = db.query(DocumentRepository).filter(
        DocumentRepository.id == doc_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check permissions (only managers and above can approve)
    if current_user.role not in ["audit_manager", "system_admin"]:
        raise HTTPException(
            status_code=403, 
            detail="Insufficient permissions to approve documents"
        )
    
    # Store before values for audit trail
    before_values = {
        "approval_status": document.approval_status.value,
        "approved_by_id": str(document.approved_by_id) if document.approved_by_id else None
    }
    
    # Update document based on approval action
    if approval_data.action == "approve":
        document.approval_status = DocumentStatus.APPROVED
        document.approved_by_id = current_user.id
        
        # Set effective date if provided
        if approval_data.effective_date:
            document.effective_date = approval_data.effective_date
        elif not document.effective_date:
            document.effective_date = datetime.utcnow()
        
        # Set expiry date if provided
        if approval_data.expiry_date:
            document.expiry_date = approval_data.expiry_date
        
        # Calculate next review date
        if document.effective_date and document.review_frequency_months:
            document.next_review_date = document.effective_date + timedelta(
                days=document.review_frequency_months * 30
            )
        
        # Update change history
        change_record = {
            "action": "approved",
            "user_id": str(current_user.id),
            "user_name": current_user.full_name,
            "timestamp": datetime.utcnow().isoformat(),
            "comments": approval_data.comments,
            "version": document.version
        }
        
        if document.change_history:
            document.change_history.append(change_record)
        else:
            document.change_history = [change_record]
            
    elif approval_data.action == "reject":
        document.approval_status = DocumentStatus.REJECTED
        document.reviewed_by_id = current_user.id
        
        # Add rejection to change history
        change_record = {
            "action": "rejected",
            "user_id": str(current_user.id),
            "user_name": current_user.full_name,
            "timestamp": datetime.utcnow().isoformat(),
            "comments": approval_data.comments,
            "version": document.version
        }
        
        if document.change_history:
            document.change_history.append(change_record)
        else:
            document.change_history = [change_record]
            
    elif approval_data.action == "request_changes":
        document.approval_status = DocumentStatus.UNDER_REVIEW
        document.reviewed_by_id = current_user.id
        
        # Add review request to change history
        change_record = {
            "action": "changes_requested",
            "user_id": str(current_user.id),
            "user_name": current_user.full_name,
            "timestamp": datetime.utcnow().isoformat(),
            "comments": approval_data.comments,
            "version": document.version
        }
        
        if document.change_history:
            document.change_history.append(change_record)
        else:
            document.change_history = [change_record]
    else:
        raise HTTPException(status_code=400, detail="Invalid approval action")
    
    document.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(document)
    
    # Log the approval action
    after_values = {
        "approval_status": document.approval_status.value,
        "approved_by_id": str(document.approved_by_id) if document.approved_by_id else None
    }
    
    log_document_action(
        db, current_user.id, "APPROVE", document.id,
        before_values=before_values,
        after_values=after_values
    )
    
    return document

@router.get("/expiring", response_model=List[DocumentExpiringResponse])
def get_expiring_documents(
    days_ahead: int = Query(30, description="Number of days to look ahead for expiring documents"),
    include_overdue: bool = Query(True, description="Include already expired documents"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get documents expiring within specified timeframe for proactive management.
    Supports automated notifications per ISO 9001 requirements.
    """
    current_date = datetime.utcnow().date()
    future_date = current_date + timedelta(days=days_ahead)
    
    query = db.query(
        DocumentRepository,
        Department.name.label("department_name"),
        User.full_name.label("responsible_person")
    ).outerjoin(
        Department, DocumentRepository.department_id == Department.id
    ).outerjoin(
        User, DocumentRepository.uploaded_by_id == User.id
    ).filter(
        DocumentRepository.is_active == True,
        DocumentRepository.approval_status == DocumentStatus.APPROVED
    )
    
    # Filter by expiry date or review date
    if include_overdue:
        query = query.filter(
            or_(
                and_(
                    DocumentRepository.expiry_date.isnot(None),
                    DocumentRepository.expiry_date <= future_date
                ),
                and_(
                    DocumentRepository.next_review_date.isnot(None),
                    DocumentRepository.next_review_date <= future_date
                )
            )
        )
    else:
        query = query.filter(
            or_(
                and_(
                    DocumentRepository.expiry_date.isnot(None),
                    DocumentRepository.expiry_date.between(current_date, future_date)
                ),
                and_(
                    DocumentRepository.next_review_date.isnot(None),
                    DocumentRepository.next_review_date.between(current_date, future_date)
                )
            )
        )
    
    results = query.order_by(
        asc(DocumentRepository.expiry_date),
        asc(DocumentRepository.next_review_date)
    ).all()
    
    expiring_docs = []
    for doc, dept_name, responsible_person in results:
        # Determine which date to use (expiry or review)
        expiry_date = doc.expiry_date or doc.next_review_date
        if expiry_date:
            days_until_expiry = (expiry_date.date() - current_date).days
            
            expiring_docs.append(DocumentExpiringResponse(
                id=doc.id,
                document_number=doc.document_number,
                document_name=doc.document_name,
                document_type=doc.document_type,
                expiry_date=expiry_date,
                days_until_expiry=days_until_expiry,
                next_review_date=doc.next_review_date,
                responsible_person=responsible_person,
                department_name=dept_name
            ))
    
    return expiring_docs

@router.get("/search", response_model=DocumentSearchResponse)
def search_documents(
    query: Optional[str] = Query(None, description="Search query for document name, description, or keywords"),
    document_type: Optional[str] = Query(None, description="Filter by document type"),
    category: Optional[str] = Query(None, description="Filter by category"),
    department_id: Optional[uuid.UUID] = Query(None, description="Filter by department"),
    approval_status: Optional[DocumentStatus] = Query(None, description="Filter by approval status"),
    confidentiality_level: Optional[str] = Query(None, description="Filter by confidentiality level"),
    date_from: Optional[datetime] = Query(None, description="Filter documents created from this date"),
    date_to: Optional[datetime] = Query(None, description="Filter documents created until this date"),
    include_expired: bool = Query(False, description="Include expired documents"),
    limit: int = Query(50, description="Maximum number of results"),
    offset: int = Query(0, description="Number of results to skip"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Full-text search with filtering capabilities.
    Implements role-based access control per ISO 27001 requirements.
    """
    # Base query
    base_query = db.query(DocumentRepository).filter(
        DocumentRepository.is_active == True
    )
    
    # Apply role-based access control
    if current_user.role not in ["system_admin", "audit_manager"]:
        # Regular users can only see documents from their department or public documents
        base_query = base_query.filter(
            or_(
                DocumentRepository.department_id == current_user.department_id,
                DocumentRepository.confidentiality_level == "public",
                DocumentRepository.uploaded_by_id == current_user.id
            )
        )
    
    # Apply search filters
    if query:
        search_filter = or_(
            DocumentRepository.document_name.ilike(f"%{query}%"),
            DocumentRepository.description.ilike(f"%{query}%"),
            DocumentRepository.keywords.ilike(f"%{query}%")
        )
        base_query = base_query.filter(search_filter)
    
    if document_type:
        base_query = base_query.filter(DocumentRepository.document_type == document_type)
    
    if category:
        base_query = base_query.filter(DocumentRepository.category == category)
    
    if department_id:
        base_query = base_query.filter(DocumentRepository.department_id == department_id)
    
    if approval_status:
        base_query = base_query.filter(DocumentRepository.approval_status == approval_status)
    
    if confidentiality_level:
        base_query = base_query.filter(DocumentRepository.confidentiality_level == confidentiality_level)
    
    if date_from:
        base_query = base_query.filter(DocumentRepository.created_at >= date_from)
    
    if date_to:
        base_query = base_query.filter(DocumentRepository.created_at <= date_to)
    
    if not include_expired:
        current_date = datetime.utcnow()
        base_query = base_query.filter(
            or_(
                DocumentRepository.expiry_date.is_(None),
                DocumentRepository.expiry_date > current_date
            )
        )
    
    # Get total count
    total_count = base_query.count()
    
    # Apply pagination and ordering
    documents = base_query.order_by(
        desc(DocumentRepository.created_at)
    ).offset(offset).limit(limit).all()
    
    # Log search action
    log_document_action(
        db, current_user.id, "SEARCH", uuid.uuid4(),
        after_values={"search_query": query, "results_count": len(documents)}
    )
    
    return DocumentSearchResponse(
        documents=documents,
        total_count=total_count,
        has_more=(offset + len(documents)) < total_count
    )

@router.get("/{doc_id}", response_model=DocumentDetailResponse)
def get_document(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get document details with version history and access control."""
    document = db.query(DocumentRepository).filter(
        DocumentRepository.id == doc_id,
        DocumentRepository.is_active == True
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check access permissions
    if current_user.role not in ["system_admin", "audit_manager"]:
        if (document.department_id != current_user.department_id and 
            document.confidentiality_level not in ["public", "internal"] and
            document.uploaded_by_id != current_user.id):
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Get tags
    tags = db.query(DocumentTag).filter(DocumentTag.document_id == doc_id).all()
    tag_names = [tag.tag_name for tag in tags]
    
    # Log access
    log_document_action(
        db, current_user.id, "READ", document.id,
        after_values={"document_name": document.document_name}
    )
    
    # Build response manually to avoid SQLAlchemy internal attributes
    return DocumentDetailResponse(
        id=document.id,
        document_number=document.document_number,
        document_name=document.document_name,
        document_type=document.document_type,
        category=document.category,
        version=document.version,
        file_url=document.file_url,
        file_name=document.file_name,
        file_size=document.file_size,
        mime_type=document.mime_type,
        approval_status=document.approval_status,
        effective_date=document.effective_date,
        expiry_date=document.expiry_date,
        next_review_date=document.next_review_date,
        uploaded_by_id=document.uploaded_by_id,
        reviewed_by_id=document.reviewed_by_id,
        approved_by_id=document.approved_by_id,
        department_id=document.department_id,
        confidentiality_level=document.confidentiality_level,
        is_controlled=document.is_controlled,
        is_active=document.is_active,
        created_at=document.created_at,
        updated_at=document.updated_at,
        description=document.description,
        keywords=document.keywords,
        access_roles=document.access_roles if hasattr(document, 'access_roles') else None,
        change_history=document.change_history if hasattr(document, 'change_history') else None,
        supersedes_document_id=document.supersedes_document_id if hasattr(document, 'supersedes_document_id') else None,
        tags=tag_names
    )

@router.get("/{doc_id}/download")
def download_document(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Download document file with access control and audit logging."""
    document = db.query(DocumentRepository).filter(
        DocumentRepository.id == doc_id,
        DocumentRepository.is_active == True
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check access permissions
    if current_user.role not in ["system_admin", "audit_manager"]:
        if (document.department_id != current_user.department_id and 
            document.confidentiality_level not in ["public", "internal"] and
            document.uploaded_by_id != current_user.id):
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Log download
    log_document_action(
        db, current_user.id, "DOWNLOAD", document.id,
        after_values={"document_name": document.document_name, "file_name": document.file_name}
    )
    
    # Check if file is stored in Supabase (URL starts with http)
    if document.file_url.startswith("http"):
        # Return download info for Supabase-stored files
        return {
            "file_name": document.file_name,
            "file_url": document.file_url,
            "file_size": document.file_size,
            "mime_type": document.mime_type
        }
    
    # Legacy: Check if file exists on disk (for old local files)
    if not os.path.exists(document.file_url):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=document.file_url,
        filename=document.file_name,
        media_type=document.mime_type
    )

@router.post("/{doc_id}/tags", response_model=DocumentTagResponse)
def add_document_tag(
    doc_id: uuid.UUID,
    tag_data: DocumentTagCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Add tag to document for better categorization."""
    # Check if document exists
    document = db.query(DocumentRepository).filter(
        DocumentRepository.id == doc_id,
        DocumentRepository.is_active == True
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check if tag already exists
    existing_tag = db.query(DocumentTag).filter(
        DocumentTag.document_id == doc_id,
        DocumentTag.tag_name == tag_data.tag_name
    ).first()
    
    if existing_tag:
        raise HTTPException(status_code=400, detail="Tag already exists for this document")
    
    # Create new tag
    tag = DocumentTag(
        document_id=doc_id,
        tag_name=tag_data.tag_name
    )
    
    db.add(tag)
    db.commit()
    db.refresh(tag)
    
    return tag

@router.delete("/{doc_id}/tags/{tag_id}")
def remove_document_tag(
    doc_id: uuid.UUID,
    tag_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Remove tag from document."""
    tag = db.query(DocumentTag).filter(
        DocumentTag.id == tag_id,
        DocumentTag.document_id == doc_id
    ).first()
    
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    db.delete(tag)
    db.commit()
    
    return {"message": "Tag removed successfully"}

@router.delete("/{doc_id}")
def delete_document(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Soft delete document (archive) following ISO 9001 requirements.
    Only system admins can delete documents.
    """
    if current_user.role != "system_admin":
        raise HTTPException(
            status_code=403, 
            detail="Only system administrators can delete documents"
        )
    
    document = db.query(DocumentRepository).filter(
        DocumentRepository.id == doc_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Store before values for audit trail
    before_values = {
        "is_active": document.is_active,
        "document_name": document.document_name
    }
    
    # Soft delete (archive)
    document.is_active = False
    document.updated_at = datetime.utcnow()
    
    db.commit()
    
    # Log deletion
    log_document_action(
        db, current_user.id, "DELETE", document.id,
        before_values=before_values,
        after_values={"is_active": False}
    )
    
    return {"message": "Document archived successfully"}