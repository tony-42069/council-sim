# Council Simulator - Phases & Tasks

## Workflow

- Each **phase** = a git branch (e.g., `phase-1/foundation`)
- Each **task** = a git commit within that branch
- After all tasks in a phase complete → push branch → PR → review → merge to main
- Phases are sequential; tasks within a phase are sequential

---

## PHASE 1: Project Foundation
**Branch**: `phase-1/foundation`

### Task 1.1: Initialize project structure
- Create monorepo directory structure (backend/, frontend/, docs/)
- Create .gitignore (Python + Node + env files)
- Create LICENSE (MIT)
- Create .env.example with required environment variables
- Create CLAUDE.md with project context and coding conventions
- **Commit**: `"Initialize project structure with monorepo layout"`

### Task 1.2: Initialize Python backend
- Create requirements.txt with dependencies:
  - fastapi, uvicorn[standard], anthropic, pydantic, pydantic-settings
  - python-multipart, websockets, python-dotenv
- Create backend/main.py with FastAPI app shell, CORS middleware, health check endpoint
- Create backend/config.py with Settings class (ANTHROPIC_API_KEY, FRONTEND_URL, ENVIRONMENT)
- Create backend/__init__.py and sub-package __init__.py files
- **Commit**: `"Set up Python backend with FastAPI and dependencies"`

### Task 1.3: Initialize React frontend
- Scaffold with Vite: `npm create vite@latest frontend -- --template react-ts`
- Install: tailwindcss, @tailwindcss/vite, postcss, autoprefixer, framer-motion
- Configure Tailwind with custom color palette (council chamber theme)
- Create basic App.tsx shell with placeholder routing
- **Commit**: `"Set up React frontend with Vite, TypeScript, and Tailwind"`

### Task 1.4: Create all backend data models
- `backend/models/__init__.py`
- `backend/models/simulation.py` — SimulationInput, SimulationState, SimulationStatus enum
- `backend/models/persona.py` — Persona, PersonaRole enum, PersonaArchetype enum
- `backend/models/debate.py` — DebateTurn, DebatePhase enum
- `backend/models/analysis.py` — AnalysisResult, ArgumentSummary, RecommendedRebuttal
- **Commit**: `"Add Pydantic data models for simulation, personas, debate, and analysis"`

### Task 1.5: Create TypeScript type definitions
- `frontend/src/types/simulation.ts` — mirror SimulationInput, SimulationState
- `frontend/src/types/persona.ts` — mirror Persona, roles, archetypes
- `frontend/src/types/websocket.ts` — all WebSocket message types
- `frontend/src/types/index.ts` — re-exports
- **Commit**: `"Add TypeScript type definitions mirroring backend models"`

---

## PHASE 2: Debate Engine Core
**Branch**: `phase-2/debate-engine`

### Task 2.1: Implement persona system
- `backend/debate/__init__.py`
- `backend/debate/personas.py`:
  - MODERATOR_SYSTEM_PROMPT template
  - PETITIONER_SYSTEM_PROMPT template
  - RESIDENT_SYSTEM_PROMPT template (parameterized by archetype)
  - PersonaFactory class with build_system_prompt() method
  - Archetype fallback templates (occupation pools, concern pools, speaking styles)
  - create_default_personas() function for quick testing
- **Commit**: `"Implement persona system with rich system prompt templates"`

### Task 2.2: Implement transcript and context manager
- `backend/debate/transcript.py`:
  - Transcript class that accumulates DebateTurn objects
  - Stores: proposal_summary, city_context, turn_history
  - add_turn(persona, content) method
  - build_context_for_turn(persona, phase) → returns (messages, system_prompt)
  - get_summary() → condensed version for context window management
  - to_markdown() → full transcript export
- **Commit**: `"Implement transcript accumulator and context manager for debate turns"`

### Task 2.3: Implement debate turn generation
- `backend/debate/turns.py`:
  - stream_debate_turn(client, persona, messages, system, callback) → str
  - Uses anthropic.AsyncAnthropic with messages.stream()
  - Token-by-token streaming via async callback
  - Model: claude-opus-4-6-20250610, temperature: 0.85, max_tokens: 400
  - Returns full text after streaming completes
- **Commit**: `"Implement streaming debate turn generation with Anthropic API"`

