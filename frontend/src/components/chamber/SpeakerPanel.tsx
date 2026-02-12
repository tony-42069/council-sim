import { motion, AnimatePresence } from 'framer-motion';
import type { Persona } from '../../types';

interface Props {
  personas: Persona[];
  currentSpeakerId: string | null;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getRoleBadge(role: string): { label: string; className: string } {
  switch (role) {
    case 'moderator':
      return { label: 'Moderator', className: 'bg-persona-moderator/15 text-persona-moderator border-persona-moderator/20' };
    case 'petitioner':
      return { label: 'Petitioner', className: 'bg-persona-petitioner/15 text-persona-petitioner border-persona-petitioner/20' };
    case 'council_member':
      return { label: 'Council', className: 'bg-accent-amber/15 text-accent-amber border-accent-amber/20' };
    default:
      return { label: 'Resident', className: 'bg-accent-red/15 text-accent-red border-accent-red/20' };
  }
}

export default function SpeakerPanel({ personas, currentSpeakerId }: Props) {
  if (personas.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-chamber-muted">
            <circle cx="6" cy="4" r="2.5" />
            <path d="M1 14c0-3 2.5-5 5-5s5 2 5 5" />
            <circle cx="12" cy="4" r="2" />
            <path d="M15 14c0-2.5-1.5-4-3.5-4" />
          </svg>
          <span className="text-xs font-semibold text-chamber-muted uppercase tracking-wider">Participants</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-shimmer">
              <div className="w-10 h-10 rounded-xl bg-chamber-border/30" />
              <div className="flex-1">
                <div className="w-24 h-3 rounded bg-chamber-border/30 mb-2" />
                <div className="w-16 h-2 rounded bg-chamber-border/20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4 px-1">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-chamber-muted">
          <circle cx="6" cy="4" r="2.5" />
          <path d="M1 14c0-3 2.5-5 5-5s5 2 5 5" />
          <circle cx="12" cy="4" r="2" />
          <path d="M15 14c0-2.5-1.5-4-3.5-4" />
        </svg>
        <span className="text-xs font-semibold text-chamber-muted uppercase tracking-wider">Participants</span>
        <span className="text-[10px] text-chamber-muted/40 ml-auto font-mono">{personas.length}</span>
      </div>
      <div className="space-y-2">
        {personas.map(persona => {
          const isSpeaking = persona.id === currentSpeakerId;
          const badge = getRoleBadge(persona.role);
          const color = persona.color || '#6366f1';

          return (
            <motion.div
              key={persona.id}
              layout
              className={`p-3 rounded-xl transition-all duration-300 ${
                isSpeaking
                  ? 'bg-gradient-to-r from-accent-blue/8 to-transparent border border-accent-blue/20'
                  : 'border border-transparent hover:bg-chamber-surface-2/30'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white transition-all duration-300 ${
                      isSpeaking ? 'shadow-lg' : 'shadow-sm'
                    }`}
                    style={{
                      backgroundColor: color,
                      boxShadow: isSpeaking ? `0 0 20px ${color}40` : undefined,
                    }}
                  >
                    {getInitials(persona.name)}
                  </div>
                  {/* Speaking indicator dot */}
                  <AnimatePresence>
                    {isSpeaking && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-accent-green border-2 border-chamber-surface flex items-center justify-center"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium truncate ${isSpeaking ? 'text-chamber-text' : 'text-chamber-text/80'}`}>
                      {persona.name}
                    </span>
                    {isSpeaking && (
                      <span className="flex gap-[3px] items-end h-3">
                        <motion.span
                          className="w-[3px] rounded-full bg-accent-blue"
                          animate={{ height: ['4px', '12px', '4px'] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        />
                        <motion.span
                          className="w-[3px] rounded-full bg-accent-blue"
                          animate={{ height: ['12px', '4px', '12px'] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                        />
                        <motion.span
                          className="w-[3px] rounded-full bg-accent-blue"
                          animate={{ height: ['4px', '12px', '4px'] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                        />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                    {persona.occupation && (
                      <span className="text-[11px] text-chamber-muted/60 truncate">
                        {persona.occupation}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded details when speaking */}
              <AnimatePresence>
                {isSpeaking && persona.primary_concern && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="text-[11px] text-chamber-muted mt-2 ml-[52px] bg-chamber-bg/40 px-2.5 py-1.5 rounded-lg inline-block">
                      {persona.primary_concern}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
