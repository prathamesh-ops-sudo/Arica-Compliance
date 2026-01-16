#!/usr/bin/env python3
"""
Arica Toucan - Compliance Questionnaire GUI
============================================

Tkinter-based GUI for collecting compliance questionnaire responses.
Supports 5 categories with multiple questions per category.

Requirements:
    - Python 3.8+ with Tkinter (built-in on Windows)
    - requests library for API submission
"""

import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime
from typing import Dict, List, Optional, Callable
import threading

try:
    import requests
except ImportError:
    requests = None


# Questionnaire categories and questions (matching server schema)
QUESTIONNAIRE_DATA = {
    "ACCESS_CONTROL": {
        "name": "Access Control",
        "questions": [
            {"id": "AC-001", "text": "Do you have a formal access control policy in place?"},
            {"id": "AC-002", "text": "Are user access rights reviewed at least quarterly?"},
            {"id": "AC-003", "text": "Is multi-factor authentication enforced for all privileged accounts?"},
            {"id": "AC-004", "text": "Do you have a process for immediate access revocation upon employee termination?"},
            {"id": "AC-005", "text": "Are password policies enforced with complexity requirements?"},
        ]
    },
    "ASSET_MANAGEMENT": {
        "name": "Asset Management",
        "questions": [
            {"id": "AM-001", "text": "Do you maintain an up-to-date inventory of all IT assets?"},
            {"id": "AM-002", "text": "Are all assets classified according to sensitivity levels?"},
            {"id": "AM-003", "text": "Is there a formal process for asset disposal and data sanitization?"},
            {"id": "AM-004", "text": "Are mobile devices and removable media controlled and encrypted?"},
            {"id": "AM-005", "text": "Do you track software licenses and ensure compliance?"},
        ]
    },
    "RISK_MANAGEMENT": {
        "name": "Risk Management",
        "questions": [
            {"id": "RM-001", "text": "Do you conduct formal risk assessments at least annually?"},
            {"id": "RM-002", "text": "Is there a risk register maintained and regularly updated?"},
            {"id": "RM-003", "text": "Are risk treatment plans documented and tracked?"},
            {"id": "RM-004", "text": "Do you have a vendor risk management program?"},
            {"id": "RM-005", "text": "Are security metrics reported to executive management?"},
        ]
    },
    "INCIDENT_RESPONSE": {
        "name": "Incident Response",
        "questions": [
            {"id": "IR-001", "text": "Do you have a documented incident response plan?"},
            {"id": "IR-002", "text": "Is the incident response team trained and tested regularly?"},
            {"id": "IR-003", "text": "Do you have 24/7 security monitoring capabilities?"},
            {"id": "IR-004", "text": "Are security incidents logged and analyzed for trends?"},
            {"id": "IR-005", "text": "Do you have breach notification procedures in place?"},
        ]
    },
    "BUSINESS_CONTINUITY": {
        "name": "Business Continuity",
        "questions": [
            {"id": "BC-001", "text": "Do you have a documented business continuity plan?"},
            {"id": "BC-002", "text": "Are critical systems backed up with defined RPO/RTO targets?"},
            {"id": "BC-003", "text": "Do you test disaster recovery procedures at least annually?"},
            {"id": "BC-004", "text": "Is there an alternate processing site or cloud-based failover?"},
            {"id": "BC-005", "text": "Are business impact analyses conducted and updated regularly?"},
        ]
    }
}

ANSWER_OPTIONS = ["YES", "PARTIAL", "NO", "NA"]


