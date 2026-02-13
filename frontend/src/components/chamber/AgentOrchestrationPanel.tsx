import { motion, AnimatePresence } from 'framer-motion';

interface AgentState {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'active' | 'complete';
  statusText: string;
  icon: React.ReactNode;
}

const AGENT_ICONS = {
  document_analyzer: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 1.5H4a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5V6L9 1.5z" />
      <path d="M9 1.5V6h4.5" />
      <path d="M5.5 8h5M5.5 10.5h3" />
    </svg>
  ),
  community_research: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="5" />
      <path d="M14.5 14.5l-3.6-3.6" />
      <path d="M7 4.5v5M4.5 7h5" />
    </svg>
  ),
  persona_generator: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="4.5" r="2.5" />
      <path d="M1.5 14c0-3 2-5 4.5-5s4.5 2 4.5 5" />
      <circle cx="12" cy="5" r="1.5" />
      <path d="M14.5 14c0-2-1-3.5-2.5-3.5" />
    </svg>
  ),
  debate_analyst: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.5" y="3" width="13" height="10" rx="1.5" />
      <path d="M4.5 7h2v3h-2z" />
      <path d="M7.5 5.5h2v4.5h-2z" />
      <path d="M10.5 6.5h2v3.5h-2z" />
    </svg>
  ),
};

const AGENT_COLORS: Record<string, string> = {
  document_analyzer: '#3b82f6',
  community_research: '#06b6d4',
  persona_generator: '#a855f7',
  debate_analyst: '#f59e0b',
};

const DEFAULT_AGENTS: AgentState[] = [
  {
    id: 'document_analyzer',
    name: 'Document Analyzer',
    description: 'Extracts key facts from proposal documents',
    status: 'idle',
    statusText: 'Waiting to start',
    icon: AGENT_ICONS.document_analyzer,
  },
  {
    id: 'community_research',
    name: 'Community Researcher',
    description: 'Searches for real resident sentiment and news',
    status: 'idle',
    statusText: 'Waiting to start',
    icon: AGENT_ICONS.community_research,
  },
  {
    id: 'persona_generator',
    name: 'Persona Generator',
    description: 'Creates realistic debate participants',
    status: 'idle',
    statusText: 'Waiting to start',
    icon: AGENT_ICONS.persona_generator,
  },
  {
    id: 'debate_analyst',
    name: 'Debate Analyst',
    description: 'Scores approval likelihood and generates rebuttals',
    status: 'idle',
    statusText: 'Will activate after debate',
    icon: AGENT_ICONS.debate_analyst,
  },
];

interface Props {
  statusMessage: string;
  agentId?: string;
  agentStatus?: string;
}

function deriveAgentStates(statusMessage: string, agentId?: string, agentStatus?: string): AgentState[] {
  const agents = DEFAULT_AGENTS.map(a => ({ ...a }));

  if (!agentId) {
    // Try to infer from status message
    const msg = statusMessage.toLowerCase();
    if (msg.includes('document') || msg.includes('upload')) {
      agents[0].status = 'active';
      agents[0].statusText = statusMessage;
    } else if (msg.includes('research') || msg.includes('sentiment') || msg.includes('community')) {
      agents[0].status = 'complete';
      agents[0].statusText = 'Complete';
      agents[1].status = 'active';
      agents[1].statusText = statusMessage;
    } else if (msg.includes('persona') || msg.includes('generating')) {
      agents[0].status = 'complete';
      agents[0].statusText = 'Complete';
      agents[1].status = 'complete';
      agents[1].statusText = 'Complete';
      agents[2].status = 'active';
      agents[2].statusText = statusMessage;
    } else if (msg.includes('analyz') || msg.includes('scoring') || msg.includes('rebuttal') || msg.includes('evaluat')) {
      agents[0].status = 'complete';
      agents[0].statusText = 'Complete';
      agents[1].status = 'complete';
      agents[1].statusText = 'Complete';
      agents[2].status = 'complete';
      agents[2].statusText = 'Complete';
      agents[3].status = 'active';
      agents[3].statusText = statusMessage;
    }
    return agents;
  }

  // Map agent_id to index
  const idMap: Record<string, number> = {
    document_analyzer: 0,
    community_research: 1,
    persona_generator: 2,
    debate_analyst: 3,
  };

  const idx = idMap[agentId];
  if (idx !== undefined) {
    // Mark all agents before this one as complete
    for (let i = 0; i < idx; i++) {
      agents[i].status = 'complete';
      agents[i].statusText = 'Complete';
    }
    // Set current agent
    agents[idx].status = (agentStatus as AgentState['status']) || 'active';
    agents[idx].statusText = statusMessage;
  }

  return agents;
}

