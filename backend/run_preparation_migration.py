"""
Run this script to add the preparation tables to the database.
Usage: python run_preparation_migration.py
"""
import os
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment variables")
    sys.exit(1)

print(f"Connecting to database...")

engine = create_engine(DATABASE_URL)

# Read the SQL file
sql_file = Path(__file__).parent / "add_preparation_tables.sql"
with open(sql_file, 'r') as f:
    sql_content = f.read()

# Execute the SQL
with engine.connect() as conn:
    try:
        # Split by semicolons and execute each statement
        statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]
        
        for statement in statements:
            if statement:
                print(f"Executing: {statement[:80]}...")
                conn.execute(text(statement))
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        print("Tables created:")
        print("  - audit_preparation_checklists")
        print("  - audit_document_requests")
        print("  - audit_risk_assessments")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        conn.rollback()
        sys.exit(1)