class QuestionnaireGUI:
    """Tkinter GUI for compliance questionnaire collection."""
    
    def __init__(self, audit_id: str, server_url: str, on_complete: Optional[Callable] = None):
        self.audit_id = audit_id
        self.server_url = server_url.rstrip("/")
        self.on_complete = on_complete
        self.responses: Dict[str, Dict] = {}
        self.notes: Dict[str, str] = {}
        
        # Initialize response tracking
        for category, data in QUESTIONNAIRE_DATA.items():
            for question in data["questions"]:
                self.responses[question["id"]] = {
                    "questionId": question["id"],
                    "category": category,
                    "question": question["text"],
                    "answer": None,
                    "notes": ""
                }
        
        self.root = tk.Tk()
        self.root.title("Arica Toucan - Compliance Questionnaire")
        self.root.geometry("900x700")
        self.root.minsize(800, 600)
        
        # Configure style
        self.style = ttk.Style()
        self.style.theme_use('clam')
        
        # Custom styles
        self.style.configure('Title.TLabel', font=('Segoe UI', 16, 'bold'))
        self.style.configure('Subtitle.TLabel', font=('Segoe UI', 10))
        self.style.configure('Question.TLabel', font=('Segoe UI', 10), wraplength=600)
        self.style.configure('Category.TLabel', font=('Segoe UI', 12, 'bold'))
        self.style.configure('Submit.TButton', font=('Segoe UI', 11, 'bold'), padding=10)
        self.style.configure('Progress.TLabel', font=('Segoe UI', 9))
        
        self._create_widgets()
        self._center_window()
    
    def _center_window(self):
        """Center the window on screen."""
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f'{width}x{height}+{x}+{y}')
    
    def _create_widgets(self):
        """Create all GUI widgets."""
        # Main container
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Header
        header_frame = ttk.Frame(main_frame)
        header_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(
            header_frame,
            text="Compliance Questionnaire",
            style='Title.TLabel'
        ).pack(side=tk.LEFT)
        
        ttk.Label(
            header_frame,
            text=f"Audit ID: {self.audit_id[:8].upper()}",
            style='Subtitle.TLabel'
        ).pack(side=tk.RIGHT)
        
        # Progress frame
        progress_frame = ttk.Frame(main_frame)
        progress_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.progress_label = ttk.Label(
            progress_frame,
            text="Progress: 0 / 25 questions answered",
            style='Progress.TLabel'
        )
        self.progress_label.pack(side=tk.LEFT)
        
        self.progress_bar = ttk.Progressbar(
            progress_frame,
            length=300,
            mode='determinate',
            maximum=25
        )
        self.progress_bar.pack(side=tk.RIGHT, padx=(10, 0))
        
        # Notebook (tabbed interface)
        self.notebook = ttk.Notebook(main_frame)
        self.notebook.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        # Create tabs for each category
        self.answer_vars: Dict[str, tk.StringVar] = {}
        self.note_widgets: Dict[str, tk.Text] = {}
        
        for category, data in QUESTIONNAIRE_DATA.items():
            tab_frame = ttk.Frame(self.notebook, padding="10")
            self.notebook.add(tab_frame, text=data["name"])
            
            # Scrollable canvas for questions
            canvas = tk.Canvas(tab_frame, highlightthickness=0)
            scrollbar = ttk.Scrollbar(tab_frame, orient="vertical", command=canvas.yview)
            scrollable_frame = ttk.Frame(canvas)
            
            scrollable_frame.bind(
                "<Configure>",
                lambda e, c=canvas: c.configure(scrollregion=c.bbox("all"))
            )
            
            canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
            canvas.configure(yscrollcommand=scrollbar.set)
            
            # Enable mouse wheel scrolling
            def _on_mousewheel(event, canvas=canvas):
                canvas.yview_scroll(int(-1*(event.delta/120)), "units")
            canvas.bind_all("<MouseWheel>", _on_mousewheel)
            
            canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
            scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
            
            # Add questions
            for i, question in enumerate(data["questions"]):
                q_frame = ttk.LabelFrame(
                    scrollable_frame,
                    text=f"Question {i+1}",
                    padding="10"
                )
                q_frame.pack(fill=tk.X, pady=5, padx=5)
                
                # Question text
                ttk.Label(
                    q_frame,
                    text=question["text"],
                    style='Question.TLabel',
                    wraplength=700
                ).pack(anchor=tk.W, pady=(0, 10))
                
                # Answer options
                answer_frame = ttk.Frame(q_frame)
                answer_frame.pack(fill=tk.X)
                
                var = tk.StringVar(value="")
                self.answer_vars[question["id"]] = var
                
                for option in ANSWER_OPTIONS:
                    rb = ttk.Radiobutton(
                        answer_frame,
                        text=self._format_option(option),
                        variable=var,
                        value=option,
                        command=self._update_progress
                    )
                    rb.pack(side=tk.LEFT, padx=(0, 20))
                
                # Notes field
                notes_frame = ttk.Frame(q_frame)
                notes_frame.pack(fill=tk.X, pady=(10, 0))
                
                ttk.Label(notes_frame, text="Notes (optional):").pack(anchor=tk.W)
                
                note_text = tk.Text(notes_frame, height=2, width=80)
                note_text.pack(fill=tk.X, pady=(5, 0))
                self.note_widgets[question["id"]] = note_text
        
        # Button frame
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X, pady=(10, 0))
        
        self.submit_btn = ttk.Button(
            button_frame,
            text="Submit Questionnaire",
            style='Submit.TButton',
            command=self._submit
        )
        self.submit_btn.pack(side=tk.RIGHT)
        
        ttk.Button(
            button_frame,
            text="Cancel",
            command=self._cancel
        ).pack(side=tk.RIGHT, padx=(0, 10))
        
        # Status label
        self.status_label = ttk.Label(button_frame, text="")
        self.status_label.pack(side=tk.LEFT)
    
    def _format_option(self, option: str) -> str:
        """Format answer option for display."""
        formats = {
            "YES": "Yes (Compliant)",
            "PARTIAL": "Partial",
            "NO": "No (Non-compliant)",
            "NA": "N/A"
        }
        return formats.get(option, option)
    
    def _update_progress(self):
        """Update progress bar and label."""
        answered = sum(1 for var in self.answer_vars.values() if var.get())
        total = len(self.answer_vars)
        
        self.progress_bar['value'] = answered
        self.progress_label.config(text=f"Progress: {answered} / {total} questions answered")
    
    def _validate(self) -> bool:
        """Validate that all questions are answered."""
        unanswered = []
        for q_id, var in self.answer_vars.items():
            if not var.get():
                unanswered.append(q_id)
        
        if unanswered:
            messagebox.showwarning(
                "Incomplete Questionnaire",
                f"Please answer all questions before submitting.\n\n"
                f"{len(unanswered)} question(s) remaining."
            )
            return False
        return True
    
    def _collect_responses(self) -> List[Dict]:
        """Collect all responses into the required format."""
        answers = []
        
        for q_id, var in self.answer_vars.items():
            response = self.responses[q_id].copy()
            response["answer"] = var.get()
            
            # Get notes
            note_widget = self.note_widgets.get(q_id)
            if note_widget:
                notes = note_widget.get("1.0", tk.END).strip()
                if notes:
                    response["notes"] = notes
            
            answers.append(response)
        
        return answers
    
    def _submit(self):
        """Submit questionnaire responses to the server."""
        if not self._validate():
            return
        
        if not requests:
            messagebox.showerror(
                "Missing Dependency",
                "The 'requests' library is required for submission.\n"
                "Please install it with: pip install requests"
            )
            return
        
        # Disable submit button
        self.submit_btn.config(state='disabled')
        self.status_label.config(text="Submitting...")
        
        # Submit in background thread
        thread = threading.Thread(target=self._do_submit)
        thread.start()
    
    def _do_submit(self):
        """Perform the actual submission (runs in background thread)."""
        try:
            answers = self._collect_responses()
            
            payload = {
                "auditId": self.audit_id,
                "questionnaire": {
                    "answers": answers,
                    "submittedAt": datetime.now().isoformat()
                }
            }
            
            response = requests.post(
                f"{self.server_url}/api/audit/submit-questionnaire",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=60
            )
            response.raise_for_status()
            
            # Success - update UI in main thread
            self.root.after(0, self._on_submit_success)
            
        except requests.exceptions.ConnectionError:
            self.root.after(0, lambda: self._on_submit_error(
                "Connection Error",
                "Could not connect to the server.\n"
                "Please check your internet connection and try again."
            ))
        except requests.exceptions.Timeout:
            self.root.after(0, lambda: self._on_submit_error(
                "Timeout",
                "The server took too long to respond.\n"
                "Please try again."
            ))
        except requests.exceptions.HTTPError as e:
            self.root.after(0, lambda: self._on_submit_error(
                "Server Error",
                f"The server returned an error:\n{str(e)}"
            ))
        except Exception as e:
            self.root.after(0, lambda: self._on_submit_error(
                "Error",
                f"An unexpected error occurred:\n{str(e)}"
            ))
    
    def _on_submit_success(self):
        """Handle successful submission."""
        messagebox.showinfo(
            "Success",
            f"Questionnaire submitted successfully!\n\n"
            f"Audit ID: {self.audit_id[:8].upper()}\n\n"
            f"Your compliance assessment is now complete."
        )
        
        if self.on_complete:
            self.on_complete(True)
        
        self.root.destroy()
    
    def _on_submit_error(self, title: str, message: str):
        """Handle submission error."""
        self.submit_btn.config(state='normal')
        self.status_label.config(text="")
        
        retry = messagebox.askretrycancel(title, message)
        if retry:
            self._submit()
    
    def _cancel(self):
        """Cancel and close the questionnaire."""
        if messagebox.askyesno(
            "Cancel Questionnaire",
            "Are you sure you want to cancel?\n\n"
            "Your responses will not be saved."
        ):
            if self.on_complete:
                self.on_complete(False)
            self.root.destroy()
    
    def run(self):
        """Run the GUI main loop."""
        self.root.mainloop()


def launch_questionnaire(audit_id: str, server_url: str) -> bool:
    """
    Launch the questionnaire GUI.
    
    Args:
        audit_id: The audit ID to associate responses with
        server_url: The server URL for API submission
    
    Returns:
        True if questionnaire was submitted successfully, False otherwise
    """
    result = {"success": False}
    
    def on_complete(success: bool):
        result["success"] = success
    
    try:
        gui = QuestionnaireGUI(audit_id, server_url, on_complete)
        gui.run()
    except Exception as e:
        print(f"\n[!] Error launching questionnaire GUI: {e}")
        return False
    
    return result["success"]


if __name__ == "__main__":
    # Test mode - launch with dummy data
    import sys
    
    if len(sys.argv) >= 3:
        audit_id = sys.argv[1]
        server_url = sys.argv[2]
    else:
        audit_id = "test-audit-12345678"
        server_url = "https://2qgna3qtsq.us-east-1.awsapprunner.com"
    
    print(f"Launching questionnaire for Audit ID: {audit_id}")
    print(f"Server URL: {server_url}")
    
    success = launch_questionnaire(audit_id, server_url)
    print(f"\nQuestionnaire {'submitted successfully' if success else 'cancelled or failed'}")