### Task 2.4: Implement debate engine
- `backend/debate/engine.py`:
  - DebateEngine class
  - __init__(client, simulation_state, personas, stream_callback)
  - run_debate() → orchestrates all 5 phases
  - _run_opening_phase() — moderator intro + petitioner presentation
  - _run_public_comment_phase() — each resident speaks
  - _run_rebuttal_phase() — petitioner addresses concerns
  - _run_council_qa_phase() — council member questions
  - _run_deliberation_phase() — summary + vote
  - Uses Transcript for context management between turns
- **Commit**: `"Implement debate engine with 5-phase flow and turn management"`

### Task 2.5: CLI test runner
- `backend/test_debate.py`:
  - Standalone async script to run full debate in terminal
  - Hardcoded Novi, Michigan scenario with default personas
  - Prints streaming output with colored persona names and phase markers
  - Validates all 5 phases execute and debate sounds realistic
  - Run with: `python backend/test_debate.py`
- **Commit**: `"Add CLI test runner for debate engine validation"`

---

## PHASE 3: Agent SDK Integration
**Branch**: `phase-3/agent-sdk`

### Task 3.1: Verify Agent SDK installation and API
- Install Agent SDK package (verify actual package name — may be `claude-code-sdk` or `anthropic-agent-sdk`)
- Write `backend/test_agent_sdk.py` — minimal test that creates an agent and runs a query
- Document actual API surface in CLAUDE.md (classes, functions, parameters discovered)
- If API differs from expectations, document the delta and adapt the plan
- **Commit**: `"Verify Agent SDK installation and document actual API"`

### Task 3.2: Implement custom MCP tools
- `backend/agents/__init__.py`
- `backend/agents/tools/__init__.py`
- `backend/agents/tools/city_research.py` — structures city research queries
- `backend/agents/tools/document_parser.py` — extracts structured data from proposal text
- `backend/agents/tools/scoring.py` — weighted approval score formula:
  - Inputs: petitioner_argument_quality, opposition_strength, council_receptiveness, economic_benefit_clarity, environmental_mitigation, community_benefit_offered
  - Output: 0-100 score with reasoning
- **Commit**: `"Implement custom MCP tools for city research, document parsing, and scoring"`

### Task 3.3: Implement persona generator subagent
- `backend/agents/persona_agent.py`:
  - generate_personas(city_name, proposal_summary, concerns) → list[Persona]
  - Uses Agent SDK with WebSearch + city_research tool
  - System prompt instructs: research city, create specific personas, ground in local facts
  - Uses Opus model for nuanced persona creation
  - Fallback to default personas if Agent SDK fails or times out (30s cap)
- **Commit**: `"Implement Agent SDK persona generator subagent"`

### Task 3.4: Implement document analyzer subagent
- `backend/agents/document_agent.py`:
  - analyze_document(text) → dict with structured proposal data
  - Extracts: facility specs, environmental impact, economic projections, conditions, timeline
  - Uses Sonnet model for speed
  - Returns structured JSON
- **Commit**: `"Implement Agent SDK document analyzer subagent"`

### Task 3.5: Implement debate analyst subagent
- `backend/agents/analysis_agent.py`:
  - analyze_debate(transcript_text, personas, proposal) → AnalysisResult
  - Reads full transcript, evaluates argument quality from both sides
  - Uses compute_score tool for quantitative scoring
  - Generates specific, actionable rebuttals
  - Uses Opus model for deep analysis
  - Returns structured AnalysisResult
- **Commit**: `"Implement Agent SDK debate analyst subagent"`

### Task 3.6: Implement orchestrator
- `backend/agents/orchestrator.py`:
  - SimulationOrchestrator class
  - __init__(simulation_input)
  - process_input() → analyzes documents, researches city context
  - generate_personas() → creates debate personas via subagent
  - analyze_debate(transcript) → post-debate analysis via subagent
  - Coordinates the 3 subagents across the simulation lifecycle
  - Error handling: graceful fallbacks if any subagent fails
- **Commit**: `"Implement Agent SDK orchestrator coordinating all subagents"`

---

## PHASE 4: API & WebSocket Layer
**Branch**: `phase-4/api-layer`

### Task 4.1: Implement simulation manager
- `backend/services/__init__.py`
- `backend/services/simulation_manager.py`:
  - SimulationManager class (singleton)
  - In-memory dict[str, SimulationState] storage
  - create_simulation(input) → simulation_id
  - get_simulation(id) → SimulationState
  - update_status(id, status) → updates state
  - run_simulation(id) → async background task that executes full pipeline
- **Commit**: `"Implement in-memory simulation manager"`

