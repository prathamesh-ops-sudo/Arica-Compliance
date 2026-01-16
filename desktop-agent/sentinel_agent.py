#!/usr/bin/env python3
"""
Project Sentinel - Desktop Audit Agent
=======================================

This script collects system information for compliance auditing.
It gathers OS details, security status, and user access controls,
then submits the data to the Project Sentinel API.

Requirements:
    pip install requests psutil

Usage:
    python sentinel_agent.py --server https://your-sentinel-server.com

To build as EXE (Windows):
    pip install pyinstaller
    pyinstaller --onefile --name SentinelAgent sentinel_agent.py
"""

import argparse
import json
import platform
import socket
import subprocess
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional

try:
    import requests
except ImportError:
    print("ERROR: requests library required. Install with: pip install requests")
    sys.exit(1)

try:
    import psutil
except ImportError:
    psutil = None
    print("WARNING: psutil not available. Some features will be limited.")


def get_os_info() -> Dict[str, str]:
    """Collect operating system information."""
    return {
        "osName": f"{platform.system()} {platform.release()}",
        "osVersion": platform.version(),
        "osPlatform": sys.platform,
    }


def check_firewall_status() -> Dict[str, Any]:
    """Check firewall status based on OS."""
    result = {"firewallEnabled": False, "firewallStatus": "Unknown"}
    
    system = platform.system().lower()
    
    if system == "windows":
        try:
            output = subprocess.check_output(
                ["netsh", "advfirewall", "show", "currentprofile", "state"],
                stderr=subprocess.DEVNULL,
                timeout=10
            ).decode()
            if "ON" in output.upper():
                result["firewallEnabled"] = True
                result["firewallStatus"] = "Windows Firewall Active"
            else:
                result["firewallStatus"] = "Windows Firewall Disabled"
        except Exception:
            result["firewallStatus"] = "Unable to determine"
    
    elif system == "darwin":
        try:
            output = subprocess.check_output(
                ["/usr/libexec/ApplicationFirewall/socketfilterfw", "--getglobalstate"],
                stderr=subprocess.DEVNULL,
                timeout=10
            ).decode()
            if "enabled" in output.lower():
                result["firewallEnabled"] = True
                result["firewallStatus"] = "macOS Firewall Enabled"
            else:
                result["firewallStatus"] = "macOS Firewall Disabled"
        except Exception:
            result["firewallStatus"] = "Unable to determine"
    
    elif system == "linux":
        try:
            output = subprocess.check_output(
                ["ufw", "status"],
                stderr=subprocess.DEVNULL,
                timeout=10
            ).decode()
            if "active" in output.lower():
                result["firewallEnabled"] = True
                result["firewallStatus"] = "UFW Firewall Active"
            else:
                result["firewallStatus"] = "UFW Firewall Inactive"
        except Exception:
            try:
                subprocess.check_output(
                    ["iptables", "-L", "-n"],
                    stderr=subprocess.DEVNULL,
                    timeout=10
                )
                result["firewallEnabled"] = True
                result["firewallStatus"] = "iptables configured"
            except Exception:
                result["firewallStatus"] = "No firewall detected"
    
    return result


def check_antivirus_status() -> Dict[str, Any]:
    """Check antivirus/endpoint protection status."""
    result = {
        "antivirusInstalled": False,
        "antivirusName": None,
        "antivirusStatus": "Not detected"
    }
    
    system = platform.system().lower()
    
    if system == "windows":
        try:
            import winreg
            key = winreg.OpenKey(
                winreg.HKEY_LOCAL_MACHINE,
                r"SOFTWARE\Microsoft\Windows Defender\Real-Time Protection"
            )
            disabled, _ = winreg.QueryValueEx(key, "DisableRealtimeMonitoring")
            winreg.CloseKey(key)
            
            if not disabled:
                result["antivirusInstalled"] = True
                result["antivirusName"] = "Windows Defender"
                result["antivirusStatus"] = "Real-time protection enabled"
            else:
                result["antivirusStatus"] = "Windows Defender disabled"
        except Exception:
            result["antivirusStatus"] = "Unable to determine antivirus status"
    
    elif system == "darwin":
        result["antivirusInstalled"] = True
        result["antivirusName"] = "XProtect (Built-in)"
        result["antivirusStatus"] = "macOS built-in protection active"
    
    elif system == "linux":
        av_tools = [
            ("clamav", "ClamAV"),
            ("sophos", "Sophos"),
            ("crowdstrike", "CrowdStrike Falcon"),
        ]
        
        for tool, name in av_tools:
            try:
                subprocess.check_output(
                    ["which", tool],
                    stderr=subprocess.DEVNULL,
                    timeout=5
                )
                result["antivirusInstalled"] = True
                result["antivirusName"] = name
                result["antivirusStatus"] = f"{name} installed"
                break
            except Exception:
                continue
        
        if not result["antivirusInstalled"]:
            result["antivirusStatus"] = "No antivirus detected"
    
    return result


