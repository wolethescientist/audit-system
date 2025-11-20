#!/bin/bash

echo "========================================"
echo "Audit Management System - Verification"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        return 1
    fi
}

check_version() {
    version=$($1 2>&1)
    echo -e "${GREEN}  Version: ${NC}$version"
}

echo "Checking Prerequisites..."
echo ""

# Check Python
if check_command python3; then
    check_version "python3 --version"
else
    echo -e "${YELLOW}  Install Python 3.10+${NC}"
fi
echo ""

# Check Node
if check_command node; then
    check_version "node --version"
    node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        echo -e "${YELLOW}  Warning: Node.js 18+ recommended${NC}"
    fi
else
    echo -e "${YELLOW}  Install Node.js 18+${NC}"
fi
echo ""

# Check npm
if check_command npm; then
    check_version "npm --version"
fi
echo ""

# Check Git
if check_command git; then
    check_version "git --version"
fi
echo ""

echo "Checking Backend Setup..."
echo ""

# Check backend directory
if [ -d "backend" ]; then
    echo -e "${GREEN}✓${NC} Backend directory exists"
    
    # Check virtual environment
    if [ -d "backend/venv" ]; then
        echo -e "${GREEN}✓${NC} Virtual environment exists"
    else
        echo -e "${YELLOW}⚠${NC} Virtual environment not found"
        echo -e "${YELLOW}  Run: cd backend && python3 -m venv venv${NC}"
    fi
    
    # Check .env file
    if [ -f "backend/.env" ]; then
        echo -e "${GREEN}✓${NC} .env file exists"
    else
        echo -e "${YELLOW}⚠${NC} .env file not found"
        echo -e "${YELLOW}  Run: cd backend && cp .env.example .env${NC}"
    fi
    
    # Check requirements
    if [ -f "backend/requirements.txt" ]; then
        echo -e "${GREEN}✓${NC} requirements.txt exists"
    fi
else
    echo -e "${RED}✗${NC} Backend directory not found"
fi
echo ""

echo "Checking Frontend Setup..."
echo ""

# Check frontend directory
if [ -d "frontend" ]; then
    echo -e "${GREEN}✓${NC} Frontend directory exists"
    
    # Check node_modules
    if [ -d "frontend/node_modules" ]; then
        echo -e "${GREEN}✓${NC} node_modules exists"
    else
        echo -e "${YELLOW}⚠${NC} node_modules not found"
        echo -e "${YELLOW}  Run: cd frontend && npm install${NC}"
    fi
    
    # Check .env.local
    if [ -f "frontend/.env.local" ]; then
        echo -e "${GREEN}✓${NC} .env.local exists"
    else
        echo -e "${YELLOW}⚠${NC} .env.local not found"
        echo -e "${YELLOW}  Run: cd frontend && cp .env.example .env.local${NC}"
    fi
    
    # Check package.json
    if [ -f "frontend/package.json" ]; then
        echo -e "${GREEN}✓${NC} package.json exists"
    fi
else
    echo -e "${RED}✗${NC} Frontend directory not found"
fi
echo ""

echo "Checking Services..."
echo ""

# Check backend server
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend server is running (port 8000)"
else
    echo -e "${YELLOW}⚠${NC} Backend server is not running"
    echo -e "${YELLOW}  Start: cd backend && uvicorn app.main:app --reload${NC}"
fi

# Check frontend server
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Frontend server is running (port 3000)"
else
    echo -e "${YELLOW}⚠${NC} Frontend server is not running"
    echo -e "${YELLOW}  Start: cd frontend && npm run dev${NC}"
fi
echo ""

echo "========================================"
echo "Verification Complete"
echo "========================================"
echo ""
echo "Next Steps:"
echo "1. Install missing dependencies"
echo "2. Configure environment files"
echo "3. Run database migrations"
echo "4. Start both servers"
echo ""
echo "See INSTALLATION.md for detailed instructions"
echo ""
