import { motion } from 'framer-motion';
import type { DebatePhase } from '../../types';

const PHASES: { key: DebatePhase; label: string; icon: string }[] = [
  { key: 'opening', label: 'Opening', icon: 'M8 1.5v13M4 4.5l4-3 4 3' },
  { key: 'public_comment', label: 'Public Comment', icon: 'M2 4h12v8H8l-3 3v-3H2V4z' },
  { key: 'rebuttal', label: 'Rebuttal', icon: 'M14 4l-6 6-3-3M1 8a7 7 0 1114 0' },
  { key: 'council_qa', label: 'Council Q&A', icon: 'M8 11h.01M6 6a2 2 0 114 0c0 1-1.5 1.5-2 2.5V10' },
  { key: 'deliberation', label: 'Deliberation', icon: 'M3 7l3 3 7-7' },
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
    <div className="mb-6 glass-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-1 sm:gap-2">
        {PHASES.map((phase, i) => {
          const isActive = i === currentIndex;
          const isPast = i < currentIndex;

          return (
            <div key={phase.key} className="flex items-center flex-1 gap-1 sm:gap-2">
              {/* Step */}
              <div className="flex flex-col items-center flex-1">
                {/* Icon circle */}
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center mb-1.5 transition-all duration-500 ${
                  isActive
                    ? 'bg-accent-blue/15 border border-accent-blue/30 shadow-sm shadow-accent-blue/20'
                    : isPast
                      ? 'bg-accent-green/10 border border-accent-green/20'
                      : 'bg-chamber-surface-2 border border-chamber-border/30'
                }`}>
                  {isPast ? (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-green">
                      <path d="M3 8l4 4 6-6" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={
                      isActive ? 'text-accent-blue' : 'text-chamber-muted/40'
                    }>
                      <path d={phase.icon} />
                    </svg>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 rounded-full bg-chamber-border/30 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      isActive
                        ? 'bg-accent-blue'
                        : isPast
                          ? 'bg-accent-green'
                          : 'bg-transparent'
                    }`}
                    initial={{ width: '0%' }}
                    animate={{ width: isActive || isPast ? '100%' : '0%' }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>

                {/* Label */}
                <span className={`text-[10px] sm:text-[11px] mt-1.5 font-medium text-center leading-tight transition-colors ${
                  isActive
                    ? 'text-accent-blue'
                    : isPast
                      ? 'text-accent-green/80'
                      : 'text-chamber-muted/40'
                }`}>
                  {phase.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {description && (
        <p className="text-xs text-chamber-muted text-center mt-3 italic">{description}</p>
      )}
    </div>
  );
}
