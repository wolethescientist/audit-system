@echo off
echo Starting Audit Management System Backend...

REM Activate virtual environment
if exist venv (
    call venv\Scripts\activate
) else (
    echo Virtual environment not found. Creating...
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
)

REM Check if .env exists
if not exist .env (
    echo Error: .env file not found!
    echo Please copy .env.example to .env and configure it.
    pause
    exit /b 1
)

REM Run migrations
echo Running database migrations...
alembic upgrade head

REM Start server
echo Starting FastAPI server...
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
