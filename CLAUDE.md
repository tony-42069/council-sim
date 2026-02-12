# Council Simulator

## Project Overview
AI-powered city council meeting simulator for data center proposal debates. Built for the "Built with Opus 4.6" Claude Code Hackathon (Cerebral Valley + Anthropic). Submission deadline: Feb 16, 3 PM EST.

**Repo**: https://github.com/tony-42069/council-simulator.git
**Local dir**: D:\AI Projects\anthropic-hackathon (rename to council-simulator later)

## Architecture
- **Backend**: Python 3.10+ / FastAPI / Uvicorn (in `backend/`)
- **Frontend**: React + TypeScript + Vite + Tailwind CSS (in `frontend/`)
- **AI - Agents**: Claude Agent SDK for intelligence layer (persona gen, doc analysis, debate analysis)
- **AI - Debate**: Anthropic Python SDK (`anthropic`) for streaming debate turns
- **Real-time**: WebSockets for streaming debate to frontend
- **Deployment**: Railway (backend) + Vercel (frontend)

## Key Design Decisions
- Hybrid AI approach: Agent SDK for autonomous research/analysis tasks, direct Anthropic API for debate turns (needs fine-grained streaming control)
- 5 debate phases: Opening → Public Comment → Rebuttal → Council Q&A → Deliberation
- 5 agent personas: Moderator, Petitioner, Concerned Parent, Environmental Activist, Property Owner
- WebSocket message protocol: phase_change, persona_intro, speaking_start, token, speaking_end, analysis, complete, status, error
- In-memory state only (no database)

## Coding Conventions
- Python: Use async/await throughout. Type hints on all functions. Pydantic models for data contracts.
- TypeScript: Strict mode. Interfaces over types where possible. Use React hooks pattern.
- Commits: One per task, descriptive message, always include Co-Authored-By line.
- Branches: One per phase (e.g., `phase-1/foundation`). PR to merge each phase.

## Git Workflow
- Each phase = a git branch (`phase-N/name`)
- Each task = a git commit within that branch
- After all tasks in a phase → push → PR → merge to main
- Always include: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

## Important Files
- `IMPLEMENTATION_PLAN.md` — Full architecture and design doc
- `PHASES_AND_TASKS.md` — Detailed phase/task breakdown with commit messages
- `ANTHROPIC_DATA_CENTER_ANNOUNCEMENT.md` — Real-world data to integrate into petitioner agent

## Agent SDK API (Verified Feb 12, 2026)
Package: `claude-agent-sdk` v0.1.35 (`pip install claude-agent-sdk`)

Key imports:
```python
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition
from claude_agent_sdk import tool, create_sdk_mcp_server, SdkMcpTool
from claude_agent_sdk import AssistantMessage, ResultMessage, TextBlock
```

- `query(prompt, options)` — async iterator, yields messages as agent works
- `ClaudeAgentOptions` — key fields: model, allowed_tools, system_prompt, mcp_servers, permission_mode, max_turns, max_budget_usd, agents (dict[str, AgentDefinition]), output_format
- `AgentDefinition(description, prompt, tools, model)` — defines subagents
- `@tool(name, description, input_schema)` — decorator for custom MCP tools
- `create_sdk_mcp_server(name, version, tools)` — creates MCP server config
- Permission modes: "default", "acceptEdits", "plan", "bypassPermissions"

## What NOT To Do
- Do NOT add user authentication or accounts
- Do NOT add database persistence (in-memory is fine for demo)
- Do NOT support multiple simultaneous simulations
- Do NOT add user intervention during debate
- Do NOT over-engineer — hackathon pace, ship fast, polish later
- Do NOT commit .env files or API keys
