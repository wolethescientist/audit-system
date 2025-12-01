@echo off
echo ============================================
echo Load Comprehensive Dummy Data to Supabase
echo ============================================
echo.

python load-comprehensive-data.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to load data
    pause
    exit /b 1
)

echo.
pause
