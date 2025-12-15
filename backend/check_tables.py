"""Script to list all tables in the production database."""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.jyvstpksqrdifxpgywvd:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Get all tables
    result = conn.execute(text("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """))
    
    tables = [row[0] for row in result]
    
    print("=" * 50)
    print(f"TABLES IN DATABASE ({len(tables)} total):")
    print("=" * 50)
    for table in tables:
        print(f"  - {table}")
    
    # Get all enum types
    print("\n" + "=" * 50)
    print("ENUM TYPES IN DATABASE:")
    print("=" * 50)
    result = conn.execute(text("""
        SELECT t.typname as enum_name,
               string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        GROUP BY t.typname;
    """))
    
    for row in result:
        print(f"  - {row[0]}: {row[1]}")
