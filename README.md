# Council Simulator

**AI-powered city council meeting simulator for data center proposal debates.**

Council Simulator lets petitioners practice their data center pitch before facing a real city council. Enter your proposal details, and watch AI agents — NIMBY residents, a company advocate, and a council moderator — debate it in real-time. After the debate, get an approval score, key arguments from both sides, and actionable rebuttals you can use in an actual meeting.

Built for the [Built with Opus 4.6: Claude Code Hackathon](https://cerebralvalley.ai/) (Feb 10-16, 2026).

---

## The Problem

Data centers are being blocked across America by misinformed NIMBY opposition at city council meetings. Petitioners arrive unprepared for emotional arguments about water usage, property values, and environmental impact. Residents are scared by things they don't understand. Critical AI infrastructure isn't getting built.

## The Solution

Council Simulator creates a realistic multi-agent debate simulation where:

- **AI residents** raise the exact concerns your real neighbors will
- **An AI petitioner** defends your proposal with data and empathy
- **An AI council member** asks the tough questions
- **Post-debate analysis** scores your approval likelihood and gives you specific rebuttals

The result: petitioners walk into real meetings prepared, confident, and armed with data-backed responses to every concern.

---

## Features

- **Multi-agent debate simulation** — 6 AI personas with distinct personalities, concerns, and speaking styles
- **Real-time streaming** — Watch the debate unfold token-by-token via WebSocket
- **5-phase meeting structure** — Opening, Public Comment, Rebuttal, Council Q&A, Deliberation
- **City-specific personas** — Agent SDK researches your city to create locally-grounded characters
- **PDF document upload** — Upload your actual proposal document for AI analysis
- **Approval scoring** — Weighted 0-100 score with "Likely Approved" / "Uncertain" / "Likely Denied" labels
- **Actionable rebuttals** — Specific responses you can use in a real meeting, with supporting data
- **Transcript export** — Download the full debate as markdown
- **Preset scenarios** — Quick-start with Novi, Plymouth Township, or Rochester Hills (Michigan)
- **Dark mode UI** — Council chamber-themed dark interface

---

## Architecture

### Hybrid AI Approach

Council Simulator uses a **hybrid architecture** that leverages both the Claude Agent SDK and the direct Anthropic API:

**Claude Agent SDK** (intelligence layer):
- **Persona Generator** — Researches the city via WebSearch, creates locally-grounded debate personas (Opus 4.6)
- **Document Analyzer** — Extracts structured data from uploaded proposals (Sonnet 4.5)
- **Debate Analyst** — Scores approval likelihood, identifies key arguments, generates rebuttals (Opus 4.6)

**Anthropic API** (debate engine):
- Each persona gets a rich system prompt and the growing transcript as context
- Tokens stream via WebSocket to the frontend in real-time
- Temperature 0.85 for natural speech variety

**Custom MCP Tools:**
- `research_city` — Structures city demographic queries
- `parse_proposal_document` — Extracts structured proposal data
- `compute_approval_score` — Weighted scoring formula with 6 debate factors

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12 / FastAPI / Uvicorn |
| AI | Claude Agent SDK + Anthropic Python SDK |
| Frontend | React 19 / TypeScript / Vite / Tailwind CSS v4 |
| Real-time | WebSockets (FastAPI native) |
| Animations | Framer Motion |
| Deployment | Railway (backend) + Vercel (frontend) |

### Project Structure

```
├── backend/
│   ├── main.py                     # FastAPI app entry point
│   ├── config.py                   # Settings (pydantic-settings)
│   ├── api/
│   │   ├── routes.py               # REST: POST /simulations, GET /simulations/:id
│   │   └── websocket.py            # WebSocket: /ws/simulation/:id
│   ├── agents/
│   │   ├── orchestrator.py         # Coordinates 3 Agent SDK subagents
│   │   ├── persona_agent.py        # Persona generation (Opus)
│   │   ├── document_agent.py       # Document analysis (Sonnet)
│   │   ├── analysis_agent.py       # Debate analysis (Opus)
│   │   └── tools/                  # Custom MCP tools
│   ├── debate/
│   │   ├── engine.py               # 5-phase debate orchestration
│   │   ├── personas.py             # System prompt templates
│   │   ├── turns.py                # Streaming turn generation
│   │   └── transcript.py           # Context management
│   ├── models/                     # Pydantic data models
│   └── services/
│       ├── simulation_manager.py   # In-memory state store
│       └── stream_manager.py       # WebSocket broadcast
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── setup/SetupForm.tsx
│       │   ├── chamber/            # CouncilChamber, TranscriptFeed, SpeakerPanel, PhaseIndicator
│       │   └── results/            # ResultsDashboard, ApprovalMeter, TranscriptExport
│       ├── hooks/useSimulation.ts  # WebSocket + state management
│       └── types/                  # TypeScript types mirroring backend
├── Dockerfile
├── railway.toml
└── CLAUDE.md
```

---

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- Anthropic API key

### Backend

```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Set environment variables
cp ../.env.example ../.env
# Edit .env and add your ANTHROPIC_API_KEY

# Run the backend (from project root)
cd ..
uvicorn backend.main:app --reload
```

The backend runs at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Required |
| `ENVIRONMENT` | `development` or `production` | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `VITE_API_BASE_URL` | Backend API URL (frontend) | `http://localhost:8000` |
| `VITE_WS_BASE_URL` | Backend WebSocket URL (frontend) | `ws://localhost:8000` |

---

## Deployment

### Backend (Railway)

1. Connect your GitHub repo to Railway
2. Set `ANTHROPIC_API_KEY` environment variable
3. Railway will auto-detect the Dockerfile

### Frontend (Vercel)

1. Import the `frontend/` directory to Vercel
2. Set `VITE_API_BASE_URL` and `VITE_WS_BASE_URL` to your Railway URL
3. Vercel will auto-detect Vite

---

## How It Works

1. **User enters proposal details** — city, company, proposal description, community concerns
2. **Agent SDK researches the city** — uses WebSearch to find local demographics, economy, infrastructure
3. **Agent SDK generates personas** — creates 6 realistic debate participants grounded in local facts
4. **Debate engine runs 5 phases** — each persona speaks in character, streaming tokens in real-time
5. **Agent SDK analyzes the debate** — scores approval likelihood, identifies strongest/weakest arguments
6. **Results dashboard** — animated approval meter, side-by-side arguments, actionable rebuttals

---

## Hackathon Context

**Problem Statement 3: Amplify Human Judgment** — Council Simulator helps petitioners prepare for city council meetings without replacing human decision-making. It surfaces the arguments they'll face, tests their responses, and provides data-backed rebuttals.

**Why Opus 4.6**: The multi-agent debate requires nuanced persona management (each agent has conflicting goals), deep contextual reasoning (building on previous arguments), and strategic analysis (post-debate recommendations). Extended thinking helps each persona formulate realistic, contextually-aware responses.

**Real-world impact**: Data centers are critical infrastructure for AI. Anthropic itself [committed to covering 100% of consumer electricity price increases](https://www.anthropic.com/news/anthropic-commitment-data-centers) from data centers (Feb 2026). This tool directly helps get that infrastructure built.

---

## License

MIT License

---

Built with Claude Opus 4.6 and the Claude Agent SDK.