### Task 4.2: Implement WebSocket stream manager
- `backend/services/stream_manager.py`:
  - StreamManager class (singleton)
  - connections: dict[str, list[WebSocket]]
  - connect(ws, simulation_id) → registers connection
  - disconnect(ws, simulation_id) → removes connection
  - broadcast(simulation_id, message) → sends to all connected clients
  - stream_token(simulation_id, turn_id, token, persona_id) → optimized token path
  - Handle WebSocketDisconnect gracefully
- **Commit**: `"Implement WebSocket stream manager for real-time broadcast"`

### Task 4.3: Implement REST API routes
- `backend/api/__init__.py`
- `backend/api/routes.py`:
  - POST /api/simulations — accepts form data (city, company, proposal, concerns) + optional file
  - GET /api/simulations/{id} — returns current simulation state
  - GET /api/simulations/{id}/transcript — returns full transcript
  - GET /api/health — health check
  - Register router in main.py
- **Commit**: `"Implement REST API routes for simulation creation and status"`

### Task 4.4: Implement WebSocket endpoint
- `backend/api/websocket.py`:
  - WebSocket endpoint at /ws/simulation/{simulation_id}
  - On connect: register with StreamManager
  - On disconnect: cleanup
  - Implements full message protocol (phase_change, speaking_start, token, speaking_end, etc.)
  - Register in main.py
- **Commit**: `"Implement WebSocket endpoint with full message protocol"`

### Task 4.5: Wire up full backend flow
- Update main.py to include all routes, WebSocket, and startup logic
- Wire: POST /api/simulations → SimulationManager.run_simulation() (background task)
  → Orchestrator.process_input() → Orchestrator.generate_personas()
  → DebateEngine.run_debate() (streams via StreamManager)
  → Orchestrator.analyze_debate()
  → StreamManager.broadcast("complete")
- End-to-end test with a WebSocket client tool or script
- **Commit**: `"Wire up complete backend flow from API to WebSocket streaming"`

---

## PHASE 5: Frontend - Setup & Chamber
**Branch**: `phase-5/frontend-core`

### Task 5.1: Create app shell and routing
- Install react-router-dom
- App.tsx with 3 routes: `/` (Setup), `/simulation/:id` (Chamber), `/results/:id` (Results)
- components/layout/Header.tsx — logo, title "Council Simulator"
- Global styles in globals.css — dark council chamber color palette, fonts
- **Commit**: `"Create app shell with routing and global styles"`

### Task 5.2: Implement SetupForm
- `components/setup/SetupForm.tsx`:
  - City name + state text inputs
  - Company name text input
  - Proposal details textarea (multi-line)
  - Concerns: checkboxes for water usage, power grid, traffic, noise, property values, environmental impact
  - Custom concern text input
  - "Start Simulation" button with loading state
- `lib/api.ts` — API client with createSimulation() function
- On submit: POST to API → navigate to /simulation/:id
- **Commit**: `"Implement setup form with all input fields and API submission"`

### Task 5.3: Implement WebSocket hook
- `hooks/useSimulation.ts`:
  - useReducer for simulation state (status, personas, transcript, analysis, etc.)
  - WebSocket connection lifecycle (connect on mount, cleanup on unmount)
  - Handles all message types from protocol
  - Reconnection logic on disconnect
  - Returns: state object + connection status
- **Commit**: `"Implement useSimulation hook with WebSocket and state management"`

### Task 5.4: Implement CouncilChamber layout
- `components/chamber/CouncilChamber.tsx`:
  - Connects to WebSocket via useSimulation hook
  - Two-column layout: TranscriptFeed (left 65%) + sidebar (right 35%)
  - Sidebar contains: SpeakerPanel, PhaseIndicator, persona list
  - Loading state while simulation initializes
  - Responsive: stacks on mobile
- **Commit**: `"Implement CouncilChamber layout with responsive two-column design"`

### Task 5.5: Implement TranscriptFeed
- `components/chamber/TranscriptFeed.tsx`:
  - Scrolling list of transcript messages
  - TranscriptMessage sub-component: avatar, persona name, role badge, message text
  - Currently-streaming message shows text appearing token by token
  - Phase dividers between sections ("--- Public Comment Period ---")
- `hooks/useAutoScroll.ts` — auto-scroll to bottom on new content
- **Commit**: `"Implement TranscriptFeed with streaming messages and auto-scroll"`

