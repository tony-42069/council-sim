import { useEffect, useRef } from 'react';
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

export default function TranscriptFeed({ messages, personas, statusMessage }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="bg-chamber-surface rounded-xl border border-chamber-border p-6 min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <span className="w-8 h-8 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
          </div>
          <p className="text-chamber-muted">{statusMessage}</p>
        </div>
      </div>
    );
  }

  // Group messages by phase for visual dividers
  let lastPhase = '';

  return (
    <div className="bg-chamber-surface rounded-xl border border-chamber-border overflow-hidden">
      <div className="p-3 sm:p-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {messages.map(msg => {
          const showPhaseDivider = msg.phase !== lastPhase;
          lastPhase = msg.phase;
          const color = getPersonaColor(msg.persona_id, personas);

          return (
            <div key={msg.turn_id}>
              {showPhaseDivider && (
                <div className="flex items-center gap-3 py-2">
                  <div className="h-px flex-1 bg-chamber-border" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-chamber-muted">
                    {msg.phase.replace('_', ' ')}
                  </span>
                  <div className="h-px flex-1 bg-chamber-border" />
                </div>
              )}

              <div className="flex gap-3">
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-1"
                  style={{ backgroundColor: color }}
                >
                  {getInitials(msg.persona_name)}
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-semibold" style={{ color }}>
                      {msg.persona_name}
                    </span>
                    <span className="text-xs text-chamber-muted capitalize">
                      {msg.persona_role.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-chamber-text leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                    {!msg.is_complete && (
                      <span className="inline-block w-0.5 h-4 bg-accent-blue ml-0.5 animate-pulse align-middle" />
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
