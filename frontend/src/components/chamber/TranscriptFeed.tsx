import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { TranscriptMessage, Persona } from '../../types';
import AgentOrchestrationPanel from './AgentOrchestrationPanel';

interface Props {
  messages: TranscriptMessage[];
  personas: Persona[];
  statusMessage: string;
  agentId?: string;
  agentStatus?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getPersonaColor(personaId: string, personas: Persona[]): string {
  const persona = personas.find(p => p.id === personaId);
  return persona?.color || '#6366f1';
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'moderator': return 'Moderator';
    case 'petitioner': return 'Petitioner';
    case 'council_member': return 'Council Member';
    default: return 'Resident';
  }
}

export default function TranscriptFeed({ messages, personas, statusMessage, agentId, agentStatus }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Pre-debate: show the Agent Orchestration Panel
  if (messages.length === 0) {
    return (
      <AgentOrchestrationPanel
        statusMessage={statusMessage}
        agentId={agentId}
        agentStatus={agentStatus}
      />
    );
  }

  let lastPhase = '';

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-full min-h-[300px]">
      {/* Header */}
      <div className="px-5 py-3 border-b border-chamber-border/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-chamber-muted">
            <rect x="2" y="1.5" width="12" height="13" rx="1.5" />
            <path d="M5 5h6M5 8h6M5 11h3" />
          </svg>
          <span className="text-xs font-semibold text-chamber-muted uppercase tracking-wider">Transcript</span>
        </div>
        <span className="text-[11px] text-chamber-muted/50 font-mono">{messages.length} turns</span>
      </div>

      {/* Messages — scrollable */}
      <div className="p-4 sm:p-5 space-y-1 flex-1 overflow-y-auto">
        {messages.map((msg, idx) => {
          const showPhaseDivider = msg.phase !== lastPhase;
          lastPhase = msg.phase;
          const color = getPersonaColor(msg.persona_id, personas);
          const isStreaming = !msg.is_complete;

          return (
            <div key={msg.turn_id}>
              {showPhaseDivider && (
                <div className="flex items-center gap-3 py-3 my-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-chamber-border to-transparent" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-blue/70 bg-accent-blue/5 px-3 py-1 rounded-full">
                    {msg.phase.replace('_', ' ')}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-chamber-border via-chamber-border to-transparent" />
                </div>
              )}

              <motion.div
                className={`group flex gap-3 p-3 rounded-xl transition-colors ${
                  isStreaming ? 'bg-accent-blue/3' : 'hover:bg-chamber-surface-2/50'
                }`}
                initial={idx === messages.length - 1 ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: color }}
                  >
                    {getInitials(msg.persona_name)}
                  </div>
                  {isStreaming && (
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-chamber-surface animate-pulse"
                      style={{ backgroundColor: color }}
                    />
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold" style={{ color }}>
                      {msg.persona_name}
                    </span>
                    <span className="text-[10px] font-medium text-chamber-muted/60 uppercase tracking-wider">
                      {getRoleLabel(msg.persona_role)}
                    </span>
                  </div>
                  <p className="text-[13px] text-chamber-text/90 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                    {isStreaming && (
                      <span className="inline-block w-0.5 h-[14px] bg-accent-blue ml-0.5 animate-cursor align-middle" />
                    )}
                  </p>
                </div>
              </motion.div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