export default function AgentOrchestrationPanel({ statusMessage, agentId, agentStatus }: Props) {
  const agents = deriveAgentStates(statusMessage, agentId, agentStatus);

  return (
    <div className="glass-card rounded-2xl h-full flex flex-col min-h-[300px]">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-chamber-border/50 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative w-5 h-5">
            <motion.div
              className="absolute inset-0 rounded-md bg-accent-purple/20 border border-accent-purple/30"
              animate={{ rotate: [0, 3, -3, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-purple">
                <path d="M8 1v4M8 11v4M1 8h4M11 8h4" />
                <circle cx="8" cy="8" r="2" />
              </svg>
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-chamber-text uppercase tracking-wider">Agent Orchestration</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse" />
            <span className="text-[10px] text-accent-purple font-medium">Live</span>
          </div>
        </div>
        <p className="text-[10px] text-chamber-muted/60 mt-1">
          Powered by Claude Opus 4.6 + Agent SDK
        </p>
      </div>

      {/* Agent Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        <AnimatePresence mode="popLayout">
          {agents.map((agent, i) => {
            const color = AGENT_COLORS[agent.id] || '#6366f1';
            const isActive = agent.status === 'active';
            const isComplete = agent.status === 'complete';

            return (
              <motion.div
                key={agent.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className={`relative p-3.5 rounded-xl border transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-[var(--active-from)] to-transparent border-[var(--active-border)]'
                    : isComplete
                      ? 'bg-chamber-surface-2/20 border-chamber-border/30'
                      : 'bg-chamber-bg/40 border-chamber-border/20 opacity-50'
                }`}
                style={{
                  '--active-from': `${color}08`,
                  '--active-border': `${color}30`,
                } as React.CSSProperties}
              >
                <div className="flex items-start gap-3">
                  {/* Agent icon */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isActive
                        ? 'shadow-md'
                        : isComplete
                          ? 'opacity-70'
                          : 'opacity-30'
                    }`}
                    style={{
                      backgroundColor: `${color}15`,
                      color,
                      boxShadow: isActive ? `0 0 12px ${color}25` : undefined,
                    }}
                  >
                    {agent.icon}
                  </div>

                  {/* Agent info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${
                        isActive ? 'text-chamber-text' : isComplete ? 'text-chamber-text/70' : 'text-chamber-muted/50'
                      }`}>
                        {agent.name}
                      </span>

                      {/* Status badge */}
                      {isActive && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider"
                          style={{ backgroundColor: `${color}15`, color }}
                        >
                          Active
                        </motion.span>
                      )}
                      {isComplete && (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-accent-green shrink-0">
                          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M5.5 8l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      )}
                    </div>

                    {/* Description or status text */}
                    <p className={`text-[11px] mt-0.5 leading-snug ${
                      isActive ? 'text-chamber-muted' : 'text-chamber-muted/40'
                    }`}>
                      {isActive || isComplete ? agent.statusText : agent.description}
                    </p>
                  </div>

                  {/* Activity indicator */}
                  {isActive && (
                    <motion.div
                      className="w-4 h-4 rounded-full border-2 shrink-0 mt-0.5"
                      style={{ borderColor: `${color}40`, borderTopColor: color }}
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    />
                  )}
                </div>

                {/* Progress bar for active agent */}
                {isActive && (
                  <motion.div
                    className="mt-2.5 h-0.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: `${color}10` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                      animate={{ width: ['0%', '70%', '30%', '90%', '50%'] }}
                      transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-chamber-border/30 shrink-0">
        <div className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-chamber-muted/40">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 5v3.5l2.5 1.5" />
          </svg>
          <p className="text-[10px] text-chamber-muted/40 truncate">{statusMessage}</p>
        </div>
      </div>
    </div>
  );
}
