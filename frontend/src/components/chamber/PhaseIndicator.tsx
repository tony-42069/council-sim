import type { DebatePhase } from '../../types';

const PHASES: { key: DebatePhase; label: string }[] = [
  { key: 'opening', label: 'Opening' },
  { key: 'public_comment', label: 'Public Comment' },
  { key: 'rebuttal', label: 'Rebuttal' },
  { key: 'council_qa', label: 'Council Q&A' },
  { key: 'deliberation', label: 'Deliberation' },
];

interface Props {
  currentPhase: DebatePhase | null;
  description: string;
}

export default function PhaseIndicator({ currentPhase, description }: Props) {
  const currentIndex = currentPhase
    ? PHASES.findIndex(p => p.key === currentPhase)
    : -1;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-1 mb-2">
        {PHASES.map((phase, i) => {
          const isActive = i === currentIndex;
          const isPast = i < currentIndex;
          return (
            <div key={phase.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-full h-1.5 rounded-full transition-all duration-500 ${
                    isActive
                      ? 'bg-accent-blue shadow-sm shadow-accent-blue/50'
                      : isPast
                        ? 'bg-accent-green'
                        : 'bg-chamber-border'
                  }`}
                />
                <span
                  className={`text-xs mt-1.5 transition-colors ${
                    isActive
                      ? 'text-accent-blue font-semibold'
                      : isPast
                        ? 'text-accent-green'
                        : 'text-chamber-muted/60'
                  }`}
                >
                  {phase.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {description && (
        <p className="text-sm text-chamber-muted text-center italic">{description}</p>
      )}
    </div>
  );
}
