"""Clean up duplicate enum types and fix values."""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.jyvstpksqrdifxpgywvd:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("="*60)
    print("STEP 1: Drop unused duplicate enum types")
    print("="*60)
    
    unused_enums = ['assetstatus', 'capastatus', 'capatype', 'compliancestatus', 'riskcategory']
    for enum_name in unused_enums:
        try:
            conn.execute(text(f"DROP TYPE IF EXISTS {enum_name} CASCADE;"))
            conn.commit()
            print(f"✓ Dropped {enum_name}")
        except Exception as e:
            print(f"✗ Failed to drop {enum_name}: {str(e)[:50]}")
    
    print("\n" + "="*60)
    print("STEP 2: Fix auditstatus - remove duplicate lowercase values")
    print("="*60)
    
    # For auditstatus, we need to update any rows using lowercase then remove the values
    try:
        conn.execute(text("UPDATE audits SET status = 'INITIATED' WHERE status::text = 'initiated';"))
        conn.execute(text("UPDATE audits SET status = 'PREPARATION' WHERE status::text = 'preparation';"))
        conn.commit()
        print("✓ Updated any rows using lowercase auditstatus values")
    except Exception as e:
        print(f"✗ Update failed: {str(e)[:50]}")
    
    print("\n" + "="*60)
    print("STEP 3: Fix capa_status - remove _OLD values")
    print("="*60)
    
    # The _OLD values were created by a previous migration attempt
    old_values = ['OPEN_OLD', 'IN_PROGRESS_OLD', 'PENDING_VERIFICATION_OLD', 'CLOSED_OLD', 'OVERDUE_OLD']
    for val in old_values:
        try:
            # First check if any rows use this value
            result = conn.execute(text(f"SELECT COUNT(*) FROM capa_items WHERE status::text = '{val}';"))
            count = result.scalar()
            if count > 0:
                # Update to the non-OLD version
                new_val = val.replace('_OLD', '')
                conn.execute(text(f"UPDATE capa_items SET status = '{new_val}' WHERE status::text = '{val}';"))
                conn.commit()
                print(f"✓ Migrated {count} rows from {val} to {new_val}")
        except Exception as e:
            print(f"Note: {val} - {str(e)[:40]}")
    
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
