"""
Run Evidence Table Migration
Adds missing columns to audit_evidence table for Supabase Storage integration
"""
import sys
from app.database import SessionLocal, engine
from sqlalchemy import text

def run_migration():
    """Run the evidence table migration"""
    print("=" * 60)
    print("Evidence Table Migration")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        print("\nReading migration SQL...")
        with open('add_evidence_columns.sql', 'r') as f:
            sql = f.read()
        
        print("Executing migration...")
        
        # Split by semicolons and execute each statement
        statements = [s.strip() for s in sql.split(';') if s.strip() and not s.strip().startswith('--')]
        
        for i, statement in enumerate(statements, 1):
            if statement:
                print(f"  Executing statement {i}...")
                db.execute(text(statement))
        
        db.commit()
        
        print("\n✓ Migration completed successfully!")
        print("\nVerifying columns...")
        
        # Verify columns exist
        result = db.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns
            WHERE table_name = 'audit_evidence'
            AND column_name IN (
                'evidence_category', 'is_objective_evidence', 'evidence_source',
                'collection_method', 'evidence_timestamp', 'chain_of_custody'
            )
            ORDER BY column_name;
        """))
        
        columns = result.fetchall()
        if columns:
            print("\nNew columns added:")
            for col in columns:
                print(f"  ✓ {col[0]} ({col[1]})")
        else:
            print("\n⚠ Warning: Could not verify columns")
        
        print("\n" + "=" * 60)
        print("Migration complete! Restart your backend server.")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n✗ Migration failed: {str(e)}")
        db.rollback()
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    try:
        success = run_migration()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\nFatal error: {str(e)}")
        sys.exit(1)