### Task 5.6: Implement SpeakerPanel
- `components/chamber/SpeakerPanel.tsx`:
  - Shows currently speaking persona
  - Avatar (generated from initials or DiceBear), name, role badge
  - Pulsing green "Speaking" indicator with CSS animation
  - Brief description of the persona's concern
  - When idle: "Waiting for next speaker..."
- **Commit**: `"Implement SpeakerPanel with speaking indicator animation"`

### Task 5.7: Implement PhaseIndicator
- `components/chamber/PhaseIndicator.tsx`:
  - Horizontal stepper showing all 5 debate phases
  - Current phase highlighted with accent color
  - Completed phases show checkmark
  - Future phases grayed out
  - Animated transition on phase change
- **Commit**: `"Implement PhaseIndicator with animated phase progress"`

### Task 5.8: Wire up full frontend flow
- Connect all components end-to-end
- SetupForm submit → API → navigate → CouncilChamber → WebSocket → live debate
- Test complete flow in browser (may need to run backend simultaneously)
- Fix any integration issues
- **Commit**: `"Wire up complete frontend flow from setup form to live debate"`

---

## PHASE 6: Frontend - Results & Analysis
**Branch**: `phase-6/results`

### Task 6.1: Implement ResultsDashboard
- `components/results/ResultsDashboard.tsx`:
  - Triggered when simulation status reaches "complete"
  - Can be navigated to via /results/:id
  - Layout: ApprovalMeter (top), ArgumentsList (middle), RebuttalCards (bottom)
  - Summary text at top
- **Commit**: `"Implement ResultsDashboard layout"`

### Task 6.2: Implement ApprovalMeter
- `components/results/ApprovalMeter.tsx`:
  - Animated semi-circular gauge (Framer Motion)
  - Fills from 0 to final score over 2 seconds
  - Color gradient: red (0-30) → orange (31-50) → yellow (51-70) → green (71-100)
  - Label text: "Likely Denied" / "Uncertain" / "Likely Approved" / "Strong Approval"
  - Score number displayed prominently
- **Commit**: `"Implement animated ApprovalMeter with color-coded scoring"`

### Task 6.3: Implement ArgumentsList
- `components/results/ArgumentsList.tsx`:
  - Two-column layout: Opposition (left) vs Petitioner (right)
  - Each argument: statement text + strength badge (strong/moderate/weak)
  - Color-coded badges
  - Sorted by strength
- **Commit**: `"Implement ArgumentsList with side-by-side argument display"`

### Task 6.4: Implement RebuttalCards
- `components/results/RebuttalCards.tsx`:
  - Card grid/list layout
  - Each card: concern being addressed → recommended rebuttal → supporting data
  - Effectiveness score badge
  - Designed to be copy-paste usable by real petitioners
- **Commit**: `"Implement RebuttalCards with actionable rebuttal recommendations"`

### Task 6.5: Implement TranscriptExport
- `components/results/TranscriptExport.tsx`:
  - "Download Transcript" button
  - Generates markdown file with: metadata (city, date, personas), full transcript, analysis results
  - Uses Blob + URL.createObjectURL for client-side download
- **Commit**: `"Implement transcript export as downloadable markdown"`

---

## PHASE 7: Enhanced Features
**Branch**: `phase-7/enhancements`

### Task 7.1: PDF document upload
- Install react-dropzone (frontend), pdfplumber or PyPDF2 (backend)
- Add drag-and-drop PDF upload zone to SetupForm
- Backend endpoint or handler to extract text from uploaded PDF
- Feed extracted text to document analyzer subagent
- **Commit**: `"Add PDF document upload with text extraction"`

### Task 7.2: Animated avatars with speaking indicators
- Integrate DiceBear API for procedurally generated avatars (seed = persona name)
- Speaking states: idle (static), speaking (pulsing border + waveform), finished (checkmark)
- Update SpeakerPanel and TranscriptMessage to use DiceBear avatars
- **Commit**: `"Add DiceBear avatars with animated speaking indicators"`

### Task 7.3: Preset Michigan city scenarios
- Create presets data file with 3 scenarios:
  - Novi, MI: Google data center, 150k sqft, water + power concerns
  - Plymouth Township, MI: Microsoft facility, water usage focus
  - Rochester Hills, MI: Local tech company, power grid + traffic
- Quick-start buttons on SetupForm that auto-fill the form
- **Commit**: `"Add preset Michigan city scenarios for quick-start"`

