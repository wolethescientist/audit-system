"""Check which enum types are actually used by database columns."""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.jyvstpksqrdifxpgywvd:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Find which columns use which enum types
    result = conn.execute(text("""
        SELECT 
            c.table_name,
            c.column_name,
            c.udt_name as enum_type
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
        AND c.udt_name IN (
            SELECT t.typname 
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = 'public'
        )
        ORDER BY c.udt_name, c.table_name;
    """))
    
    print("ENUM TYPES USED BY COLUMNS:")
    print("="*60)
    current_enum = None
    for row in result:
        if row[2] != current_enum:
            current_enum = row[2]
            print(f"\n{row[2]}:")
        print(f"  - {row[0]}.{row[1]}")

print("\n\nDone!")
