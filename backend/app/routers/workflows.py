from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from uuid import UUID
from datetime import datetime
import random
import string

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

def generate_reference_number():
    """Generate a unique workflow reference number like WF-2024-XXXXX"""
    year = datetime.utcnow().year
    random_part = ''.join(random.choices(string.digits, k=5))
    return f"WF-{year}-{random_part}"

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
    
    # Generate unique reference number
    reference_number = generate_reference_number()
    while db.query(Workflow).filter(Workflow.reference_number == reference_number).first():
        reference_number = generate_reference_number()
    
    # Create workflow
    workflow = Workflow(
        reference_number=reference_number,
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
    """List workflows visible to current user (created by them or assigned to them in ANY step)"""
    
    # Build filter conditions
    filter_conditions = [WorkflowStep.assigned_to_id == current_user.id]
    if current_user.department_id:
        filter_conditions.append(WorkflowStep.department_id == current_user.department_id)
    
    # Get workflow IDs where user is assigned in ANY step (not just active ones)
    # This allows all assigned staff to see the workflow from the beginning
    assigned_workflow_ids = db.query(WorkflowStep.workflow_id).filter(
        or_(*filter_conditions)
    ).distinct().all()
    assigned_workflow_ids = [wf_id[0] for wf_id in assigned_workflow_ids]
    
    # Query workflows created by user or assigned to user in any step
    query = db.query(Workflow).filter(
        or_(
            Workflow.created_by_id == current_user.id,
            Workflow.id.in_(assigned_workflow_ids) if assigned_workflow_ids else False
        )
    )
    
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
    """Get workflow details with all steps - only if user has access"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Check if user has access (creator or assigned in any step)
    has_access = workflow.created_by_id == current_user.id
    if not has_access:
        # Build filter conditions
        filter_conditions = [
            WorkflowStep.workflow_id == workflow_id,
            WorkflowStep.assigned_to_id == current_user.id
        ]
        if current_user.department_id:
            filter_conditions.append(WorkflowStep.department_id == current_user.department_id)
        
        assigned_step = db.query(WorkflowStep).filter(
            or_(*filter_conditions)
        ).first()
        has_access = assigned_step is not None
    
    if not has_access:
        raise HTTPException(status_code=403, detail="You don't have access to this workflow")
    
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
    """Process workflow step action (approve, reject, sign, review, acknowledge)"""
    
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
            raise HTTPException(status_code=403, detail="Not authorized to act on this step")
    
    # Validate action matches step requirement
    action = approval_data.action
    if step.action_required == "review" and action not in ["reviewed", "rejected"]:
        raise HTTPException(status_code=400, detail="This step requires review action")
    if step.action_required == "acknowledge" and action not in ["acknowledged", "rejected"]:
        raise HTTPException(status_code=400, detail="This step requires acknowledge action")
    if step.action_required == "sign" and action not in ["signed", "rejected"]:
        raise HTTPException(status_code=400, detail="This step requires signature")
        
    # For sign action, require signature data
    if action == "signed" and not approval_data.signature_data:
        raise HTTPException(status_code=400, detail="Signature data is required for signing")
    
    # Create approval record
    approval = WorkflowApproval(
        workflow_step_id=step_id,
        user_id=current_user.id,
        action=ApprovalAction(action),
        comments=approval_data.comments,
        signature_data=approval_data.signature_data,
        ip_address=request.client.host if request.client else None
    )
    db.add(approval)
    
    # Update step status based on action
    if action in ["approved", "signed", "reviewed", "acknowledged"]:
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
    
    elif action == "rejected":
        # Rejection ends the workflow immediately
        step.status = WorkflowStatus.REJECTED
        step.completed_at = datetime.utcnow()
        workflow.status = WorkflowStatus.REJECTED
        workflow.completed_at = datetime.utcnow()
        
        # Mark all remaining steps as cancelled
        remaining_steps = db.query(WorkflowStep).filter(
            WorkflowStep.workflow_id == workflow_id,
            WorkflowStep.step_order > step.step_order
        ).all()
        for remaining_step in remaining_steps:
            remaining_step.status = WorkflowStatus.REJECTED
    
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
    """Get workflows where I need to take action NOW (my step is currently active)"""
    
    # Build filter conditions
    filter_conditions = [
        WorkflowStep.status == WorkflowStatus.IN_PROGRESS,
        WorkflowStep.assigned_to_id == current_user.id
    ]
    if current_user.department_id:
        filter_conditions.append(WorkflowStep.department_id == current_user.department_id)
    
    # Find steps assigned to me or my department that are in progress
    pending_steps = db.query(WorkflowStep).filter(
        or_(*filter_conditions)
    ).all()
    
    # Get unique workflows
    workflow_ids = list(set([step.workflow_id for step in pending_steps]))
    
    if not workflow_ids:
        return []
    
    workflows = db.query(Workflow).filter(Workflow.id.in_(workflow_ids)).all()
    
    return workflows

@router.get("/my-workflows", response_model=List[WorkflowResponse])
def get_my_workflows(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all workflows where I'm assigned to any step (for visibility)"""
    
    try:
        # Build filter conditions
        filter_conditions = [WorkflowStep.assigned_to_id == current_user.id]
        
        # Only add department filter if user has a department
        if current_user.department_id:
            filter_conditions.append(WorkflowStep.department_id == current_user.department_id)
        
        # Get workflow IDs where user is assigned in ANY step
        assigned_workflow_ids = db.query(WorkflowStep.workflow_id).filter(
            or_(*filter_conditions)
        ).distinct().all()
        assigned_workflow_ids = [wf_id[0] for wf_id in assigned_workflow_ids]
        
        # If no workflows assigned, return empty list
        if not assigned_workflow_ids:
            return []
        
        # Get all workflows where user is assigned
        workflows = db.query(Workflow).filter(
            Workflow.id.in_(assigned_workflow_ids)
        ).order_by(Workflow.created_at.desc()).all()
        
        return workflows
    except Exception as e:
        print(f"Error in get_my_workflows: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching workflows: {str(e)}")
