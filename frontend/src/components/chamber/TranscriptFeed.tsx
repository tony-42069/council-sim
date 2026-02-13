import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TranscriptMessage, Persona } from '../../types';

interface Props {
  messages: TranscriptMessage[];
  personas: Persona[];
  statusMessage: string;
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

// Simulated research sources that appear one by one
const RESEARCH_SOURCES = [
  { icon: '📰', label: 'Local news articles', query: 'Searching local news coverage...' },
  { icon: '💬', label: 'Community forums', query: 'Scanning public comment threads...' },
  { icon: '🏛️', label: 'City council records', query: 'Reviewing meeting minutes...' },
  { icon: '📊', label: 'Property data', query: 'Pulling real estate records...' },
  { icon: '🌊', label: 'Environmental reports', query: 'Checking water authority data...' },
  { icon: '👥', label: 'Social media', query: 'Finding resident reactions...' },
];

function ResearchAgentAnimation({ statusMessage }: { statusMessage: string }) {
  const [visibleSources, setVisibleSources] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleSources(prev => {
        if (prev >= RESEARCH_SOURCES.length) return prev;
        return prev + 1;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full">
      {/* Research agent icon */}
      <div className="relative w-14 h-14 mx-auto mb-5">
        <motion.div
          className="absolute inset-0 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-cyan">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        {/* Orbiting dot */}
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-accent-cyan"
          animate={{
            x: [0, 20, 0, -20, 0],
            y: [-20, 0, 20, 0, -20],
          }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          style={{ top: '50%', left: '50%', marginTop: -4, marginLeft: -4 }}
        />
      </div>

      <p className="text-sm font-semibold text-accent-cyan mb-1">Research Agent Active</p>
      <p className="text-xs text-chamber-muted/60 mb-5">{statusMessage}</p>

      {/* Research sources appearing one by one */}
      <div className="space-y-2 text-left">
        <AnimatePresence>
          {RESEARCH_SOURCES.slice(0, visibleSources).map((source, i) => (
            <motion.div
              key={source.label}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-chamber-surface-2/50 border border-chamber-border/30"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <span className="text-base shrink-0">{source.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-chamber-text">{source.label}</div>
                <div className="text-[10px] text-chamber-muted/50 truncate">{source.query}</div>
              </div>
              {i === visibleSources - 1 ? (
                <motion.div
                  className="w-4 h-4 rounded-full border-2 border-accent-cyan/40 border-t-accent-cyan shrink-0"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                />
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-green-400 shrink-0">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5.5 8l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function TranscriptFeed({ messages, personas, statusMessage }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (messages.length === 0) {
    const isResearching = statusMessage.toLowerCase().includes('research') || statusMessage.toLowerCase().includes('sentiment');
    const isAnalyzing = statusMessage.toLowerCase().includes('analyz') || statusMessage.toLowerCase().includes('document');
    const isGenerating = statusMessage.toLowerCase().includes('persona') || statusMessage.toLowerCase().includes('generating');

    return (
      <div className="glass-card rounded-2xl h-full flex items-center justify-center min-h-[300px]">
        <div className="text-center px-6 py-8 w-full max-w-sm">
          {isResearching ? (
            <ResearchAgentAnimation statusMessage={statusMessage} />
          ) : (
            <>
              {/* Standard loading spinner */}
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-accent-blue/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-blue animate-spin" />
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-accent-cyan animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  {isAnalyzing ? (
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent-blue">
                      <path d="M9 1.5H4a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5V6L9 1.5z" />
                      <path d="M9 1.5V6h4.5" />
                    </svg>
                  ) : isGenerating ? (
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent-blue">
                      <circle cx="8" cy="5" r="3" />
                      <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent-blue">
                      <rect x="2" y="1.5" width="12" height="13" rx="1.5" />
                      <path d="M5 5h6M5 8h6M5 11h3" />
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-sm font-medium text-chamber-text mb-1">{statusMessage}</p>
              <p className="text-xs text-chamber-muted/60">
                {isAnalyzing ? 'Extracting key facts from your document' :
                 isGenerating ? 'Creating realistic debate personas' :
                 'AI agents are preparing for the debate'}
              </p>
            </>
          )}
        </div>
      </div>
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
