#!/bin/bash

echo "============================================"
echo "Database Setup with Comprehensive Dummy Data"
echo "============================================"
echo ""

echo "Step 1: Running Alembic migrations to create tables..."
cd backend
alembic upgrade head
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to run migrations"
    cd ..
    exit 1
fi
cd ..
echo "✓ Migrations completed successfully"
echo ""

echo "Step 2: Loading comprehensive dummy data..."
echo "Please enter your database connection details:"
echo ""

read -p "Database Host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database Port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Database Name: " DB_NAME
read -p "Database User: " DB_USER
read -sp "Database Password: " DB_PASS
echo ""

echo ""
echo "Connecting to: postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""

PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f comprehensive-dummy-data.sql

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Failed to load dummy data"
    echo ""
    echo "If psql is not found, you need to install PostgreSQL client tools"
    echo ""
    exit 1
fi

echo ""
echo "============================================"
echo "✓ Database setup completed successfully!"
echo "============================================"
echo ""
echo "Your database now contains:"
echo "- 10 Departments"
echo "- 20 Users across all roles"
echo "- 7 Audits in various statuses"
echo "- Complete audit data (teams, work programs, evidence, findings, queries, reports)"
echo "- 6 Workflows with steps and approvals"
echo ""
echo "You can now start the application and login with any user."
echo "Default password for all users: password123"
echo ""
echo "Sample users:"
echo "- admin@audit.com (System Admin)"
echo "- manager1@audit.com (Audit Manager)"
echo "- auditor1@audit.com (Auditor)"
echo "- finance.head@company.com (Department Head)"
echo ""
