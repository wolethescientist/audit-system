@echo off
echo Restarting Backend Server...
echo.

REM Kill existing Python/Uvicorn processes
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM uvicorn.exe /T 2>nul

echo Waiting for processes to close...
timeout /t 2 /nobreak >nul

echo.
echo Starting backend server...
cd backend
start cmd /k "venv\Scripts\activate && uvicorn app.main:app --reload"

echo.
echo Backend server is starting...
echo Check the new window for server output
echo.
pause
