"""Fix capa_status enum - handle default value."""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.jyvstpksqrdifxpgywvd:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Fixing capa_status enum...")
    
    try:
        # 1. Drop the default first
        conn.execute(text("ALTER TABLE capa_items ALTER COLUMN status DROP DEFAULT;"))
        conn.commit()
        print("✓ Dropped default")
        
        # 2. Alter column to use new type
        conn.execute(text("""
            ALTER TABLE capa_items 
            ALTER COLUMN status TYPE capa_status_new 
            USING status::text::capa_status_new;
        """))
        conn.commit()
        print("✓ Altered column type")
        
        # 3. Drop old enum type
        conn.execute(text("DROP TYPE capa_status;"))
        conn.commit()
        print("✓ Dropped old capa_status")
        
        # 4. Rename new type
        conn.execute(text("ALTER TYPE capa_status_new RENAME TO capa_status;"))
        conn.commit()
        print("✓ Renamed to capa_status")
        
        # 5. Re-add default
        conn.execute(text("ALTER TABLE capa_items ALTER COLUMN status SET DEFAULT 'OPEN'::capa_status;"))
        conn.commit()
        print("✓ Re-added default")
        
    except Exception as e:
        print(f"✗ Failed: {str(e)}")
        conn.rollback()
    
    print("\nFINAL ENUM STATE:")
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
