"""
Test the execution-status endpoint directly
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

# Get an audit ID to test with
with engine.connect() as conn:
    result = conn.execute(text("SELECT id, title FROM audits LIMIT 1"))
    audit = result.fetchone()
    
    if not audit:
        print("No audits found in database")
        exit(1)
    
    audit_id = audit[0]
    print(f"Testing with audit: {audit[1]} (ID: {audit_id})")
    
    # Check interview notes for this audit
    result = conn.execute(text(f"SELECT COUNT(*) FROM audit_interview_notes WHERE audit_id = '{audit_id}'"))
    interview_count = result.scalar()
    print(f"Interview notes: {interview_count}")
    
    # Check observations for this audit
    result = conn.execute(text(f"SELECT COUNT(*) FROM audit_observations WHERE audit_id = '{audit_id}'"))
    obs_count = result.scalar()
    print(f"Observations: {obs_count}")
    
    # Check evidence for this audit
    result = conn.execute(text(f"SELECT COUNT(*) FROM audit_evidence WHERE audit_id = '{audit_id}'"))
    evidence_count = result.scalar()
    print(f"Evidence items: {evidence_count}")
    
    # Check sampling for this audit
    result = conn.execute(text(f"SELECT COUNT(*) FROM audit_sampling WHERE audit_id = '{audit_id}'"))
    sampling_count = result.scalar()
    print(f"Sampling plans: {sampling_count}")
    
    print(f"\nExpected can_proceed_to_reporting: {interview_count > 0 or obs_count > 0 or evidence_count > 0}")

# Now test the actual endpoint logic
print("\n" + "="*50)
print("TESTING ENDPOINT LOGIC")
print("="*50)

try:
    from app.models import Audit, AuditEvidence, AuditFinding, AuditInterviewNote, AuditSampling, AuditObservation
    
    session = Session()
    
    audit = session.query(Audit).first()
    if not audit:
        print("No audit found")
        exit(1)
    
    audit_id = audit.id
    print(f"\nQuerying for audit_id: {audit_id}")
    
    # Test each query
    print("\nTesting AuditInterviewNote query...")
    interview_notes = session.query(AuditInterviewNote).filter(
        AuditInterviewNote.audit_id == audit_id
    ).all()
    print(f"  Found {len(interview_notes)} interview notes")
    
    print("\nTesting AuditSampling query...")
    sampling_plans = session.query(AuditSampling).filter(
        AuditSampling.audit_id == audit_id
    ).all()
    print(f"  Found {len(sampling_plans)} sampling plans")
    
    print("\nTesting AuditObservation query...")
    observations = session.query(AuditObservation).filter(
        AuditObservation.audit_id == audit_id
    ).all()
    print(f"  Found {len(observations)} observations")
    
    print("\nTesting AuditEvidence query...")
    evidence_items = session.query(AuditEvidence).filter(
        AuditEvidence.audit_id == audit_id
    ).all()
    print(f"  Found {len(evidence_items)} evidence items")
    
    print("\nTesting AuditFinding query...")
    findings = session.query(AuditFinding).filter(
        AuditFinding.audit_id == audit_id
    ).all()
    print(f"  Found {len(findings)} findings")
    
    # Calculate the result
    can_proceed = len(interview_notes) > 0 or len(observations) > 0 or len(evidence_items) > 0
    print(f"\n✅ can_proceed_to_reporting: {can_proceed}")
    
    session.close()
    
except Exception as e:
    print(f"\n❌ ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
