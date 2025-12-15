"""Convert all enum values in the database to UPPERCASE."""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.jyvstpksqrdifxpgywvd:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Get all enum types and their values
    result = conn.execute(text("""
        SELECT t.typname as enum_name, e.enumlabel as enum_value
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        ORDER BY t.typname, e.enumsortorder;
    """))
    
    enums = {}
    for row in result:
        if row[0] not in enums:
            enums[row[0]] = []
        enums[row[0]].append(row[1])
    
    print("Current enum values:")
    for name, values in enums.items():
        print(f"  {name}: {values}")
    
    print("\n" + "="*50)
    print("Converting lowercase values to UPPERCASE...")
    print("="*50 + "\n")
    
    # For each enum, rename lowercase values to uppercase
    for enum_name, values in enums.items():
        for value in values:
            if value != value.upper() and value.upper() not in values:
                try:
                    sql = f"ALTER TYPE {enum_name} RENAME VALUE '{value}' TO '{value.upper()}';"
                    conn.execute(text(sql))
                    conn.commit()
                    print(f"✓ {enum_name}: '{value}' -> '{value.upper()}'")
                except Exception as e:
                    print(f"✗ {enum_name}: '{value}' failed - {str(e)[:60]}")
    
    # Show final state
    print("\n" + "="*50)
    print("FINAL ENUM VALUES:")
    print("="*50)
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
