"""Run the enum fix SQL script against the database."""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.jyvstpksqrdifxpgywvd:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres")

# Read the SQL file
with open("fix_all_enums_uppercase.sql", "r") as f:
    sql_content = f.read()

engine = create_engine(DATABASE_URL)

# Split by semicolons and execute each statement
statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]

with engine.connect() as conn:
    for i, stmt in enumerate(statements):
        if stmt and not stmt.startswith('SELECT'):
            try:
                conn.execute(text(stmt))
                conn.commit()
                print(f"✓ Statement {i+1} executed")
            except Exception as e:
                print(f"✗ Statement {i+1} failed: {str(e)[:100]}")
    
    # Show final enum values
    print("\n" + "=" * 50)
    print("ENUM TYPES AFTER FIX:")
    print("=" * 50)
    result = conn.execute(text("""
        SELECT t.typname as enum_name,
               string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        GROUP BY t.typname
        ORDER BY t.typname;
    """))
    
    for row in result:
        print(f"  {row[0]}: {row[1]}")

print("\nDone!")
