"""Debug script to test dashboard queries."""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.jyvstpksqrdifxpgywvd:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres")

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

print("Testing dashboard queries...\n")

# Test 1: Basic audit count
try:
    result = session.execute(text("SELECT COUNT(*) FROM audits"))
    print(f"✓ Audits count: {result.scalar()}")
except Exception as e:
    print(f"✗ Audits count failed: {e}")

# Test 2: Audit status filter
try:
    result = session.execute(text("SELECT status, COUNT(*) FROM audits GROUP BY status"))
    print(f"✓ Audit statuses: {list(result)}")
except Exception as e:
    print(f"✗ Audit status query failed: {e}")

# Test 3: Findings count
try:
    result = session.execute(text("SELECT COUNT(*) FROM audit_findings"))
    print(f"✓ Findings count: {result.scalar()}")
except Exception as e:
    print(f"✗ Findings count failed: {e}")

# Test 4: Risk assessments
try:
    result = session.execute(text("SELECT COUNT(*) FROM risk_assessments"))
    print(f"✓ Risk assessments count: {result.scalar()}")
except Exception as e:
    print(f"✗ Risk assessments failed: {e}")

# Test 5: CAPA items
try:
    result = session.execute(text("SELECT COUNT(*) FROM capa_items"))
    print(f"✓ CAPA items count: {result.scalar()}")
except Exception as e:
    print(f"✗ CAPA items failed: {e}")

# Test 6: CAPA status values
try:
    result = session.execute(text("SELECT status, COUNT(*) FROM capa_items GROUP BY status"))
    print(f"✓ CAPA statuses: {list(result)}")
except Exception as e:
    print(f"✗ CAPA status query failed: {e}")

# Test 7: ISO Frameworks
try:
    result = session.execute(text("SELECT COUNT(*) FROM iso_frameworks"))
    print(f"✓ ISO frameworks count: {result.scalar()}")
except Exception as e:
    print(f"✗ ISO frameworks failed: {e}")

# Test 8: Audit checklists
try:
    result = session.execute(text("SELECT COUNT(*) FROM audit_checklists"))
    print(f"✓ Audit checklists count: {result.scalar()}")
except Exception as e:
    print(f"✗ Audit checklists failed: {e}")

# Test 9: Compliance scores query (the actual dashboard query)
try:
    result = session.execute(text("""
        SELECT 
            f.name,
            f.version,
            AVG(c.compliance_score) as avg_score,
            COUNT(c.id) as total_controls
        FROM iso_frameworks f
        JOIN audit_checklists c ON f.id = c.framework_id
        WHERE c.compliance_status != 'not_assessed'
        GROUP BY f.id, f.name, f.version
    """))
    print(f"✓ Compliance scores: {list(result)}")
except Exception as e:
    print(f"✗ Compliance scores query failed: {e}")

# Test 10: Followups
try:
    result = session.execute(text("SELECT COUNT(*) FROM audit_followup"))
    print(f"✓ Followups count: {result.scalar()}")
except Exception as e:
    print(f"✗ Followups failed: {e}")

session.close()
print("\nDone!")