### Task 7.4: Sound effects
- Source royalty-free sound files: gavel bang, subtle notification
- Gavel sound on: meeting open, meeting close, phase transitions
- Notification on: new speaker starts
- Mute/unmute toggle button in header
- Use HTML5 Audio API
- **Commit**: `"Add sound effects for gavel and phase transitions"`

### Task 7.5: Real-time approval meter during debate
- Backend: add lightweight approval estimation after each debate turn
- New WebSocket message type: `approval_update → { score, delta, reason }`
- Frontend: mini approval gauge in the Chamber sidebar
- Animated updates as arguments shift the score
- **Commit**: `"Add real-time approval meter that updates during debate"`

### Task 7.6: Dark mode + visual polish
- Dark council chamber theme as default (dark navy/charcoal background)
- Polished typography: serif for persona names, monospace for data points
- Box shadows, subtle gradients, card hover effects
- Framer Motion page transitions (setup → chamber → results)
- **Commit**: `"Add dark mode theme and visual polish"`

---

## PHASE 8: Deployment
**Branch**: `phase-8/deployment`

### Task 8.1: Backend deployment config
- Create `backend/Dockerfile`:
  - Python 3.11-slim base
  - Install dependencies
  - Run with uvicorn on $PORT
- Create `backend/railway.toml` or `Procfile`
- Add production config to config.py
- **Commit**: `"Add backend deployment configuration for Railway"`

### Task 8.2: Frontend deployment config
- Create `frontend/vercel.json`:
  - Build command, output directory, framework
- Add environment variables: VITE_API_BASE_URL, VITE_WS_BASE_URL
- Optimize production build (code splitting, tree shaking)
- **Commit**: `"Add frontend deployment configuration for Vercel"`

### Task 8.3: Deploy and configure
- Deploy backend to Railway (connect GitHub repo, set env vars)
- Deploy frontend to Vercel (connect GitHub repo, set env vars)
- Configure CORS in backend with production Vercel URL
- Verify WebSocket connectivity over wss:// in production
- **Commit**: `"Configure production environment variables and CORS"`

### Task 8.4: Production testing
- Run 5+ complete simulations on production deployment
- Test scenarios: Novi MI, Plymouth MI, Rochester Hills MI
- Test edge cases: very short proposal, no concerns, long text
- Test error handling: disconnect during debate, invalid input
- Performance: measure latency, streaming speed, total sim time
- Fix any issues found
- **Commit**: `"Fix production issues found during testing"`

---

## PHASE 9: Demo & Submission
**Branch**: `phase-9/submission`

### Task 9.1: Final polish pass
- Visual consistency audit across all pages
- Loading states for every async operation
- Error messages that are user-friendly (not stack traces)
- Responsive design check (desktop, tablet, mobile)
- Browser compatibility (Chrome, Firefox, Safari)
- **Commit**: `"Final polish pass on UI, loading states, and error handling"`

### Task 9.2: README and documentation
- Comprehensive README.md:
  - Project description and motivation
  - Tech stack overview
  - Architecture diagram (ASCII/text)
  - How to run locally (prerequisites, env setup, start commands)
  - How to deploy
  - Agent SDK usage explanation
  - Demo screenshots
  - License
- **Commit**: `"Add comprehensive README with setup and architecture docs"`

### Task 9.3: Record demo video (3 minutes)
- Script the demo:
  - 0:00-0:20 — Hook: "Data centers are being blocked..."
  - 0:20-0:40 — Show the app, fill out Novi MI scenario
  - 0:40-0:50 — Start simulation, show persona generation
  - 0:50-2:00 — Watch debate streaming live (highlight dramatic moments)
  - 2:00-2:40 — Show results: approval score, arguments, rebuttals
  - 2:40-3:00 — Close: "Council Simulator. Practice your pitch."
- Record with OBS or screen recorder
- Upload to YouTube (unlisted) or Loom
- **NO COMMIT** — external asset

### Task 9.4: Write submission summary (100-200 words)
- What it does, who it helps, how it uses Opus 4.6
- Highlight: Agent SDK, multi-agent debate, real-world impact
- Save as SUBMISSION.md in repo
- **Commit**: `"Add submission summary"`

### Task 9.5: Submit
- Submit via Cerebral Valley platform by **3 PM EST Feb 16**
- Include: demo video link, GitHub repo link, written summary
- Verify everything is accessible (repo public, video unlisted but viewable)
- **NO COMMIT** — external action
