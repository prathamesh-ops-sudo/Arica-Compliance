# Project Sentinel

AI-Powered Compliance & Audit SaaS Platform

## Overview

Project Sentinel is an enterprise-grade compliance and audit platform that:
- Runs system audits via a desktop agent (EXE)
- Generates unique Audit IDs
- Locks results until payment/unlock
- Uses AI to score compliance & audit readiness
- Provides a premium admin dashboard
- Exports professional PDF reports

## Architecture

```
/project-sentinel
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
    └── sentinel_agent.py  # System data collector
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
```bash
cd desktop-agent
pip install requests psutil
python sentinel_agent.py --server http://localhost:5000
```

### Building Desktop EXE
```bash
pip install pyinstaller
pyinstaller --onefile --name SentinelAgent sentinel_agent.py
```

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

## Demo Data

The application includes seeded demo audits:
- `demo-001`: Locked status (Windows)
- `demo-002`: Report Ready (macOS, score: 78)
- `demo-003`: Created status
- `demo-004`: AI Processed, High Risk (Linux, score: 42)
