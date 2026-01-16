# Arica Toucan Desktop Audit Agent

A lightweight Python-based desktop agent that collects system security information for compliance auditing.

## Features

- **OS Detection**: Identifies operating system name, version, and platform
- **Firewall Status**: Checks if host firewall is enabled (Windows, macOS, Linux)
- **Antivirus Detection**: Detects installed antivirus/endpoint protection
- **Disk Encryption**: Checks for BitLocker, FileVault, or LUKS encryption
- **User Accounts**: Lists local user accounts and identifies administrators
- **Network Info**: Collects hostname and IP addresses

## Requirements

```bash
pip install requests psutil
```

## Usage

### Basic Usage

```bash
python arica_toucan_agent.py --server https://your-arica-toucan-server.com
```

### Dry Run (Testing)

```bash
python arica_toucan_agent.py --server https://example.com --dry-run
```

This will collect and display system data without uploading.

## Building as Windows EXE

1. Install PyInstaller:
```bash
pip install pyinstaller
```

2. Build the executable:
```bash
pyinstaller --onefile --name AricaToucanAgent arica_toucan_agent.py
```

3. The EXE will be created in the `dist/` folder.

### Advanced Build Options

For a cleaner EXE without console window (GUI mode):
```bash
pyinstaller --onefile --noconsole --name AricaToucanAgent arica_toucan_agent.py
```

With custom icon:
```bash
pyinstaller --onefile --icon=aricatoucan.ico --name AricaToucanAgent arica_toucan_agent.py
```

## Data Collected

The agent collects the following information:

| Category | Data Points |
|----------|-------------|
| OS | Name, Version, Platform |
| Firewall | Enabled/Disabled, Status |
| Antivirus | Installed, Name, Status |
| Encryption | Enabled/Disabled, Method |
| Users | Username, Admin status, Last login |
| Network | Hostname, IP addresses |

## Security Notes

- The agent does NOT access any personal files
- The agent does NOT collect passwords or credentials
- The agent does NOT run any modifications to your system
- All data is transmitted securely to the server
- The agent only reads system configuration status

## Audit Process

1. Run the agent on your system
2. The agent generates a unique Audit ID
3. System data is uploaded to the server
4. Your audit is LOCKED pending payment
5. Contact the provider to unlock your report
6. Receive your AI-powered compliance analysis

## Troubleshooting

### Windows Smart App Control Blocking the Batch File

If Windows Smart App Control blocks `AricaToucanAgent.bat`, follow these steps:

**Option 1: Unblock the File (Recommended)**
1. Right-click on `AricaToucanAgent.bat`
2. Select **Properties**
3. At the bottom of the **General** tab, check the **Unblock** checkbox
4. Click **OK**

**Option 2: Run Python Directly**
Instead of using the batch file, open Command Prompt and run:
```cmd
cd path\to\AricaToucanAgent
python -m pip install requests psutil
python arica_toucan_agent.py --server https://your-server-url.com
```

**Option 3: Use PowerShell**
```powershell
Unblock-File -Path "C:\path\to\AricaToucanAgent.bat"
```

### "Failed to create audit"
- Check your internet connection
- Verify the server URL is correct
- Ensure the server is running

### "Unable to determine" status
- Some checks require administrative privileges
- Run the agent as Administrator (Windows) or with sudo (Linux/macOS)

### psutil not available warning
- Install psutil: `pip install psutil`
- Some network information may be limited without psutil

## License

Copyright 2024 Arica Toucan. All rights reserved.
