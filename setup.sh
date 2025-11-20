#!/bin/bash

echo "========================================"
echo "Audit Management System - Setup Script"
echo "========================================"
echo ""

echo "Step 1: Setting up Backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt

if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Please edit backend/.env with your Supabase credentials!"
    echo ""
    read -p "Press enter to continue..."
fi

cd ..

echo ""
echo "Step 2: Setting up Frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file from template..."
    cp .env.example .env.local
fi

cd ..

echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your Supabase credentials"
echo "2. Run database migrations:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   alembic revision --autogenerate -m 'Initial migration'"
echo "   alembic upgrade head"
echo ""
echo "3. Start the backend:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   uvicorn app.main:app --reload"
echo ""
echo "4. Start the frontend (in a new terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "5. Open http://localhost:3000 in your browser"
echo ""
