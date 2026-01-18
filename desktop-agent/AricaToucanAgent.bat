@echo off
setlocal EnableDelayedExpansion

:: ============================================================================
:: Arica Toucan Desktop Agent - Enhanced Launcher
:: AI-Powered Compliance & Audit Platform
:: ============================================================================

title Arica Toucan Desktop Agent

:: Configuration file
set "CONFIG_FILE=%~dp0config.ini"
set "DEFAULT_SERVER=https://2qgna3qtsq.us-east-1.awsapprunner.com"

:: Initialize variables
set "PYTHON_CMD="
set "SERVER_URL="

:: Load configuration
call :LoadConfig

:: Detect Python
call :DetectPython
if "!PYTHON_CMD!"=="" (
    echo.
    echo [ERROR] Python not found!
    echo.
    echo Please install Python 3.8+ from https://python.org
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

:MainMenu
cls
echo.
echo  _______________________________________________________________
echo ^|                                                               ^|
echo ^|     _    ____  ___ ____    _      _____ ___  _   _  ____    _   ^|
echo ^|    / \  ^|  _ \^|_ _/ ___^|  / \    ^|_   _^/ _ \^| ^| ^| ^|/ ___^|  / \  ^|
echo ^|   / _ \ ^| ^|_) ^|^| ^| ^|     / _ \     ^| ^|^| ^| ^| ^| ^| ^| ^| ^|     / _ \ ^|
echo ^|  / ___ \^|  _ ^< ^| ^| ^|___ / ___ \    ^| ^|^| ^|_^| ^| ^|_^| ^| ^|___ / ___ \^|
echo ^| /_/   \_\_^| \_\___\____/_/   \_\   ^|_^| \___/ \___/ \____/_/   \_\^|
echo ^|                                                               ^|
echo ^|          AI-Powered Compliance ^& Audit Platform              ^|
echo ^|_______________________________________________________________^|
echo.
echo   Server: !SERVER_URL!
echo   Python: !PYTHON_CMD!
echo.
echo   ============== MAIN MENU ==============
echo.
echo   [1] Run Full Audit (System Scan + Questionnaire)
echo   [2] Run System Scan Only
echo   [3] Run Questionnaire Only (requires Audit ID)
echo   [4] Dry Run (Test without uploading)
echo   [5] Configure Server URL
echo   [6] Install/Verify Dependencies
echo   [7] View Help
echo   [8] Exit
echo.
echo   ========================================
echo.
set /p "CHOICE=  Enter your choice [1-8]: "

if "%CHOICE%"=="1" goto RunFullAudit
if "%CHOICE%"=="2" goto RunSystemScan
if "%CHOICE%"=="3" goto RunQuestionnaire
if "%CHOICE%"=="4" goto DryRun
if "%CHOICE%"=="5" goto ConfigureServer
if "%CHOICE%"=="6" goto InstallDeps
if "%CHOICE%"=="7" goto ShowHelp
if "%CHOICE%"=="8" goto ExitApp

echo.
echo   Invalid choice. Please try again.
timeout /t 2 >nul
goto MainMenu

:: ============================================================================
:: RUN FULL AUDIT
:: ============================================================================
:RunFullAudit
cls
echo.
echo   =========================================
echo    RUNNING FULL AUDIT
echo    System Scan + Compliance Questionnaire
echo   =========================================
echo.
echo   [*] Starting system data collection...
echo.

"!PYTHON_CMD!" "%~dp0arica_toucan_agent.py" --server "!SERVER_URL!" --mode full

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo   [!] Audit failed with error code: %ERRORLEVEL%
) else (
    echo.
    echo   [+] Full audit completed successfully!
)

echo.
pause
goto MainMenu

:: ============================================================================
:: RUN SYSTEM SCAN ONLY
:: ============================================================================
:RunSystemScan
cls
echo.
echo   =========================================
echo    RUNNING SYSTEM SCAN ONLY
echo   =========================================
echo.
echo   [*] Starting system data collection...
echo.

"!PYTHON_CMD!" "%~dp0arica_toucan_agent.py" --server "!SERVER_URL!" --mode system

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo   [!] Scan failed with error code: %ERRORLEVEL%
) else (
    echo.
    echo   [+] System scan completed successfully!
)

echo.
pause
goto MainMenu

:: ============================================================================
:: RUN QUESTIONNAIRE ONLY
:: ============================================================================
:RunQuestionnaire
cls
echo.
echo   =========================================
echo    COMPLIANCE QUESTIONNAIRE
echo   =========================================
echo.
set /p "AUDIT_ID=  Enter Audit ID: "

if "!AUDIT_ID!"=="" (
    echo.
    echo   [!] Audit ID is required.
    pause
    goto MainMenu
)

echo.
echo   [*] Launching questionnaire for Audit ID: !AUDIT_ID!
echo.

"!PYTHON_CMD!" "%~dp0arica_toucan_agent.py" --server "!SERVER_URL!" --mode questionnaire --audit-id "!AUDIT_ID!"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo   [!] Questionnaire failed with error code: %ERRORLEVEL%
) else (
    echo.
    echo   [+] Questionnaire completed successfully!
)

