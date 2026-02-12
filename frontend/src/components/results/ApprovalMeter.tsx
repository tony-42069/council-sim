import { motion } from 'framer-motion';

interface Props {
  score: number;
  label: string;
  reasoning: string;
}

export default function ApprovalMeter({ score, label, reasoning }: Props) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  const getColor = (s: number) => {
    if (s >= 71) return { ring: '#22c55e', glow: 'rgba(34, 197, 94, 0.15)', text: 'text-accent-green', bg: 'bg-accent-green' };
    if (s >= 51) return { ring: '#f59e0b', glow: 'rgba(245, 158, 11, 0.15)', text: 'text-accent-amber', bg: 'bg-accent-amber' };
    if (s >= 31) return { ring: '#f59e0b', glow: 'rgba(245, 158, 11, 0.15)', text: 'text-accent-amber', bg: 'bg-accent-amber' };
    return { ring: '#ef4444', glow: 'rgba(239, 68, 68, 0.15)', text: 'text-accent-red', bg: 'bg-accent-red' };
  };

  const colors = getColor(clampedScore);

  // SVG arc calculation for semi-circle gauge
  const radius = 80;
  const circumference = Math.PI * radius;

  return (
    <div className="glass-card rounded-2xl p-8 sm:p-10 text-center" style={{ boxShadow: `0 0 60px ${colors.glow}` }}>
      <p className="text-[10px] font-bold text-chamber-muted uppercase tracking-[0.2em] mb-8">Approval Likelihood</p>

      <div className="relative inline-block">
        <svg width="240" height="140" viewBox="0 0 240 140">
          {/* Outer glow */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background arc */}
          <path
            d="M 20 125 A 95 95 0 0 1 220 125"
            fill="none"
            stroke="#1e293b"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map(tick => {
            const angle = Math.PI - (tick / 100) * Math.PI;
            const innerR = 78;
            const outerR = 85;
            const cx = 120 + outerR * Math.cos(angle);
            const cy = 125 - outerR * Math.sin(angle);
            const cx2 = 120 + innerR * Math.cos(angle);
            const cy2 = 125 - innerR * Math.sin(angle);
            return (
              <line key={tick} x1={cx2} y1={cy2} x2={cx} y2={cy} stroke="#334155" strokeWidth="1.5" />
            );
          })}

          {/* Animated progress arc */}
          <motion.path
            d="M 20 125 A 95 95 0 0 1 220 125"
            fill="none"
            stroke={colors.ring}
            strokeWidth="10"
            strokeLinecap="round"
            filter="url(#glow)"
            strokeDasharray={circumference * 1.18}
            initial={{ strokeDashoffset: circumference * 1.18 }}
            animate={{ strokeDashoffset: circumference * 1.18 - (clampedScore / 100) * circumference * 1.18 }}
            transition={{ duration: 2, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>

        {/* Score number overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-3">
          <motion.span
            className={`text-6xl font-extrabold ${colors.text} font-mono leading-none`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8, type: 'spring' }}
          >
            {clampedScore}
          </motion.span>
          <motion.span
            className="text-xs text-chamber-muted/50 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            out of 100
          </motion.span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="mt-4"
      >
        <div className="inline-flex items-center gap-2 mb-4">
          <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
          <p className={`text-lg font-bold ${colors.text}`}>{label}</p>
        </div>
        <p className="text-sm text-chamber-muted leading-relaxed max-w-lg mx-auto">
          {reasoning}
        </p>
      </motion.div>
    </div>
  );
}
