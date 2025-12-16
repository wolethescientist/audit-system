import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))

audit_id = '72c900d4-52cf-498f-9407-a1c8b37f861e'

with engine.connect() as conn:
    r = conn.execute(text(f"SELECT COUNT(*) FROM audit_interview_notes WHERE audit_id = '{audit_id}'"))
    interview_count = r.scalar()
    print(f'Interview notes: {interview_count}')
    
    r = conn.execute(text(f"SELECT COUNT(*) FROM audit_observations WHERE audit_id = '{audit_id}'"))
    obs_count = r.scalar()
    print(f'Observations: {obs_count}')
    
    r = conn.execute(text(f"SELECT COUNT(*) FROM audit_evidence WHERE audit_id = '{audit_id}'"))
    evidence_count = r.scalar()
    print(f'Evidence: {evidence_count}')
    
    r = conn.execute(text(f"SELECT COUNT(*) FROM audit_sampling WHERE audit_id = '{audit_id}'"))
    sampling_count = r.scalar()
    print(f'Sampling: {sampling_count}')
    
    can_proceed = interview_count > 0 or obs_count > 0 or evidence_count > 0
    print(f'\ncan_proceed_to_reporting should be: {can_proceed}')