echo.
pause
goto MainMenu

:: ============================================================================
:: DRY RUN
:: ============================================================================
:DryRun
cls
echo.
echo   =========================================
echo    DRY RUN MODE
echo    Testing without uploading to server
echo   =========================================
echo.
echo   [*] Collecting system data (dry run)...
echo.

"!PYTHON_CMD!" "%~dp0arica_toucan_agent.py" --dry-run

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo   [!] Dry run failed with error code: %ERRORLEVEL%
) else (
    echo.
    echo   [+] Dry run completed. No data was uploaded.
)

echo.
pause
goto MainMenu

:: ============================================================================
:: CONFIGURE SERVER
:: ============================================================================
:ConfigureServer
cls
echo.
echo   =========================================
echo    CONFIGURE SERVER URL
echo   =========================================
echo.
echo   Current server: !SERVER_URL!
echo.
echo   Enter new server URL (or press Enter to keep current):
echo.
set /p "NEW_SERVER=  Server URL: "

if not "!NEW_SERVER!"=="" (
    set "SERVER_URL=!NEW_SERVER!"
    call :SaveConfig
    echo.
    echo   [+] Server URL updated to: !SERVER_URL!
) else (
    echo.
    echo   [*] Server URL unchanged.
)

echo.
pause
goto MainMenu

:: ============================================================================
:: INSTALL DEPENDENCIES
:: ============================================================================
:InstallDeps
cls
echo.
echo   =========================================
echo    INSTALL/VERIFY DEPENDENCIES
echo   =========================================
echo.
echo   [*] Checking Python version...
"!PYTHON_CMD!" --version
echo.

echo   [*] Installing required packages...
echo.
"!PYTHON_CMD!" -m pip install --upgrade pip
"!PYTHON_CMD!" -m pip install requests psutil

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo   [!] Failed to install some packages.
    echo   Try running as Administrator.
) else (
    echo.
    echo   [+] All dependencies installed successfully!
)

echo.
pause
goto MainMenu

:: ============================================================================
:: SHOW HELP
:: ============================================================================
:ShowHelp
cls
echo.
echo   =========================================
echo    ARICA TOUCAN AGENT - HELP
echo   =========================================
echo.
echo   OVERVIEW
echo   This agent collects system security data and compliance
echo   questionnaire responses for ISO 27001/27002 audit scoring.
echo.
echo   MENU OPTIONS
echo.
echo   [1] Run Full Audit
echo       Collects system data AND launches the graphical
echo       compliance questionnaire. Recommended for complete audits.
echo.
echo   [2] Run System Scan Only
echo       Collects only technical system data (firewall, antivirus,
echo       encryption, user accounts). No questionnaire.
echo.
echo   [3] Run Questionnaire Only
echo       Launch the compliance questionnaire for an existing audit.
echo       Requires a valid Audit ID from a previous scan.
echo.
echo   [4] Dry Run
echo       Test the agent without uploading data to the server.
echo       Useful for verifying the agent works correctly.
echo.
echo   [5] Configure Server URL
echo       Change the server URL for the audit platform.
echo.
echo   [6] Install/Verify Dependencies
echo       Install or update required Python packages.
echo.
echo   REQUIREMENTS
echo   - Python 3.8 or higher
echo   - Internet connection to reach the audit server
echo   - Some features may require Administrator privileges
echo.
echo   SUPPORT
echo   For issues, contact your IT administrator or visit
echo   the Arica Toucan admin dashboard.
echo.
pause
goto MainMenu

:: ============================================================================
:: EXIT
:: ============================================================================
:ExitApp
cls
echo.
echo   Thank you for using Arica Toucan!
echo.
timeout /t 2 >nul
exit /b 0

:: ============================================================================
:: FUNCTIONS
:: ============================================================================

:DetectPython
:: Try 'python' first
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('where python') do (
        set "PYTHON_CMD=%%i"
        goto :eof
    )
)

:: Try 'py -3' (Python Launcher)
where py >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_CMD=py -3"
    goto :eof
)

:: Try 'python3'
where python3 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('where python3') do (
        set "PYTHON_CMD=%%i"
        goto :eof
    )
)

:: Check common installation paths
if exist "C:\Python312\python.exe" (
    set "PYTHON_CMD=C:\Python312\python.exe"
    goto :eof
)
if exist "C:\Python311\python.exe" (
    set "PYTHON_CMD=C:\Python311\python.exe"
    goto :eof
)
if exist "C:\Python310\python.exe" (
    set "PYTHON_CMD=C:\Python310\python.exe"
    goto :eof
)
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set "PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    goto :eof
)
if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    set "PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
    goto :eof
)

goto :eof

:LoadConfig
if exist "!CONFIG_FILE!" (
    for /f "tokens=1,2 delims==" %%a in (!CONFIG_FILE!) do (
        if "%%a"=="SERVER_URL" set "SERVER_URL=%%b"
    )
)
if "!SERVER_URL!"=="" set "SERVER_URL=!DEFAULT_SERVER!"
goto :eof

:SaveConfig
echo SERVER_URL=!SERVER_URL!> "!CONFIG_FILE!"
goto :eof