def check_disk_encryption() -> Dict[str, Any]:
    """Check disk encryption status."""
    result = {
        "diskEncryptionEnabled": False,
        "diskEncryptionMethod": None
    }
    
    system = platform.system().lower()
    
    if system == "windows":
        try:
            output = subprocess.check_output(
                ["manage-bde", "-status", "C:"],
                stderr=subprocess.DEVNULL,
                timeout=15
            ).decode()
            if "Protection On" in output or "Percentage Encrypted" in output:
                result["diskEncryptionEnabled"] = True
                result["diskEncryptionMethod"] = "BitLocker"
        except Exception:
            pass
    
    elif system == "darwin":
        try:
            output = subprocess.check_output(
                ["fdesetup", "status"],
                stderr=subprocess.DEVNULL,
                timeout=10
            ).decode()
            if "FileVault is On" in output:
                result["diskEncryptionEnabled"] = True
                result["diskEncryptionMethod"] = "FileVault"
        except Exception:
            pass
    
    elif system == "linux":
        try:
            output = subprocess.check_output(
                ["lsblk", "-o", "NAME,TYPE,MOUNTPOINT"],
                stderr=subprocess.DEVNULL,
                timeout=10
            ).decode()
            if "crypt" in output:
                result["diskEncryptionEnabled"] = True
                result["diskEncryptionMethod"] = "LUKS/dm-crypt"
        except Exception:
            pass
    
    return result


def get_user_accounts() -> List[Dict[str, Any]]:
    """Get list of user accounts."""
    users = []
    system = platform.system().lower()
    
    if system == "windows":
        try:
            output = subprocess.check_output(
                ["net", "user"],
                stderr=subprocess.DEVNULL,
                timeout=10
            ).decode()
            lines = output.split('\n')
            for line in lines:
                if line.strip() and not line.startswith('-') and not line.startswith('User') and not line.startswith('The'):
                    for username in line.split():
                        if username.strip():
                            is_admin = False
                            try:
                                admin_output = subprocess.check_output(
                                    ["net", "localgroup", "Administrators"],
                                    stderr=subprocess.DEVNULL,
                                    timeout=10
                                ).decode()
                                is_admin = username in admin_output
                            except Exception:
                                pass
                            
                            users.append({
                                "username": username,
                                "isAdmin": is_admin,
                                "lastLogin": None
                            })
        except Exception:
            pass
    
    elif system in ["darwin", "linux"]:
        try:
            with open("/etc/passwd", "r") as f:
                for line in f:
                    parts = line.strip().split(":")
                    if len(parts) >= 7:
                        username = parts[0]
                        uid = int(parts[2])
                        shell = parts[6]
                        
                        if uid >= 1000 or uid == 0:
                            if shell not in ["/usr/sbin/nologin", "/bin/false", "/sbin/nologin"]:
                                is_admin = uid == 0 or uid in [501, 1000]
                                users.append({
                                    "username": username,
                                    "isAdmin": is_admin,
                                    "lastLogin": None
                                })
        except Exception:
            pass
    
    if not users:
        import getpass
        users.append({
            "username": getpass.getuser(),
            "isAdmin": True,
            "lastLogin": datetime.now().isoformat()
        })
    
    return users


def get_network_info() -> Dict[str, Any]:
    """Collect network information."""
    hostname = socket.gethostname()
    ip_addresses = []
    
    try:
        ip_addresses.append(socket.gethostbyname(hostname))
    except Exception:
        pass
    
    if psutil:
        try:
            for iface, addrs in psutil.net_if_addrs().items():
                for addr in addrs:
                    if addr.family == socket.AF_INET:
                        if addr.address not in ip_addresses:
                            ip_addresses.append(addr.address)
        except Exception:
            pass
    
    return {
        "hostname": hostname,
        "ipAddresses": ip_addresses
    }


