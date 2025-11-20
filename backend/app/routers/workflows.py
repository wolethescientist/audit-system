from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.auth import get_current_user
from app.models import (
    User, Workflow, WorkflowStep, WorkflowApproval, 
    WorkflowStatus, ApprovalAction, Audit
)
from app.schemas import (
    WorkflowCreate, WorkflowResponse, WorkflowDetailResponse,
    WorkflowStepResponse, ApprovalCreate, ApprovalResponse
)

router = APIRouter(prefix="/workflows", tags=["workflows"])

@router.post("/", response_model=WorkflowResponse)
def create_workflow(
    workflow_data: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new workflow with multiple department steps"""
    
    # Verify audit exists
    audit = db.query(Audit).filter(Audit.id == workflow_data.audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Create workflow
    workflow = Workflow(
        audit_id=workflow_data.audit_id,
        name=workflow_data.name,
        description=workflow_data.description,
        created_by_id=current_user.id,
        status=WorkflowStatus.PENDING,
        current_step=0
    )
    db.add(workflow)
    db.flush()
    
    # Create workflow steps
    for step_data in workflow_data.steps:
        step = WorkflowStep(
            workflow_id=workflow.id,
            step_order=step_data.step_order,
            department_id=step_data.department_id,
            assigned_to_id=step_data.assigned_to_id,
            action_required=step_data.action_required,
            due_date=step_data.due_date,
            status=WorkflowStatus.PENDING
        )
        db.add(step)
    
    db.commit()
    db.refresh(workflow)
    
    return workflow

@router.get("/", response_model=List[WorkflowResponse])
def list_workflows(
    audit_id: UUID = None,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all workflows with optional filters"""
    query = db.query(Workflow)
    
    if audit_id:
        query = query.filter(Workflow.audit_id == audit_id)
    
    if status:
        query = query.filter(Workflow.status == status)
    
    workflows = query.order_by(Workflow.created_at.desc()).all()
    return workflows

@router.get("/{workflow_id}", response_model=WorkflowDetailResponse)
def get_workflow(
    workflow_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get workflow details with all steps"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return workflow

@router.post("/{workflow_id}/start")
def start_workflow(
    workflow_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start the workflow - activates first step"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    if workflow.status != WorkflowStatus.PENDING:
        raise HTTPException(status_code=400, detail="Workflow already started")
    
    # Update workflow status
    workflow.status = WorkflowStatus.IN_PROGRESS
    workflow.current_step = 1
    
    # Activate first step
    first_step = db.query(WorkflowStep).filter(
        WorkflowStep.workflow_id == workflow_id,
        WorkflowStep.step_order == 1
    ).first()
    
    if first_step:
        first_step.status = WorkflowStatus.IN_PROGRESS
        first_step.started_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Workflow started", "current_step": 1}

@router.get("/{workflow_id}/steps", response_model=List[WorkflowStepResponse])
def get_workflow_steps(
    workflow_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all steps for a workflow"""
    steps = db.query(WorkflowStep).filter(
        WorkflowStep.workflow_id == workflow_id
    ).order_by(WorkflowStep.step_order).all()
    
    return steps

@router.post("/{workflow_id}/steps/{step_id}/approve", response_model=ApprovalResponse)
def approve_workflow_step(
    workflow_id: UUID,
    step_id: UUID,
    approval_data: ApprovalCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve, reject, or sign a workflow step"""
    
    # Get workflow and step
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    step = db.query(WorkflowStep).filter(WorkflowStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Workflow step not found")
    
    # Verify step is in progress
    if step.status != WorkflowStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Step is not active")
    
    # Verify user has permission (assigned user or department member)
    if step.assigned_to_id and step.assigned_to_id != current_user.id:
        if current_user.department_id != step.department_id:
            raise HTTPException(status_code=403, detail="Not authorized to approve this step")
    
    # Create approval record
    approval = WorkflowApproval(
        workflow_step_id=step_id,
        user_id=current_user.id,
        action=ApprovalAction(approval_data.action),
        comments=approval_data.comments,
        signature_data=approval_data.signature_data,
        ip_address=request.client.host if request.client else None
    )
    db.add(approval)
    
    # Update step status
    if approval_data.action == "approved" or approval_data.action == "signed":
        step.status = WorkflowStatus.APPROVED
        step.completed_at = datetime.utcnow()
        
        # Move to next step
        next_step = db.query(WorkflowStep).filter(
            WorkflowStep.workflow_id == workflow_id,
            WorkflowStep.step_order == step.step_order + 1
        ).first()
        
        if next_step:
            # Activate next step
            next_step.status = WorkflowStatus.IN_PROGRESS
            next_step.started_at = datetime.utcnow()
            workflow.current_step = next_step.step_order
        else:
            # No more steps - complete workflow
            workflow.status = WorkflowStatus.COMPLETED
            workflow.completed_at = datetime.utcnow()
    
    elif approval_data.action == "rejected":
        step.status = WorkflowStatus.REJECTED
        step.completed_at = datetime.utcnow()
        workflow.status = WorkflowStatus.REJECTED
    
    db.commit()
    db.refresh(approval)
    
    return approval

@router.get("/{workflow_id}/steps/{step_id}/approvals", response_model=List[ApprovalResponse])
def get_step_approvals(
    workflow_id: UUID,
    step_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all approvals for a workflow step"""
    approvals = db.query(WorkflowApproval).filter(
        WorkflowApproval.workflow_step_id == step_id
    ).order_by(WorkflowApproval.created_at).all()
    
    return approvals

@router.get("/my-pending", response_model=List[WorkflowDetailResponse])
def get_my_pending_workflows(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get workflows pending my approval"""
    
    # Find steps assigned to me or my department that are in progress
    pending_steps = db.query(WorkflowStep).filter(
        WorkflowStep.status == WorkflowStatus.IN_PROGRESS
    ).filter(
        (WorkflowStep.assigned_to_id == current_user.id) |
        (WorkflowStep.department_id == current_user.department_id)
    ).all()
    
    # Get unique workflows
    workflow_ids = list(set([step.workflow_id for step in pending_steps]))
    workflows = db.query(Workflow).filter(Workflow.id.in_(workflow_ids)).all()
    
    return workflows
