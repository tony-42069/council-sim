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
      return { label: 'Moderator', className: 'bg-persona-moderator/20 text-persona-moderator' };
    case 'petitioner':
      return { label: 'Petitioner', className: 'bg-persona-petitioner/20 text-persona-petitioner' };
    case 'council_member':
      return { label: 'Council', className: 'bg-accent-amber/20 text-accent-amber' };
    default:
      return { label: 'Resident', className: 'bg-accent-red/20 text-accent-red' };
  }
}

export default function SpeakerPanel({ personas, currentSpeakerId }: Props) {
  if (personas.length === 0) {
    return (
      <div className="bg-chamber-surface rounded-xl border border-chamber-border p-6">
        <h3 className="text-sm font-semibold text-chamber-muted uppercase tracking-wide mb-4">
          Participants
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-chamber-muted">
            <span className="w-4 h-4 border-2 border-chamber-muted/30 border-t-chamber-muted rounded-full animate-spin" />
            <span className="text-sm">Generating personas...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-chamber-surface rounded-xl border border-chamber-border p-4">
      <h3 className="text-sm font-semibold text-chamber-muted uppercase tracking-wide mb-4">
        Participants
      </h3>
      <div className="space-y-3">
        {personas.map(persona => {
          const isSpeaking = persona.id === currentSpeakerId;
          const badge = getRoleBadge(persona.role);
          return (
            <div
              key={persona.id}
              className={`p-3 rounded-lg border transition-all duration-300 ${
                isSpeaking
                  ? 'border-accent-blue bg-accent-blue/5 shadow-sm shadow-accent-blue/10'
                  : 'border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 transition-all duration-300 ${
                    isSpeaking ? 'ring-2 ring-accent-blue ring-offset-2 ring-offset-chamber-surface' : ''
                  }`}
                  style={{ backgroundColor: persona.color || '#6366f1' }}
                >
                  {getInitials(persona.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-chamber-text truncate">
                      {persona.name}
                    </span>
                    {isSpeaking && (
                      <span className="flex gap-0.5 items-center">
                        <span className="w-1 h-3 bg-accent-blue rounded-full animate-pulse" />
                        <span className="w-1 h-4 bg-accent-blue rounded-full animate-pulse [animation-delay:150ms]" />
                        <span className="w-1 h-2 bg-accent-blue rounded-full animate-pulse [animation-delay:300ms]" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                    {persona.occupation && (
                      <span className="text-xs text-chamber-muted truncate">
                        {persona.occupation}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Show details when speaking */}
              {isSpeaking && persona.primary_concern && (
                <p className="text-xs text-chamber-muted mt-2 pl-13">
                  Concern: {persona.primary_concern}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