def collect_system_data() -> Dict[str, Any]:
    """Collect all system data for audit."""
    print("\n[*] Collecting system information...")
    
    print("    - Operating system details...")
    os_info = get_os_info()
    
    print("    - Firewall status...")
    firewall = check_firewall_status()
    
    print("    - Antivirus/endpoint protection...")
    antivirus = check_antivirus_status()
    
    print("    - Disk encryption...")
    encryption = check_disk_encryption()
    
    print("    - User accounts...")
    users = get_user_accounts()
    
    print("    - Network information...")
    network = get_network_info()
    
    return {
        **os_info,
        **firewall,
        **antivirus,
        **encryption,
        "userAccounts": users,
        "networkInfo": network,
        "collectedAt": datetime.now().isoformat()
    }


def create_audit(server_url: str) -> Optional[str]:
    """Create a new audit on the server."""
    try:
        response = requests.post(
            f"{server_url}/api/audit/create",
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        return data.get("auditId")
    except Exception as e:
        print(f"\n[!] Failed to create audit: {e}")
        return None


def upload_system_data(server_url: str, audit_id: str, system_data: Dict[str, Any]) -> bool:
    """Upload system data to the server."""
    try:
        response = requests.post(
            f"{server_url}/api/audit/upload-system-data",
            json={
                "auditId": audit_id,
                "systemData": system_data
            },
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        response.raise_for_status()
        return True
    except Exception as e:
        print(f"\n[!] Failed to upload data: {e}")
        return False


def print_banner():
    """Print the application banner."""
    banner = """
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║     ██████╗ ██████╗  ██████╗      ██╗███████╗ ██████╗████████╗ ║
    ║     ██╔══██╗██╔══██╗██╔═══██╗     ██║██╔════╝██╔════╝╚══██╔══╝ ║
    ║     ██████╔╝██████╔╝██║   ██║     ██║█████╗  ██║        ██║    ║
    ║     ██╔═══╝ ██╔══██╗██║   ██║██   ██║██╔══╝  ██║        ██║    ║
    ║     ██║     ██║  ██║╚██████╔╝╚█████╔╝███████╗╚██████╗   ██║    ║
    ║     ╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚════╝ ╚══════╝ ╚═════╝   ╚═╝    ║
    ║                                                               ║
    ║              ███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗ ║
    ║              ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║ ║
    ║              ███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║ ║
    ║              ╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║ ║
    ║              ███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║ ║
    ║              ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝ ║
    ║                                                               ║
    ║           AI-Powered Compliance & Audit Platform              ║
    ║                     Desktop Audit Agent                       ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """
    print(banner)


def main():
    parser = argparse.ArgumentParser(
        description="Project Sentinel Desktop Audit Agent"
    )
    parser.add_argument(
        "--server",
        required=True,
        help="Server URL (e.g., https://your-sentinel-server.com)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Collect data without uploading (for testing)"
    )
    
    args = parser.parse_args()
    server_url = args.server.rstrip("/")
    
    print_banner()
    
    system_data = collect_system_data()
    
    print("\n[*] System data collected successfully!")
    print(f"    OS: {system_data['osName']} ({system_data['osVersion']})")
    print(f"    Firewall: {'Enabled' if system_data['firewallEnabled'] else 'Disabled'}")
    print(f"    Antivirus: {system_data.get('antivirusName', 'Not detected')}")
    print(f"    Disk Encryption: {'Enabled' if system_data['diskEncryptionEnabled'] else 'Disabled'}")
    print(f"    User Accounts: {len(system_data['userAccounts'])}")
    
    if args.dry_run:
        print("\n[*] Dry run mode - data not uploaded")
        print("\nCollected data:")
        print(json.dumps(system_data, indent=2))
        return
    
    print(f"\n[*] Connecting to server: {server_url}")
    
    print("[*] Creating audit record...")
    audit_id = create_audit(server_url)
    
    if not audit_id:
        print("\n[!] Failed to create audit. Please check server connection.")
        input("\nPress Enter to exit...")
        sys.exit(1)
    
    print(f"[*] Audit ID: {audit_id[:8].upper()}")
    
    print("[*] Uploading system data...")
    success = upload_system_data(server_url, audit_id, system_data)
    
    if success:
        print("\n" + "=" * 60)
        print("\n  AUDIT COMPLETED SUCCESSFULLY!")
        print(f"\n  Your Audit ID is: {audit_id[:8].upper()}")
        print("\n  IMPORTANT: Save this ID!")
        print("  You will need it to access your compliance report.")
        print("\n  Contact the provider to unlock your report")
        print("  and receive your AI-powered compliance analysis.")
        print("\n" + "=" * 60)
    else:
        print("\n[!] Failed to upload system data.")
        print("    Please contact support with your Audit ID.")
    
    input("\nPress Enter to exit...")


if __name__ == "__main__":
    main()
