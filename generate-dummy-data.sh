#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}============================================================${NC}"
echo -e "${YELLOW}Comprehensive Dummy Data Generator${NC}"
echo -e "${YELLOW}============================================================${NC}"
echo ""
echo "This script will populate your database with realistic data"
echo "showcasing all features for each role."
echo ""
echo "Prerequisites:"
echo "  1. Backend server must be running (port 8000)"
echo "  2. Admin user must exist (admin@audit.com)"
echo "  3. Python requests library installed"
echo ""
read -p "Press Enter to continue..."

echo ""
echo "Checking if backend is running..."
if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
    echo -e "${GREEN}[OK] Backend server is running${NC}"
else
    echo -e "${RED}[ERROR] Backend server is not running!${NC}"
    echo "Please start the backend first:"
    echo "  cd backend"
    echo "  python -m uvicorn app.main:app --reload"
    echo ""
    exit 1
fi

echo ""
echo "Starting data generation..."
echo ""

python3 generate-comprehensive-dummy-data.py

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}============================================================${NC}"
    echo -e "${GREEN}Data generation completed successfully!${NC}"
    echo -e "${GREEN}============================================================${NC}"
    echo ""
    echo "You can now login to the system with any of these users:"
    echo "  - admin@audit.com (System Admin)"
    echo "  - audit.manager@audit.com (Audit Manager)"
    echo "  - senior.auditor@audit.com (Senior Auditor)"
    echo "  - finance.head@company.com (Finance Department Head)"
    echo "  - it.head@company.com (IT Department Head)"
    echo ""
    echo "Frontend URL: http://localhost:3000"
    echo ""
else
    echo ""
    echo -e "${RED}[ERROR] Data generation failed!${NC}"
    echo "Please check the error messages above."
    exit 1
fi
