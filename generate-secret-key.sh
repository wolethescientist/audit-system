#!/bin/bash
# Generate JWT Secret Key - Unix/Linux/Mac Shell Script

echo "======================================================================"
echo "JWT SECRET KEY GENERATOR"
echo "======================================================================"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "ERROR: Python is not installed or not in PATH"
        echo "Please install Python from https://www.python.org/"
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi

# Run the Python script
$PYTHON_CMD generate-secret-key.py
