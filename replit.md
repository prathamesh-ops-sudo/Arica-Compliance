# Arica Toucan

AI-Powered Compliance & Audit SaaS Platform

## Overview

Arica Toucan is an enterprise-grade compliance and audit platform that:
- Runs system audits via a desktop agent (EXE)
- Generates unique Audit IDs
- Locks results until payment/unlock
- Uses AI to score compliance & audit readiness
- Provides a premium admin dashboard
- Exports professional PDF reports

## Architecture

```
/arica-toucan
├── /client                 # React frontend (Vite)
│   └── /src
│       ├── /components     # Reusable UI components
│       ├── /pages          # Page components
│       └── /lib            # Utilities
├── /server                 # Express backend
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # In-memory data storage
│   └── /services          # Business logic (AI scoring)
├── /shared                # Shared types & schemas
│   └── schema.ts          # Zod schemas & TypeScript types
├── /contracts             # API specification
│   └── openapi.yaml       # OpenAPI 3.0 spec
└── /desktop-agent         # Python desktop agent
    └── arica_toucan_agent.py  # System data collector
```

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Framer Motion, Recharts
- **Backend**: Express.js, Zod validation
- **State**: TanStack Query (React Query)
- **Styling**: Glassmorphism dark theme, shadcn/ui components
- **Desktop Agent**: Python 3, requests, psutil

## Key Features

### Audit Lifecycle
1. **CREATED** - Audit ID generated
2. **LOCKED** - System data received, awaiting payment
3. **PAID** - Payment confirmed, ready for AI (requires LOCKED status to transition)
4. **AI_PROCESSED** - AI scoring in progress (transitional state)
5. **REPORT_READY** - Full report available

**State Enforcement:**
- `unlockAudit` requires audit to be in LOCKED status (returns 409 otherwise)
- `run-ai-score` blocks CREATED/LOCKED audits and validates PAID status
- AI scoring transitions through AI_PROCESSED → REPORT_READY atomically
- Customer status lookup requires minimum 8 characters (security measure)

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/audit/create` | POST | Create new audit |
| `/api/audit/list` | GET | List all audits |
| `/api/audit/status/:id` | GET | Get audit status |
| `/api/audit/upload-system-data` | POST | Upload system data |
| `/api/audit/submit-questionnaire` | POST | Submit questionnaire |
| `/api/audit/unlock` | POST | Unlock audit |
| `/api/audit/run-ai-score` | POST | Trigger AI scoring |
| `/api/audit/report/:id` | GET | Get full report |
| `/api/audit/export/pdf/:id` | GET | Export PDF |

## Pages

- `/` - Landing page
- `/admin` - Admin dashboard
- `/status` - Customer status lookup
- `/questionnaire/:auditId` - Compliance questionnaire

## Color Palette

- **Primary**: #0B1220 (Midnight Navy), #111827 (Deep Charcoal)
- **Accent**: #3B82F6 (Electric Blue), #06B6D4 (Cyan)
- **Success**: #22C55E
- **Warning**: #F59E0B
- **Critical**: #EF4444

## Development

### Running the App
```bash
npm run dev
```

### Desktop Agent

The desktop agent includes an enhanced batch launcher with menu system and a graphical Tkinter questionnaire.

**Running on Windows:**
```bash
cd desktop-agent
AricaToucanAgent.bat
```

**Menu Options:**
1. Run Full Audit (System Scan + Questionnaire GUI)
2. Run System Scan Only
3. Run Questionnaire Only (requires Audit ID)
4. Dry Run (Test without uploading)
5. Configure Server URL
6. Install/Verify Dependencies
7. View Help
8. Exit

**Command-line modes:**
```bash
# Full audit (system scan + questionnaire GUI)
python arica_toucan_agent.py --server https://your-server.com --mode full

# System scan only
python arica_toucan_agent.py --server https://your-server.com --mode system

# Questionnaire only (for existing audit)
python arica_toucan_agent.py --server https://your-server.com --mode questionnaire --audit-id ABC12345

# Dry run (test without uploading)
python arica_toucan_agent.py --dry-run
```

### Building Desktop EXE
```bash
pip install pyinstaller
pyinstaller --onefile --name AricaToucanAgent arica_toucan_agent.py
```

### Questionnaire Categories
The graphical questionnaire covers 5 ISO 27001/27002 compliance categories:
- **Access Control** (AC-001 to AC-005)
- **Asset Management** (AM-001 to AM-005)
- **Risk Management** (RM-001 to RM-005)
- **Incident Response** (IR-001 to IR-005)
- **Business Continuity** (BC-001 to BC-005)

## AI Scoring Logic

The AI scoring engine evaluates:
- System security (firewall, antivirus, encryption)
- User access controls (admin ratios)
- Questionnaire responses across 5 categories

Score ranges:
- 80-100: Low Risk, Audit Ready
- 60-79: Medium Risk, Needs Improvement
- 40-59: High Risk, Not Ready
- 0-39: Critical Risk, Immediate Action Required

## ISO 27001/27002 Compliance Framework

The platform includes comprehensive ISO 27001:2022 / ISO 27002:2022 compliance scoring:

### ISO Control Themes (4 themes, 93 total controls)
- **Organizational (A.5)**: 37 controls - policies, roles, asset management
- **People (A.6)**: 8 controls - screening, training, termination
- **Physical (A.7)**: 14 controls - security perimeters, equipment protection
- **Technological (A.8)**: 34 controls - access control, cryptography, malware protection

### Evidence Sources
- **System Data**: Firewall, antivirus, encryption, user accounts
- **Questionnaire**: Policy and procedure responses mapped to ISO controls
- **Combined**: Controls evaluated using both sources

### Maturity Levels
- **OPTIMIZING** (90%+): Continuous improvement processes in place
- **MANAGED** (75%+): Quantitative quality objectives achieved
- **DEFINED** (60%+): Documented processes and standards
- **DEVELOPING** (40%+): Basic processes established
- **INITIAL** (<40%): Ad-hoc, reactive processes

### Certification Readiness
- **READY** (85%+, no non-compliant): Ready for ISO 27001 certification
- **NEAR_READY** (70%+): Minor gaps to address
- **NEEDS_WORK** (50%+): Significant improvements required
- **NOT_READY** (<50%): Major remediation needed

### UI Integration
- ISO 27001 tab in audit detail modal
- Theme score visualizations with progress bars
- Control status summary (Compliant/Partial/Non-Compliant/N/A)
- Individual control findings with recommendations
- PDF export includes full ISO compliance section

## Demo Data

The application includes seeded demo audits:
- `demo-001`: Locked status (Windows)
- `demo-002`: Report Ready (macOS, score: 78)
- `demo-003`: Created status
- `demo-004`: AI Processed, High Risk (Linux, score: 42)
