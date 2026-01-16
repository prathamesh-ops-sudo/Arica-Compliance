@echo off
setlocal enabledelayedexpansion

:: Enable ANSI colors for Windows 10+
for /F "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
if "%VERSION%" GEQ "10.0" (
    reg add HKCU\Console /v VirtualTerminalLevel /t REG_DWORD /d 1 /f >nul 2>&1
)

:: Color codes (ANSI)
set "ESC="
set "GREEN=%ESC%[92m"
set "RED=%ESC%[91m"
set "YELLOW=%ESC%[93m"
set "CYAN=%ESC%[96m"
set "WHITE=%ESC%[97m"
set "RESET=%ESC%[0m"

:: Get script directory
set "SCRIPT_DIR=%~dp0"
set "CONFIG_FILE=%SCRIPT_DIR%config.ini"
set "AGENT_SCRIPT=%SCRIPT_DIR%arica_toucan_agent.py"

:: Default server URL
set "DEFAULT_SERVER=https://2qgna3qtsq.us-east-1.awsapprunner.com"

:: Load config if exists
if exist "%CONFIG_FILE%" (
    for /f "tokens=1,2 delims==" %%a in ('type "%CONFIG_FILE%" ^| findstr /i "server_url"') do (
        set "SERVER_URL=%%b"
    )
)
if not defined SERVER_URL set "SERVER_URL=%DEFAULT_SERVER%"

:MAIN_MENU
cls
echo.
echo %CYAN%============================================================%RESET%
echo %CYAN%      _    ____  ___ ____    _      _____ ___  _   _  ____   %RESET%
echo %CYAN%     / \  |  _ \|_ _/ ___|  / \    |_   _/ _ \| | | |/ ___|  %RESET%
echo %CYAN%    / _ \ | |_) || | |     / _ \     | || | | | | | | |      %RESET%
echo %CYAN%   / ___ \|  _ < | | |___ / ___ \    | || |_| | |_| | |___   %RESET%
echo %CYAN%  /_/   \_\_| \_\___\____/_/   \_\   |_| \___/ \___/ \____|  %RESET%
echo %CYAN%                                                             %RESET%
echo %CYAN%       AI-Powered Compliance ^& Audit Desktop Agent          %RESET%
echo %CYAN%============================================================%RESET%
echo.
echo   Current Server: %YELLOW%%SERVER_URL%%RESET%
echo.
echo   %WHITE%[1]%RESET% Run Full Audit (System Scan + Questionnaire)
echo   %WHITE%[2]%RESET% Run System Scan Only
echo   %WHITE%[3]%RESET% Dry Run (Test without uploading)
echo   %WHITE%[4]%RESET% Configure Server URL
echo   %WHITE%[5]%RESET% Install/Verify Dependencies
echo   %WHITE%[6]%RESET% View Help
echo   %WHITE%[7]%RESET% Exit
echo.
set /p "CHOICE=%WHITE%Select an option (1-7): %RESET%"

if "%CHOICE%"=="1" goto FULL_AUDIT
if "%CHOICE%"=="2" goto SYSTEM_SCAN
if "%CHOICE%"=="3" goto DRY_RUN
if "%CHOICE%"=="4" goto CONFIGURE_SERVER
if "%CHOICE%"=="5" goto INSTALL_DEPS
if "%CHOICE%"=="6" goto SHOW_HELP
if "%CHOICE%"=="7" goto EXIT_AGENT

echo.
echo %RED%[ERROR] Invalid option. Please select 1-7.%RESET%
timeout /t 2 >nul
goto MAIN_MENU

:CHECK_PYTHON
:: Try 'python' first
python --version >nul 2>&1
if %errorlevel% equ 0 (
    set "PYTHON_CMD=python"
    goto :eof
)

:: Try 'py -3' as fallback
py -3 --version >nul 2>&1
if %errorlevel% equ 0 (
    set "PYTHON_CMD=py -3"
    goto :eof
)

:: Python not found
set "PYTHON_CMD="
goto :eof

:CHECK_ADMIN
net session >nul 2>&1
if %errorlevel% equ 0 (
    set "IS_ADMIN=1"
) else (
    set "IS_ADMIN=0"
)
goto :eof

:FULL_AUDIT
cls
echo.
echo %CYAN%============================================================%RESET%
echo %CYAN%                    FULL AUDIT MODE                         %RESET%
echo %CYAN%============================================================%RESET%
echo.

