"""Final cleanup - recreate enum types with only uppercase values."""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.jyvstpksqrdifxpgywvd:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres")

engine = create_engine(DATABASE_URL)

def recreate_enum(conn, enum_name, table_name, column_name, new_values):
    """Recreate an enum type with only the specified values."""
    print(f"\nRecreating {enum_name}...")
    
    try:
        # 1. Create new enum type
        values_str = ", ".join([f"'{v}'" for v in new_values])
        conn.execute(text(f"CREATE TYPE {enum_name}_new AS ENUM ({values_str});"))
        conn.commit()
        print(f"  ✓ Created {enum_name}_new")
        
        # 2. Alter column to use new type
        conn.execute(text(f"""
            ALTER TABLE {table_name} 
            ALTER COLUMN {column_name} TYPE {enum_name}_new 
            USING {column_name}::text::{enum_name}_new;
        """))
        conn.commit()
        print(f"  ✓ Altered {table_name}.{column_name} to use new type")
        
        # 3. Drop old enum type
        conn.execute(text(f"DROP TYPE {enum_name};"))
        conn.commit()
        print(f"  ✓ Dropped old {enum_name}")
        
        # 4. Rename new type to original name
        conn.execute(text(f"ALTER TYPE {enum_name}_new RENAME TO {enum_name};"))
        conn.commit()
        print(f"  ✓ Renamed {enum_name}_new to {enum_name}")
        
        return True
    except Exception as e:
        print(f"  ✗ Failed: {str(e)}")
        conn.rollback()
        return False

with engine.connect() as conn:
    print("="*60)
    print("FIXING ENUM TYPES WITH STALE VALUES")
    print("="*60)
    
    # Fix auditstatus
    recreate_enum(
        conn, 
        'auditstatus', 
        'audits', 
        'status',
        ['PLANNED', 'INITIATED', 'PREPARATION', 'EXECUTING', 'REPORTING', 'FOLLOWUP', 'CLOSED']
    )
    
    # Fix capa_status
    recreate_enum(
        conn,
        'capa_status',
        'capa_items',
        'status',
        ['OPEN', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'CLOSED', 'OVERDUE']
    )
    
    print("\n" + "="*60)
    print("FINAL ENUM STATE:")
    print("="*60)
    
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
