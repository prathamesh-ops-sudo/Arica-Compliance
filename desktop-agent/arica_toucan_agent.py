#!/usr/bin/env python3
"""
Arica Toucan - Desktop Audit Agent
===================================

This script collects system information for compliance auditing.
It gathers OS details, security status, and user access controls,
then submits the data to the Arica Toucan API.

Features:
    - System data collection (firewall, antivirus, encryption, users)
    - Graphical compliance questionnaire (Tkinter GUI)
    - ISO 27001/27002 compliance scoring support

Requirements:
    pip install requests psutil

Usage:
    python arica_toucan_agent.py --server https://your-server.com --mode full
    python arica_toucan_agent.py --server https://your-server.com --mode system
    python arica_toucan_agent.py --server https://your-server.com --mode questionnaire --audit-id ABC123

To build as EXE (Windows):
    pip install pyinstaller
    pyinstaller --onefile --name AricaToucanAgent arica_toucan_agent.py
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

try:
    import tkinter as tk
    from tkinter import ttk, messagebox
    HAS_TKINTER = True
except ImportError:
    HAS_TKINTER = False
    print("WARNING: Tkinter not available. GUI questionnaire will be disabled.")


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
        "diskEncryptionEnabled": False
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
    """Get list of user accounts (excludes built-in system accounts)."""
    users = []
    system = platform.system().lower()
    
    # Built-in Windows accounts to exclude (comprehensive list)
    WINDOWS_SYSTEM_ACCOUNTS = {
        'administrator', 'defaultaccount', 'guest', 'wdagutilityaccount',
        'defaultuser0', 'system', 'local service', 'network service',
        'krbtgt', 'defaultapppool', 'aspnet', 'iusr', 'iwam',
        'homegroup', 'mssql', 'mysql', 'postgres', 'oracle',
        'sshd', 'nt authority', 'everyone', 'authenticated users',
        'users', 'guests', 'power users', 'backup operators',
        'replicator', 'remote desktop users', 'network configuration operators',
        'performance monitor users', 'performance log users', 'distributed com users',
        'iis_iusrs', 'cryptographic operators', 'event log readers',
        'certificate service dcom access', 'rdp-tcp', 'console', 'helpassistant'
    }
    
    if system == "windows":
        try:
            # Use WMIC for more accurate user listing (only actual user accounts)
            try:
                output = subprocess.check_output(
                    ["wmic", "useraccount", "where", "LocalAccount=True", "get", "Name,Disabled,Status"],
                    stderr=subprocess.DEVNULL,
                    timeout=15
                ).decode()
                lines = output.strip().split('\n')[1:]  # Skip header
                
                # Get list of admins
                admin_list = set()
                try:
                    admin_output = subprocess.check_output(
                        ["net", "localgroup", "Administrators"],
                        stderr=subprocess.DEVNULL,
                        timeout=10
                    ).decode()
                    in_members = False
                    for admin_line in admin_output.split('\n'):
                        admin_line = admin_line.strip()
                        if '----' in admin_line:
                            in_members = True
                            continue
                        if in_members and admin_line and not admin_line.startswith('The command'):
                            admin_list.add(admin_line.lower())
                except Exception:
                    pass
                
                for line in lines:
                    parts = line.strip().split()
                    if parts:
                        username = parts[0].strip()
                        # Check if disabled (FALSE means enabled)
                        is_disabled = len(parts) > 1 and parts[1].upper() == 'TRUE'
                        
                        # Skip system accounts and disabled accounts
                        if username and username.lower() not in WINDOWS_SYSTEM_ACCOUNTS and not is_disabled:
                            is_admin = username.lower() in admin_list
                            users.append({
                                "username": username,
                                "isAdmin": is_admin
                            })
            except Exception:
                # Fallback to net user if WMIC fails
                output = subprocess.check_output(
                    ["net", "user"],
                    stderr=subprocess.DEVNULL,
                    timeout=10
                ).decode()
                lines = output.split('\n')
                
                # Get list of admins
                admin_list = set()
                try:
                    admin_output = subprocess.check_output(
                        ["net", "localgroup", "Administrators"],
                        stderr=subprocess.DEVNULL,
                        timeout=10
                    ).decode()
                    in_members = False
                    for admin_line in admin_output.split('\n'):
                        admin_line = admin_line.strip()
                        if '----' in admin_line:
                            in_members = True
                            continue
                        if in_members and admin_line and not admin_line.startswith('The command'):
                            admin_list.add(admin_line.lower())
                except Exception:
                    pass
                
                for line in lines:
                    if line.strip() and not line.startswith('-') and not line.startswith('User') and not line.startswith('The'):
                        for username in line.split():
                            username = username.strip()
                            if username and username.lower() not in WINDOWS_SYSTEM_ACCOUNTS:
                                is_admin = username.lower() in admin_list
                                users.append({
                                    "username": username,
                                    "isAdmin": is_admin
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
                                    "isAdmin": is_admin
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


def test_connectivity(server_url: str) -> bool:
    """Test if we can reach the server."""
    import urllib.parse
    parsed = urllib.parse.urlparse(server_url)
    hostname = parsed.hostname
    port = parsed.port or (443 if parsed.scheme == 'https' else 80)
    
    print(f"[*] Testing connectivity to {hostname}...")
    
    # First try DNS resolution
    try:
        socket.setdefaulttimeout(10)
        ip = socket.gethostbyname(hostname)
        print(f"    DNS resolved: {hostname} -> {ip}")
    except socket.gaierror as e:
        print(f"\n[!] DNS resolution failed for {hostname}")
        print("    Possible causes:")
        print("    - No internet connection")
        print("    - Server hostname is incorrect")
        print("    - DNS server issues")
        print("\n    Try these fixes:")
        print("    1. Check your internet connection")
        print("    2. Try: ipconfig /flushdns (in Command Prompt as Admin)")
        print("    3. Try using a different DNS (e.g., 8.8.8.8)")
        return False
    except Exception as e:
        print(f"\n[!] Connection test failed: {e}")
        return False
    
    return True


def create_audit(server_url: str, max_retries: int = 3) -> Optional[str]:
    """Create a new audit on the server with retry logic."""
    import time
    
    for attempt in range(max_retries):
        try:
            response = requests.post(
                f"{server_url}/api/audit/create",
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            return data.get("auditId")
        except requests.exceptions.ConnectionError as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                print(f"\n[!] Connection failed, retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                time.sleep(wait_time)
            else:
                print(f"\n[!] Failed to connect after {max_retries} attempts: {e}")
                return None
        except Exception as e:
            print(f"\n[!] Failed to create audit: {e}")
            return None
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
    except requests.exceptions.HTTPError as e:
        print(f"\n[!] Failed to upload data: {e}")
        try:
            error_details = e.response.json()
            print(f"    Server response: {json.dumps(error_details, indent=2)}")
        except:
            print(f"    Response text: {e.response.text[:500]}")
        return False
    except Exception as e:
        print(f"\n[!] Failed to upload data: {e}")
        return False


def print_banner():
    """Print the application banner."""
    banner = """
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║      █████╗ ██████╗ ██╗ ██████╗ █████╗                        ║
    ║     ██╔══██╗██╔══██╗██║██╔════╝██╔══██╗                       ║
    ║     ███████║██████╔╝██║██║     ███████║                       ║
    ║     ██╔══██║██╔══██╗██║██║     ██╔══██║                       ║
    ║     ██║  ██║██║  ██║██║╚██████╗██║  ██║                       ║
    ║     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝ ╚═════╝╚═╝  ╚═╝                       ║
    ║                                                               ║
    ║     ████████╗ ██████╗ ██╗   ██╗ ██████╗ █████╗ ███╗   ██╗     ║
    ║     ╚══██╔══╝██╔═══██╗██║   ██║██╔════╝██╔══██╗████╗  ██║     ║
    ║        ██║   ██║   ██║██║   ██║██║     ███████║██╔██╗ ██║     ║
    ║        ██║   ██║   ██║██║   ██║██║     ██╔══██║██║╚██╗██║     ║
    ║        ██║   ╚██████╔╝╚██████╔╝╚██████╗██║  ██║██║ ╚████║     ║
    ║        ╚═╝    ╚═════╝  ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝     ║
    ║                                                               ║
    ║           AI-Powered Compliance & Audit Platform              ║
    ║                     Desktop Audit Agent                       ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """
    print(banner)


# ============================================================================
# QUESTIONNAIRE DEFINITIONS (Matching ISO 27001/27002 Schema)
# ============================================================================

QUESTIONNAIRE_DATA = {
    "ACCESS_CONTROL": {
        "title": "Access Control",
        "description": "User authentication, authorization, and access management",
        "questions": [
            {"id": "AC-001", "text": "Do you have a formal access control policy in place?"},
            {"id": "AC-002", "text": "Are user access rights reviewed at least quarterly?"},
            {"id": "AC-003", "text": "Is multi-factor authentication enforced for all privileged accounts?"},
            {"id": "AC-004", "text": "Do you have a process for immediate access revocation upon employee termination?"},
            {"id": "AC-005", "text": "Are password policies enforced with complexity requirements?"},
        ]
    },
    "ASSET_MANAGEMENT": {
        "title": "Asset Management",
        "description": "IT asset inventory, classification, and lifecycle management",
        "questions": [
            {"id": "AM-001", "text": "Do you maintain an up-to-date inventory of all IT assets?"},
            {"id": "AM-002", "text": "Are all assets classified according to sensitivity levels?"},
            {"id": "AM-003", "text": "Is there a formal process for asset disposal and data sanitization?"},
            {"id": "AM-004", "text": "Are mobile devices and removable media controlled and encrypted?"},
            {"id": "AM-005", "text": "Do you track software licenses and ensure compliance?"},
        ]
    },
    "RISK_MANAGEMENT": {
        "title": "Risk Management",
        "description": "Risk assessment, treatment, and vendor management",
        "questions": [
            {"id": "RM-001", "text": "Do you conduct formal risk assessments at least annually?"},
            {"id": "RM-002", "text": "Is there a risk register maintained and regularly updated?"},
            {"id": "RM-003", "text": "Are risk treatment plans documented and tracked?"},
            {"id": "RM-004", "text": "Do you have a vendor risk management program?"},
            {"id": "RM-005", "text": "Are security metrics reported to executive management?"},
        ]
    },
    "INCIDENT_RESPONSE": {
        "title": "Incident Response",
        "description": "Security incident detection, response, and reporting",
        "questions": [
            {"id": "IR-001", "text": "Do you have a documented incident response plan?"},
            {"id": "IR-002", "text": "Is the incident response team trained and tested regularly?"},
            {"id": "IR-003", "text": "Do you have 24/7 security monitoring capabilities?"},
            {"id": "IR-004", "text": "Are security incidents logged and analyzed for trends?"},
            {"id": "IR-005", "text": "Do you have breach notification procedures in place?"},
        ]
    },
    "BUSINESS_CONTINUITY": {
        "title": "Business Continuity",
        "description": "Business continuity planning and disaster recovery",
        "questions": [
            {"id": "BC-001", "text": "Do you have a documented business continuity plan?"},
            {"id": "BC-002", "text": "Are critical systems backed up with defined RPO/RTO targets?"},
            {"id": "BC-003", "text": "Do you test disaster recovery procedures at least annually?"},
            {"id": "BC-004", "text": "Is there an alternate processing site or cloud-based failover?"},
            {"id": "BC-005", "text": "Are business impact analyses conducted and updated regularly?"},
        ]
    }
}


def submit_questionnaire(server_url: str, audit_id: str, answers: List[Dict[str, Any]]) -> bool:
    """Submit questionnaire responses to the server.
    
    Args:
        server_url: The server URL
        audit_id: The audit ID
        answers: List of answer objects with questionId, category, question, answer, notes
    """
    try:
        response = requests.post(
            f"{server_url}/api/audit/submit-questionnaire",
            json={
                "auditId": audit_id,
                "responses": {
                    "answers": answers,
                    "submittedAt": datetime.now().isoformat()
                }
            },
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        response.raise_for_status()
        return True
    except requests.exceptions.HTTPError as e:
        print(f"\n[!] Failed to submit questionnaire: {e}")
        try:
            error_details = e.response.json()
            print(f"    Server response: {json.dumps(error_details, indent=2)}")
        except:
            print(f"    Response text: {e.response.text[:500]}")
        return False
    except Exception as e:
        print(f"\n[!] Failed to submit questionnaire: {e}")
        return False


# ============================================================================
# TKINTER QUESTIONNAIRE GUI
# ============================================================================

if HAS_TKINTER:
    class QuestionnaireGUI:
        """Graphical questionnaire for compliance assessment."""
        
        def __init__(self, server_url: str, audit_id: str):
            self.server_url = server_url
            self.audit_id = audit_id
            self.responses = {}
            self.submitted = False
            
            self.root = tk.Tk()
            self.root.title(f"Arica Toucan - Compliance Questionnaire - Audit: {audit_id[:8].upper()}")
            self.root.geometry("900x700")
            self.root.configure(bg="#0B1220")
            
            # Style configuration
            self.style = ttk.Style()
            self.style.theme_use("clam")
            
            # Configure colors
            self.style.configure("TNotebook", background="#0B1220", borderwidth=0)
            self.style.configure("TNotebook.Tab", background="#1E293B", foreground="#E2E8F0",
                                padding=[20, 10], font=("Segoe UI", 10))
            self.style.map("TNotebook.Tab", background=[("selected", "#3B82F6")])
            
            self.style.configure("TFrame", background="#0B1220")
            self.style.configure("TLabel", background="#0B1220", foreground="#E2E8F0",
                                font=("Segoe UI", 10))
            self.style.configure("Header.TLabel", font=("Segoe UI", 14, "bold"))
            self.style.configure("TRadiobutton", background="#0B1220", foreground="#E2E8F0",
                                font=("Segoe UI", 10))
            
            self._create_widgets()
            
        def _create_widgets(self):
            """Create all GUI widgets."""
            # Header
            header_frame = ttk.Frame(self.root)
            header_frame.pack(fill="x", padx=20, pady=15)
            
            title_label = ttk.Label(
                header_frame,
                text="ISO 27001/27002 Compliance Questionnaire",
                style="Header.TLabel"
            )
            title_label.pack(side="left")
            
            audit_label = ttk.Label(
                header_frame,
                text=f"Audit ID: {self.audit_id[:8].upper()}",
                foreground="#3B82F6"
            )
            audit_label.pack(side="right")
            
            # Instructions
            instructions = ttk.Label(
                self.root,
                text="Please answer the following questions about your organization's security controls.\n"
                     "Select YES, PARTIAL, NO, or N/A for each question.",
                foreground="#94A3B8"
            )
            instructions.pack(padx=20, pady=(0, 10))
            
            # Create notebook (tabs)
            self.notebook = ttk.Notebook(self.root)
            self.notebook.pack(fill="both", expand=True, padx=20, pady=10)
            
            # Create tabs for each category
            for category_key, category_data in QUESTIONNAIRE_DATA.items():
                self._create_category_tab(category_key, category_data)
            
            # Bottom frame with progress and submit button
            bottom_frame = ttk.Frame(self.root)
            bottom_frame.pack(fill="x", padx=20, pady=15)
            
            # Progress label
            self.progress_label = ttk.Label(
                bottom_frame,
                text="Progress: 0 / 25 questions answered",
                foreground="#94A3B8"
            )
            self.progress_label.pack(side="left")
            
            # Submit button
            submit_btn = tk.Button(
                bottom_frame,
                text="Submit Questionnaire",
                command=self._submit,
                bg="#3B82F6",
                fg="white",
                font=("Segoe UI", 11, "bold"),
                padx=30,
                pady=10,
                relief="flat",
                cursor="hand2"
            )
            submit_btn.pack(side="right")
            
        def _create_category_tab(self, category_key: str, category_data: Dict):
            """Create a tab for a questionnaire category."""
            # Create frame for this category
            frame = ttk.Frame(self.notebook)
            self.notebook.add(frame, text=category_data["title"])
            
            # Category description
            desc_label = ttk.Label(
                frame,
                text=category_data["description"],
                foreground="#94A3B8"
            )
            desc_label.pack(padx=20, pady=15, anchor="w")
            
            # Create scrollable frame for questions
            canvas = tk.Canvas(frame, bg="#0B1220", highlightthickness=0)
            scrollbar = ttk.Scrollbar(frame, orient="vertical", command=canvas.yview)
            scrollable_frame = ttk.Frame(canvas)
            
            scrollable_frame.bind(
                "<Configure>",
                lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
            )
            
            canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
            canvas.configure(yscrollcommand=scrollbar.set)
            
            canvas.pack(side="left", fill="both", expand=True, padx=20)
            scrollbar.pack(side="right", fill="y")
            
            # Initialize category responses
            if category_key not in self.responses:
                self.responses[category_key] = {}
            
            # Create questions
            for i, question in enumerate(category_data["questions"]):
                self._create_question(scrollable_frame, category_key, question, i)
                
        def _create_question(self, parent: ttk.Frame, category_key: str, question: Dict, index: int):
            """Create a single question with radio buttons."""
            # Question frame
            q_frame = ttk.Frame(parent)
            q_frame.pack(fill="x", pady=10, padx=10)
            
            # Question number and text
            q_label = ttk.Label(
                q_frame,
                text=f"{index + 1}. {question['text']}",
                wraplength=700
            )
            q_label.pack(anchor="w")
            
            # Radio buttons frame
            radio_frame = ttk.Frame(q_frame)
            radio_frame.pack(anchor="w", pady=5, padx=20)
            
            # Create variable for this question
            var = tk.StringVar(value="")
            
            # Radio button options
            options = [
                ("YES", "#22C55E"),
                ("PARTIAL", "#F59E0B"),
                ("NO", "#EF4444"),
                ("N/A", "#6B7280")
            ]
            
            for opt_text, color in options:
                rb = tk.Radiobutton(
                    radio_frame,
                    text=opt_text,
                    variable=var,
                    value=opt_text,
                    bg="#0B1220",
                    fg="#E2E8F0",
                    selectcolor="#1E293B",
                    activebackground="#0B1220",
                    activeforeground=color,
                    font=("Segoe UI", 10),
                    command=self._update_progress
                )
                rb.pack(side="left", padx=15)
            
            # Store reference to variable
            self.responses[category_key][question["id"]] = var
            
        def _update_progress(self):
            """Update the progress indicator."""
            answered = 0
            total = 0
            
            for category_key, questions in self.responses.items():
                for q_id, var in questions.items():
                    total += 1
                    if var.get():
                        answered += 1
                        
            self.progress_label.config(text=f"Progress: {answered} / {total} questions answered")
            
        def _validate_responses(self) -> bool:
            """Check if all questions have been answered."""
            unanswered = []
            
            for category_key, questions in self.responses.items():
                category_title = QUESTIONNAIRE_DATA[category_key]["title"]
                for q_id, var in questions.items():
                    if not var.get():
                        unanswered.append(f"{category_title}: {q_id}")
                        
            if unanswered:
                messagebox.showwarning(
                    "Incomplete Questionnaire",
                    f"Please answer all questions before submitting.\n\n"
                    f"Unanswered questions: {len(unanswered)}"
                )
                return False
            return True
            
        def _submit(self):
            """Submit the questionnaire responses."""
            if not self._validate_responses():
                return
                
            # Build answer list in the correct format
            answers = []
            for category_key, questions in self.responses.items():
                category_data = QUESTIONNAIRE_DATA[category_key]
                for q_data in category_data["questions"]:
                    q_id = q_data["id"]
                    if q_id in questions:
                        answer_value = questions[q_id].get()
                        # Convert N/A to NA for API compatibility
                        if answer_value == "N/A":
                            answer_value = "NA"
                        answers.append({
                            "questionId": q_id,
                            "category": category_key,
                            "question": q_data["text"],
                            "answer": answer_value
                        })
            
            # Show confirmation
            if not messagebox.askyesno(
                "Confirm Submission",
                "Are you ready to submit your questionnaire responses?\n\n"
                "This will be used for your ISO 27001/27002 compliance scoring."
            ):
                return
                
            # Submit to server
            print("\n[*] Submitting questionnaire responses...")
            success = submit_questionnaire(self.server_url, self.audit_id, answers)
            
            if success:
                self.submitted = True
                messagebox.showinfo(
                    "Success",
                    f"Questionnaire submitted successfully!\n\n"
                    f"Audit ID: {self.audit_id[:8].upper()}\n\n"
                    f"Your responses have been recorded and will be used\n"
                    f"in combination with your system scan data for\n"
                    f"AI-powered compliance scoring."
                )
                self.root.destroy()
            else:
                messagebox.showerror(
                    "Submission Failed",
                    "Failed to submit questionnaire.\n\n"
                    "Please check your internet connection and try again."
                )
                
        def run(self) -> bool:
            """Run the questionnaire GUI."""
            self.root.mainloop()
            return self.submitted


def run_questionnaire_only(server_url: str, audit_id: str) -> bool:
    """Run only the questionnaire GUI for an existing audit."""
    if not HAS_TKINTER:
        print("\n[!] Tkinter is not available. Cannot run graphical questionnaire.")
        print("    Please install Tkinter or use the web questionnaire.")
        return False
    
    print(f"\n[*] Launching questionnaire for Audit ID: {audit_id[:8].upper()}")
    gui = QuestionnaireGUI(server_url, audit_id)
    return gui.run()


def run_system_scan(server_url: str, dry_run: bool = False) -> Optional[str]:
    """Run system scan and upload data. Returns audit_id on success."""
    system_data = collect_system_data()
    
    print("\n[*] System data collected successfully!")
    print(f"    OS: {system_data['osName']} ({system_data['osVersion']})")
    print(f"    Firewall: {'Enabled' if system_data['firewallEnabled'] else 'Disabled'}")
    print(f"    Antivirus: {system_data.get('antivirusName', 'Not detected')}")
    print(f"    Disk Encryption: {'Enabled' if system_data['diskEncryptionEnabled'] else 'Disabled'}")
    print(f"    User Accounts: {len(system_data['userAccounts'])}")
    
    # Print detected user accounts for transparency
    if system_data['userAccounts']:
        print("\n    Detected accounts:")
        for user in system_data['userAccounts']:
            admin_status = " (Admin)" if user.get('isAdmin') else ""
            print(f"      - {user['username']}{admin_status}")
    
    if dry_run:
        print("\n[*] Dry run mode - data not uploaded")
        print("\nCollected data:")
        print(json.dumps(system_data, indent=2))
        return None
    
    print(f"\n[*] Connecting to server: {server_url}")
    
    if not test_connectivity(server_url):
        return None
    
    print("[*] Creating audit record...")
    audit_id = create_audit(server_url)
    
    if not audit_id:
        print("\n[!] Failed to create audit. Please check server connection.")
        return None
    
    print(f"[*] Audit ID: {audit_id[:8].upper()}")
    
    print("[*] Uploading system data...")
    success = upload_system_data(server_url, audit_id, system_data)
    
    if success:
        print("\n[+] System data uploaded successfully!")
        return audit_id
    else:
        print("\n[!] Failed to upload system data.")
        return None


def main():
    parser = argparse.ArgumentParser(
        description="Arica Toucan Desktop Audit Agent"
    )
    parser.add_argument(
        "--server",
        help="Server URL (e.g., https://your-arica-toucan-server.com)"
    )
    parser.add_argument(
        "--mode",
        choices=["full", "system", "questionnaire"],
        default="full",
        help="Audit mode: full (system+questionnaire), system (scan only), questionnaire (GUI only)"
    )
    parser.add_argument(
        "--audit-id",
        help="Audit ID (required for questionnaire-only mode)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Collect data without uploading (for testing)"
    )
    
    args = parser.parse_args()
    
    print_banner()
    
    # Handle dry-run mode (no server required)
    if args.dry_run:
        system_data = collect_system_data()
        
        print("\n[*] System data collected successfully!")
        print(f"    OS: {system_data['osName']} ({system_data['osVersion']})")
        print(f"    Firewall: {'Enabled' if system_data['firewallEnabled'] else 'Disabled'}")
        print(f"    Antivirus: {system_data.get('antivirusName', 'Not detected')}")
        print(f"    Disk Encryption: {'Enabled' if system_data['diskEncryptionEnabled'] else 'Disabled'}")
        print(f"    User Accounts: {len(system_data['userAccounts'])}")
        
        if system_data['userAccounts']:
            print("\n    Detected accounts:")
            for user in system_data['userAccounts']:
                admin_status = " (Admin)" if user.get('isAdmin') else ""
                print(f"      - {user['username']}{admin_status}")
        
        print("\n[*] Dry run mode - data not uploaded")
        print("\nCollected data:")
        print(json.dumps(system_data, indent=2))
        input("\nPress Enter to exit...")
        return
    
    # Validate server URL
    if not args.server:
        print("[!] Error: --server is required (unless using --dry-run)")
        sys.exit(1)
    
    server_url = args.server.rstrip("/")
    
    # Handle questionnaire-only mode
    if args.mode == "questionnaire":
        if not args.audit_id:
            print("[!] Error: --audit-id is required for questionnaire mode")
            sys.exit(1)
        
        success = run_questionnaire_only(server_url, args.audit_id)
        if success:
            print("\n" + "=" * 60)
            print("\n  QUESTIONNAIRE COMPLETED SUCCESSFULLY!")
            print(f"\n  Audit ID: {args.audit_id[:8].upper()}")
            print("\n  Your responses have been recorded.")
            print("  Contact the provider to unlock your compliance report.")
            print("\n" + "=" * 60)
            input("\nPress Enter to exit...")
            sys.exit(0)
        else:
            print("\n[!] Questionnaire was not completed.")
            input("\nPress Enter to exit...")
            sys.exit(1)
    
    # Handle system scan mode
    if args.mode == "system":
        audit_id = run_system_scan(server_url)
        
        if audit_id:
            print("\n" + "=" * 60)
            print("\n  SYSTEM SCAN COMPLETED SUCCESSFULLY!")
            print(f"\n  Your Audit ID is: {audit_id[:8].upper()}")
            print("\n  IMPORTANT: Save this ID!")
            print("  You can complete the questionnaire later using this ID.")
            print("\n  Contact the provider to unlock your report")
            print("  and receive your AI-powered compliance analysis.")
            print("\n" + "=" * 60)
            input("\nPress Enter to exit...")
            sys.exit(0)
        else:
            print("\n[!] System scan failed.")
            input("\nPress Enter to exit...")
            sys.exit(1)
    
    # Handle full audit mode (system + questionnaire)
    if args.mode == "full":
        audit_id = run_system_scan(server_url)
        
        if not audit_id:
            print("\n[!] System scan failed. Cannot proceed with questionnaire.")
            input("\nPress Enter to exit...")
            sys.exit(1)
        
        # Launch questionnaire GUI
        if HAS_TKINTER:
            print("\n[*] Launching compliance questionnaire...")
            print("    A new window will open. Please complete all questions.")
            
            gui = QuestionnaireGUI(server_url, audit_id)
            questionnaire_success = gui.run()
            
            if questionnaire_success:
                print("\n" + "=" * 60)
                print("\n  FULL AUDIT COMPLETED SUCCESSFULLY!")
                print(f"\n  Your Audit ID is: {audit_id[:8].upper()}")
                print("\n  IMPORTANT: Save this ID!")
                print("  Both system data and questionnaire have been submitted.")
                print("\n  Contact the provider to unlock your report")
                print("  and receive your AI-powered compliance analysis.")
                print("\n" + "=" * 60)
                input("\nPress Enter to exit...")
                sys.exit(0)
            else:
                print("\n[!] Questionnaire was not completed.")
                print(f"    Your system data was uploaded (Audit ID: {audit_id[:8].upper()})")
                print("    You can complete the questionnaire later.")
                input("\nPress Enter to exit...")
                sys.exit(1)
        else:
            print("\n[!] Tkinter not available. Questionnaire skipped.")
            print(f"    Your system data was uploaded (Audit ID: {audit_id[:8].upper()})")
            print("    Complete the questionnaire via the web interface.")
            print("\n" + "=" * 60)
            print("\n  SYSTEM SCAN COMPLETED!")
            print(f"\n  Your Audit ID is: {audit_id[:8].upper()}")
            print("\n" + "=" * 60)
            input("\nPress Enter to exit...")
            sys.exit(0)


if __name__ == "__main__":
    main()
