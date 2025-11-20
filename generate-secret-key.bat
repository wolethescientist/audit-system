@echo off
REM Generate JWT Secret Key - Windows Batch Script
echo ======================================================================
echo JWT SECRET KEY GENERATOR
echo ======================================================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

REM Run the Python script
python generate-secret-key.py

pause
