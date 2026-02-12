# Council Simulator - Implementation Plan

## Context

**Problem**: Data centers are being blocked across America by misinformed NIMBY opposition at city council meetings. Petitioners are unprepared, residents are scared, and critical AI infrastructure isn't getting built.

**Solution**: Council Simulator — an AI-powered city council meeting simulation where users input a real data center proposal and watch AI agents (NIMBY residents, petitioner advocate, council moderator) debate it in real-time. After the debate, the system provides approval scoring, key arguments, and actionable rebuttals.

**Why this wins**: Specific real-world problem (not generic), inherently dramatic demo (debates are watchable), perfect Opus 4.6 showcase (multi-agent with conflicting goals + extended thinking), and the builder has domain expertise (Metro Detroit).

**Hackathon**: Built with Opus 4.6 — Claude Code Hackathon (Cerebral Valley + Anthropic)
- Submissions due: Feb 16, 3 PM EST
- Problem Statement: #3 Amplify Human Judgment

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.10+ / FastAPI / Uvicorn |
| AI - Agents | Claude Agent SDK (`claude-agent-sdk`) |
| AI - Debate | Anthropic Python SDK (`anthropic`) |
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Real-time | WebSockets (FastAPI native) |
| Deployment | Railway (backend) + Vercel (frontend) |

---

## Architecture Overview

### Agent SDK Usage (Judging: 25%)

The Agent SDK powers the **intelligence layer** — three specialized subagents:

1. **Persona Generator** — Researches the city via WebSearch, then creates realistic debate personas grounded in local facts (Opus model for nuance)
2. **Document Analyzer** — Processes uploaded proposal text/PDF, extracts facility specs, environmental impact, economic projections (Sonnet model for speed)
3. **Debate Analyst** — Post-debate analysis: reads full transcript, evaluates argument quality, scores approval likelihood, generates actionable rebuttals (Opus model for depth)

Custom MCP tools:
- `city_research` — Structures city research queries for demographics, infrastructure, politics
- `parse_document` — Extracts structured proposal data from text
- `compute_score` — Weighted approval score calculation from debate factors

### Debate Engine (Direct Anthropic API)

The debate itself uses the `anthropic` SDK directly for fine-grained streaming control. Each persona has a rich system prompt defining their character, concerns, and speaking style. The growing transcript serves as shared context across turns. Tokens stream via WebSocket to the frontend in real-time.

**Why hybrid**: Agent SDK subagents excel at autonomous research/analysis tasks. Debate turns need precise streaming control and don't require tool use — direct API calls are simpler and more reliable for this pattern.

---

## Project Structure

```
council-simulator/
├── backend/
│   ├── main.py                    # FastAPI app + CORS + WebSocket
│   ├── config.py                  # Settings via pydantic-settings
│   ├── requirements.txt
│   ├── api/
│   │   ├── routes.py              # POST /simulations, GET /simulations/:id
│   │   └── websocket.py           # WebSocket handler + broadcast
│   ├── agents/
│   │   ├── orchestrator.py        # Agent SDK orchestrator (3 subagents)
│   │   ├── persona_agent.py       # Persona generation subagent
│   │   ├── document_agent.py      # Document analysis subagent
│   │   └── analysis_agent.py      # Post-debate analysis subagent
│   ├── debate/
│   │   ├── engine.py              # Core debate orchestration (turn management)
│   │   ├── personas.py            # Persona templates + system prompts
│   │   ├── turns.py               # Individual turn generation (streaming)
│   │   └── transcript.py          # Transcript accumulator + context manager
│   ├── models/
│   │   ├── simulation.py          # SimulationInput, SimulationState
│   │   ├── persona.py             # Persona, PersonaRole, PersonaArchetype
│   │   ├── debate.py              # DebateTurn, DebatePhase
│   │   └── analysis.py            # AnalysisResult, ApprovalScore
│   └── services/
│       ├── simulation_manager.py  # In-memory simulation state store
│       └── stream_manager.py      # WebSocket broadcast manager
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── components/
│       │   ├── setup/SetupForm.tsx
│       │   ├── chamber/
│       │   │   ├── CouncilChamber.tsx
│       │   │   ├── TranscriptFeed.tsx
│       │   │   ├── SpeakerPanel.tsx
│       │   │   └── PhaseIndicator.tsx
│       │   └── results/
│       │       ├── ResultsDashboard.tsx
│       │       ├── ApprovalMeter.tsx
│       │       ├── RebuttalCards.tsx
│       │       └── TranscriptExport.tsx
│       ├── hooks/useSimulation.ts
│       ├── lib/api.ts
│       └── types/
├── CLAUDE.md
├── README.md
└── LICENSE (MIT)
```

