# Council Simulator — Hackathon Submission

## Summary (150 words)

Council Simulator is an AI-powered city council meeting simulator that helps data center petitioners prepare for real public hearings. Users input their proposal details and watch six AI agents — NIMBY residents, a company advocate, a council moderator, and a council member — debate in real-time with streaming text.

The system uses the Claude Agent SDK with three subagents: a persona generator that researches the target city via WebSearch to create locally-grounded characters, a document analyzer for uploaded proposals, and a debate analyst that scores approval likelihood and generates actionable rebuttals. The debate engine uses the Anthropic API directly for fine-grained token streaming via WebSocket.

Data centers are critical AI infrastructure being blocked by unprepared public hearings. Council Simulator amplifies human judgment by letting petitioners test their pitch, understand opposition arguments, and walk into real meetings armed with data-backed responses — without replacing the democratic process.