call :CHECK_PYTHON
if not defined PYTHON_CMD (
    echo %RED%[ERROR] Python is not installed or not in PATH.%RESET%
    echo.
    echo Please install Python 3.8+ from https://python.org
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    goto MAIN_MENU
)

call :CHECK_ADMIN
if "%IS_ADMIN%"=="0" (
    echo %YELLOW%[WARNING] Running without administrator privileges.%RESET%
    echo %YELLOW%          Some security checks may be limited.%RESET%
    echo.
)

echo %GREEN%[OK]%RESET% Python found: %PYTHON_CMD%
echo %GREEN%[INFO]%RESET% Starting full audit with questionnaire...
echo %GREEN%[INFO]%RESET% Server: %SERVER_URL%
echo.

:: Check if agent script exists
if not exist "%AGENT_SCRIPT%" (
    echo %RED%[ERROR] Agent script not found: %AGENT_SCRIPT%%RESET%
    pause
    goto MAIN_MENU
)

%PYTHON_CMD% "%AGENT_SCRIPT%" --server "%SERVER_URL%" --questionnaire

echo.
echo %CYAN%============================================================%RESET%
echo %GREEN%                    Audit Complete                          %RESET%
echo %CYAN%============================================================%RESET%
echo.
pause
goto MAIN_MENU

:SYSTEM_SCAN
cls
echo.
echo %CYAN%============================================================%RESET%
echo %CYAN%                  SYSTEM SCAN ONLY                          %RESET%
echo %CYAN%============================================================%RESET%
echo.

call :CHECK_PYTHON
if not defined PYTHON_CMD (
    echo %RED%[ERROR] Python is not installed or not in PATH.%RESET%
    echo.
    echo Please install Python 3.8+ from https://python.org
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    goto MAIN_MENU
)

call :CHECK_ADMIN
if "%IS_ADMIN%"=="0" (
    echo %YELLOW%[WARNING] Running without administrator privileges.%RESET%
    echo %YELLOW%          Some security checks may be limited.%RESET%
    echo.
)

echo %GREEN%[OK]%RESET% Python found: %PYTHON_CMD%
echo %GREEN%[INFO]%RESET% Starting system scan (no questionnaire)...
echo %GREEN%[INFO]%RESET% Server: %SERVER_URL%
echo.

if not exist "%AGENT_SCRIPT%" (
    echo %RED%[ERROR] Agent script not found: %AGENT_SCRIPT%%RESET%
    pause
    goto MAIN_MENU
)

%PYTHON_CMD% "%AGENT_SCRIPT%" --server "%SERVER_URL%" --scan-only

echo.
pause
goto MAIN_MENU

:DRY_RUN
cls
echo.
echo %CYAN%============================================================%RESET%
echo %CYAN%                      DRY RUN MODE                          %RESET%
echo %CYAN%============================================================%RESET%
echo.
echo %YELLOW%[INFO] This mode collects data but does NOT upload to server.%RESET%
echo.

call :CHECK_PYTHON
if not defined PYTHON_CMD (
    echo %RED%[ERROR] Python is not installed or not in PATH.%RESET%
    echo.
    echo Please install Python 3.8+ from https://python.org
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    goto MAIN_MENU
)

echo %GREEN%[OK]%RESET% Python found: %PYTHON_CMD%
echo %GREEN%[INFO]%RESET% Starting dry run...
echo.

if not exist "%AGENT_SCRIPT%" (
    echo %RED%[ERROR] Agent script not found: %AGENT_SCRIPT%%RESET%
    pause
    goto MAIN_MENU
)

%PYTHON_CMD% "%AGENT_SCRIPT%" --server "%SERVER_URL%" --dry-run

echo.
pause
goto MAIN_MENU

:CONFIGURE_SERVER
cls
echo.
echo %CYAN%============================================================%RESET%
echo %CYAN%                 CONFIGURE SERVER URL                       %RESET%
echo %CYAN%============================================================%RESET%
echo.
echo   Current Server: %YELLOW%%SERVER_URL%%RESET%
echo   Default Server: %DEFAULT_SERVER%
echo.
echo   Enter new server URL or press Enter to keep current:
echo.
set /p "NEW_SERVER=Server URL: "

if not "%NEW_SERVER%"=="" (
    set "SERVER_URL=%NEW_SERVER%"
    
    :: Save to config file
    echo [Settings]> "%CONFIG_FILE%"
    echo server_url=%NEW_SERVER%>> "%CONFIG_FILE%"
    
    echo.
    echo %GREEN%[OK] Server URL updated and saved to config.ini%RESET%
) else (
    echo.
    echo %YELLOW%[INFO] Server URL unchanged.%RESET%
)