---

## Debate Flow

### 5 Phases, 10-14 Turns Total

| Phase | Turns | Description |
|-------|-------|-------------|
| Opening | 2 | Moderator opens meeting, petitioner presents proposal |
| Public Comment | 3-4 | Each resident raises their specific concern |
| Rebuttal | 1-2 | Petitioner addresses concerns with data-driven responses |
| Council Q&A | 2-3 | Council member asks probing questions to both sides |
| Deliberation | 2 | Moderator summarizes, council member gives assessment + vote |

Each turn streams token-by-token (~200 tokens per turn). Total debate runtime: 2-3 minutes.

---

## Persona System

### 5 Agents with Distinct Roles

| Persona | Role | Speaking Style | Primary Concern |
|---------|------|---------------|-----------------|
| Moderator | Council Chair | Neutral, procedural | Running an orderly meeting |
| Petitioner | Company Rep | Data-driven, empathetic | Getting the proposal approved |
| Concerned Parent | Resident | Emotional, personal anecdotes | Children's safety, school proximity |
| Environmental Activist | Resident | Data-heavy, passionate | Water usage, power grid strain |
| Property Owner | Resident | Financial focus, confrontational | Home values, neighborhood character |

Each persona gets a rich system prompt with: backstory, occupation, speaking style, concerns (primary + secondary), intensity level (1-10), and behavioral rules.

Key prompt engineering principles:
- Natural speech (no bullet points, no numbered lists — this is a public meeting)
- Reference specific local details (streets, schools, neighborhoods)
- Emotional authenticity (frustration, concern, hope)
- Agents may acknowledge good points from the other side (realistic, not permanently opposed)
- Keep statements to 3-5 sentences (public comment, not a filibuster)

---

## WebSocket Message Protocol

All messages follow `{ "type": string, "payload": object }` format:

```
phase_change   → { phase, description }
persona_intro  → { persona_id, name, role, archetype }
speaking_start → { turn_id, persona_id, persona_name, phase }
token          → { turn_id, token, persona_id }
speaking_end   → { turn_id, persona_id, full_text }
analysis       → { approval_score, key_arguments, recommended_rebuttals, ... }
complete       → { simulation_id }
status         → { message, progress }
error          → { message, phase }
```

---

## Judging Criteria Alignment

| Criteria | Weight | How We Score |
|----------|--------|-------------|
| **Demo** | 30% | Real-time multi-agent debate is inherently dramatic and watchable |
| **Impact** | 25% | Solves a real, timely problem (data center approvals) with clear beneficiaries |
| **Opus 4.6 Use** | 25% | Multi-agent conflicting goals, extended thinking for nuanced rebuttals, Agent SDK subagents, custom MCP tools |
| **Depth & Execution** | 20% | Iterated from generic debate to specific use case, real Michigan data, polished engineering |

---

## Key Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Agent SDK API differs from expectations | Verify installation + API on Day 1 before building on it |
| Personas sound robotic/generic | Heavy prompt engineering investment. Temperature 0.85. Test early and iterate. |
| WebSocket connectivity in production | Deploy early. Railway supports WS natively. Have SSE fallback plan. |
| API costs exceed $500 budget | Use Sonnet for doc analysis. Cap $2/simulation. ~$0.50-$1.50 per sim estimated. |
| Scope creep | Strict phase/task plan. No features until core is working end-to-end. |
| Political sensitivity | Frame as "informed debate" not "trick NIMBYs." Help BOTH sides prepare. |
