import { motion } from 'framer-motion';

interface Props {
  score: number;
  label: string;
  reasoning: string;
}

export default function ApprovalMeter({ score, label, reasoning }: Props) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  const getColor = (s: number) => {
    if (s >= 71) return { ring: '#22c55e', bg: 'bg-accent-green', text: 'text-accent-green' };
    if (s >= 51) return { ring: '#f59e0b', bg: 'bg-accent-amber', text: 'text-accent-amber' };
    if (s >= 31) return { ring: '#f59e0b', bg: 'bg-accent-amber', text: 'text-accent-amber' };
    return { ring: '#ef4444', bg: 'bg-accent-red', text: 'text-accent-red' };
  };

  const colors = getColor(clampedScore);

  // SVG arc calculation for semi-circle gauge
  const radius = 80;
  const circumference = Math.PI * radius; // half circle
  const progress = (clampedScore / 100) * circumference;

  return (
    <div className="bg-chamber-surface rounded-xl border border-chamber-border p-8 text-center">
      <p className="text-sm text-chamber-muted uppercase tracking-wide mb-6">Approval Likelihood</p>

      <div className="relative inline-block">
        <svg width="200" height="120" viewBox="0 0 200 120">
          {/* Background arc */}
          <path
            d="M 10 110 A 80 80 0 0 1 190 110"
            fill="none"
            stroke="#2a3a4e"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Animated progress arc */}
          <motion.path
            d="M 10 110 A 80 80 0 0 1 190 110"
            fill="none"
            stroke={colors.ring}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>

        {/* Score number overlay */}
        <div className="absolute inset-0 flex items-end justify-center pb-2">
          <motion.span
            className={`text-5xl font-bold ${colors.text}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            {clampedScore}
          </motion.span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <p className={`text-lg font-semibold ${colors.text} mt-2`}>{label}</p>
        <p className="text-sm text-chamber-muted mt-3 max-w-lg mx-auto leading-relaxed">
          {reasoning}
        </p>
      </motion.div>
    </div>
  );
}