echo.
pause
goto MAIN_MENU

:INSTALL_DEPS
cls
echo.
echo %CYAN%============================================================%RESET%
echo %CYAN%              INSTALL/VERIFY DEPENDENCIES                   %RESET%
echo %CYAN%============================================================%RESET%
echo.

call :CHECK_PYTHON
if not defined PYTHON_CMD (
    echo %RED%[ERROR] Python is not installed or not in PATH.%RESET%
    echo.
    echo Please install Python 3.8+ from https://python.org
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    goto MAIN_MENU
)

echo %GREEN%[OK]%RESET% Python found: %PYTHON_CMD%
echo.
echo %CYAN%[INFO] Checking and installing required packages...%RESET%
echo.

:: Check/Install requests
echo Checking requests...
%PYTHON_CMD% -m pip show requests >nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%[INFO] Installing requests...%RESET%
    %PYTHON_CMD% -m pip install requests
    if %errorlevel% neq 0 (
        echo %RED%[ERROR] Failed to install requests.%RESET%
        pause
        goto MAIN_MENU
    )
    echo %GREEN%[OK] requests installed.%RESET%
) else (
    echo %GREEN%[OK] requests already installed.%RESET%
)

:: Check/Install psutil
echo Checking psutil...
%PYTHON_CMD% -m pip show psutil >nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%[INFO] Installing psutil...%RESET%
    %PYTHON_CMD% -m pip install psutil
    if %errorlevel% neq 0 (
        echo %RED%[ERROR] Failed to install psutil.%RESET%
        pause
        goto MAIN_MENU
    )
    echo %GREEN%[OK] psutil installed.%RESET%
) else (
    echo %GREEN%[OK] psutil already installed.%RESET%
)

:: Check Tkinter (built-in, just verify)
echo Checking tkinter...
%PYTHON_CMD% -c "import tkinter" >nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%[WARNING] tkinter not available. GUI questionnaire may not work.%RESET%
    echo %YELLOW%          tkinter is usually included with Python on Windows.%RESET%
) else (
    echo %GREEN%[OK] tkinter available.%RESET%
)

echo.
echo %GREEN%============================================================%RESET%
echo %GREEN%           All dependencies verified successfully!          %RESET%
echo %GREEN%============================================================%RESET%
echo.
pause
goto MAIN_MENU

:SHOW_HELP
cls
echo.
echo %CYAN%============================================================%RESET%
echo %CYAN%                    ARICA TOUCAN HELP                       %RESET%
echo %CYAN%============================================================%RESET%
echo.
echo   %WHITE%ABOUT%RESET%
echo   -----
echo   Arica Toucan Desktop Agent collects system security information
echo   and compliance questionnaire responses for ISO 27001/27002 audits.
echo.
echo   %WHITE%MENU OPTIONS%RESET%
echo   ------------
echo   %CYAN%[1] Full Audit%RESET%
echo       Collects system data AND launches the compliance questionnaire.
echo       This is the recommended option for complete audits.
echo.
echo   %CYAN%[2] System Scan Only%RESET%
echo       Collects system data without the questionnaire.
echo       Use this for quick technical assessments.
echo.
echo   %CYAN%[3] Dry Run%RESET%
echo       Tests data collection without uploading to server.
echo       Useful for verifying the agent works correctly.
echo.
echo   %CYAN%[4] Configure Server%RESET%
echo       Change the server URL. Settings are saved to config.ini.
echo.
echo   %CYAN%[5] Install Dependencies%RESET%
echo       Installs required Python packages (requests, psutil).
echo.
echo   %WHITE%REQUIREMENTS%RESET%
echo   ------------
echo   - Python 3.8 or higher
echo   - Windows 10/11 (some features require admin rights)
echo   - Internet connection to upload audit data
echo.
echo   %WHITE%SUPPORT%RESET%
echo   -------
echo   For assistance, contact your Arica Toucan administrator.
echo.
pause
goto MAIN_MENU

:EXIT_AGENT
cls
echo.
echo %CYAN%============================================================%RESET%
echo %GREEN%        Thank you for using Arica Toucan Desktop Agent      %RESET%
echo %CYAN%============================================================%RESET%
echo.
timeout /t 2 >nul
exit /b 0
