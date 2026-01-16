@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Project Sentinel - Desktop Agent Launcher
echo ============================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo.
    echo Please install Python 3.8+ from https://python.org
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

echo [OK] Python found.

:: Check for required packages
echo [INFO] Checking dependencies...
pip show requests >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing requests package...
    pip install requests
)

pip show psutil >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing psutil package...
    pip install psutil
)

echo [OK] Dependencies installed.
echo.

:: Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"

:: Check if sentinel_agent.py exists in the same directory
if exist "%SCRIPT_DIR%sentinel_agent.py" (
    set "AGENT_PATH=%SCRIPT_DIR%sentinel_agent.py"
) else if exist "%SCRIPT_DIR%SentinelAgent.py" (
    set "AGENT_PATH=%SCRIPT_DIR%SentinelAgent.py"
) else (
    echo [ERROR] sentinel_agent.py not found in %SCRIPT_DIR%
    echo Please ensure the Python script is in the same folder as this batch file.
    pause
    exit /b 1
)

echo [INFO] Found agent at: %AGENT_PATH%
echo.

:: Prompt for server URL
set "DEFAULT_SERVER=https://pnd53b48j7.us-east-1.awsapprunner.com"
set /p SERVER_URL="Enter server URL [%DEFAULT_SERVER%]: "
if "%SERVER_URL%"=="" set "SERVER_URL=%DEFAULT_SERVER%"

echo.
echo ============================================
echo   Starting Sentinel Agent
echo   Server: %SERVER_URL%
echo ============================================
echo.

:: Run the agent
python "%AGENT_PATH%" --server "%SERVER_URL%"

echo.
echo Agent execution completed.
pause
