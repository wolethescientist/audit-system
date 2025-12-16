"""
Script to check if all execution phase tables exist in the database
Run this to diagnose the 500 errors on the execution page
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set in environment")
    exit(1)

engine = create_engine(DATABASE_URL)

# Tables needed for execution phase
required_tables = [
    'iso_frameworks',
    'audit_checklists', 
    'audit_interview_notes',
    'audit_sampling',
    'audit_observations'
]

# Enum types needed
required_enums = [
    'compliance_status'
]

print("=" * 60)
print("CHECKING EXECUTION PHASE DATABASE REQUIREMENTS")
print("=" * 60)

with engine.connect() as conn:
    # Check tables
    print("\n📋 CHECKING TABLES:")
    print("-" * 40)
    for table in required_tables:
        result = conn.execute(text(f"""
            SELECT EXISTS (
                SELECT FROM pg_tables 
                WHERE schemaname = 'public' 
                AND tablename = '{table}'
            )
        """))
        exists = result.scalar()
        status = "✅ EXISTS" if exists else "❌ MISSING"
        print(f"  {table}: {status}")
    
    # Check enum types
    print("\n📋 CHECKING ENUM TYPES:")
    print("-" * 40)
    for enum_type in required_enums:
        result = conn.execute(text(f"""
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = '{enum_type}'
            )
        """))
        exists = result.scalar()
        status = "✅ EXISTS" if exists else "❌ MISSING"
        print(f"  {enum_type}: {status}")
    
    # Check table columns for audit_interview_notes
    print("\n📋 CHECKING audit_interview_notes COLUMNS:")
    print("-" * 40)
    result = conn.execute(text("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'audit_interview_notes'
        ORDER BY ordinal_position
    """))
    columns = result.fetchall()
    if columns:
        for col in columns:
            print(f"  {col[0]}: {col[1]}")
    else:
        print("  ❌ Table does not exist or has no columns")
    
    # Check table columns for audit_checklists
    print("\n📋 CHECKING audit_checklists COLUMNS:")
    print("-" * 40)
    result = conn.execute(text("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'audit_checklists'
        ORDER BY ordinal_position
    """))
    columns = result.fetchall()
    if columns:
        for col in columns:
            print(f"  {col[0]}: {col[1]}")
    else:
        print("  ❌ Table does not exist or has no columns")

    # Try to query the tables
    print("\n📋 TESTING TABLE QUERIES:")
    print("-" * 40)
    
    test_queries = [
        ("audit_interview_notes", "SELECT COUNT(*) FROM audit_interview_notes"),
        ("audit_checklists", "SELECT COUNT(*) FROM audit_checklists"),
        ("audit_sampling", "SELECT COUNT(*) FROM audit_sampling"),
        ("audit_observations", "SELECT COUNT(*) FROM audit_observations"),
    ]
    
    for table_name, query in test_queries:
        try:
            result = conn.execute(text(query))
            count = result.scalar()
            print(f"  {table_name}: ✅ Query OK (count: {count})")
        except Exception as e:
            print(f"  {table_name}: ❌ Query FAILED - {str(e)[:80]}")

print("\n" + "=" * 60)
print("DIAGNOSIS COMPLETE")
print("=" * 60)
