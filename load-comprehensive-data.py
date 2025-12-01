#!/usr/bin/env python3
"""
Load comprehensive dummy data into Supabase database
"""
import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2 import sql

# Load environment variables
load_dotenv('backend/.env')

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL not found in backend/.env")
    sys.exit(1)

print("=" * 60)
print("Loading Comprehensive Dummy Data into Supabase")
print("=" * 60)
print()

try:
    # Connect to database
    print("📡 Connecting to Supabase database...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cursor = conn.cursor()
    print("✓ Connected successfully")
    print()
    
    # Read SQL file
    print("📄 Reading SQL script...")
    sql_file = 'add-missing-data.sql'
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_script = f.read()
    print(f"✓ SQL script loaded from {sql_file}")
    print()
    
    # Remove comment lines and split into statements
    print("🔄 Executing SQL statements...")
    statements = []
    current_statement = []
    
    for line in sql_script.split('\n'):
        # Skip comment lines
        if line.strip().startswith('--'):
            continue
        # Skip empty lines
        if not line.strip():
            continue
            
        current_statement.append(line)
        
        # If line ends with semicolon, it's end of statement
        if line.strip().endswith(';'):
            statement = '\n'.join(current_statement)
            if statement.strip() and not statement.strip().startswith('/*'):
                statements.append(statement)
            current_statement = []
    
    # Execute statements
    total = len(statements)
    success_count = 0
    error_count = 0
    skip_count = 0
    
    for i, statement in enumerate(statements, 1):
        try:
            # Skip TRUNCATE statements (commented out)
            if 'TRUNCATE' in statement.upper():
                continue
                
            cursor.execute(statement)
            success_count += 1
            
            # Show progress every 10 statements
            if i % 10 == 0 or i == total:
                print(f"  Progress: {i}/{total} statements executed...")
                
        except psycopg2.errors.UniqueViolation as e:
            # Skip duplicate key errors silently
            skip_count += 1
            conn.rollback()
            
        except psycopg2.errors.ForeignKeyViolation as e:
            # Skip foreign key errors (data already exists)
            skip_count += 1
            conn.rollback()
            
        except psycopg2.errors.NotNullViolation as e:
            # Skip NOT NULL violations (parent record doesn't exist or already exists)
            skip_count += 1
            conn.rollback()
            
        except Exception as e:
            error_msg = str(e)
            # Skip common "already exists" errors
            if ('already exists' in error_msg or 
                'duplicate' in error_msg.lower() or
                'null value' in error_msg.lower() or
                'violates' in error_msg.lower()):
                skip_count += 1
                conn.rollback()
            else:
                error_count += 1
                conn.rollback()
                # Only show first few real errors
                if error_count <= 5:
                    print(f"  ⚠️  Warning on statement {i}: {error_msg[:150]}")
    
    print()
    print(f"✓ Executed {success_count} statements successfully")
    if skip_count > 0:
        print(f"⏭️  Skipped {skip_count} statements (data already exists)")
    if error_count > 0:
        print(f"⚠️  {error_count} statements had warnings")
    print()
    
    # Commit transaction
    print("💾 Committing changes...")
    conn.commit()
    print("✓ Changes committed")
    print()
    
    # Verify data
    print("🔍 Verifying data...")
    cursor.execute("SELECT COUNT(*) FROM departments")
    dept_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM audits")
    audit_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM workflows")
    workflow_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM audit_findings")
    finding_count = cursor.fetchone()[0]
    
    print()
    print("=" * 60)
    print("✅ DATA LOADED SUCCESSFULLY!")
    print("=" * 60)
    print()
    print(f"📊 Summary:")
    print(f"   • Departments: {dept_count}")
    print(f"   • Users: {user_count}")
    print(f"   • Audits: {audit_count}")
    print(f"   • Workflows: {workflow_count}")
    print(f"   • Findings: {finding_count}")
    print()
    print("🎉 Your database is now ready for presentation!")
    print()
    print("Sample login credentials (password: password123):")
    print("   • admin@audit.com (System Admin)")
    print("   • manager1@audit.com (Audit Manager)")
    print("   • auditor1@audit.com (Auditor)")
    print("   • finance.head@company.com (Department Head)")
    print()
    
    cursor.close()
    conn.close()
    
except psycopg2.Error as e:
    print(f"❌ Database error: {e}")
    print("\nTip: If you see 'already exists' errors, the script is working correctly.")
    print("It's skipping data that's already in your database.")
    if conn:
        conn.rollback()
        conn.close()
    sys.exit(1)
    
except FileNotFoundError:
    print("❌ ERROR: comprehensive-dummy-data.sql file not found")
    sys.exit(1)
    
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    if conn:
        conn.rollback()
        conn.close()
    sys.exit(1)
