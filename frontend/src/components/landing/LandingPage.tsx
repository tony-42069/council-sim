import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { extractDocument, createSimulation } from '../../lib/api';

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="6" cy="4.5" r="2.5" />
        <path d="M1.5 14c0-3 2-5 4.5-5s4.5 2 4.5 5" />
        <circle cx="12" cy="5" r="1.5" />
        <path d="M14.5 14c0-2-1-3.5-2.5-3.5" />
      </svg>
    ),
    title: '5 AI Debate Agents',
    desc: 'Moderator, petitioner, concerned residents, and a probing council member',
    color: '#a855f7',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="7" cy="7" r="5" />
        <path d="M14.5 14.5l-3.6-3.6" />
      </svg>
    ),
    title: 'Real Community Research',
    desc: 'Searches the web for actual resident sentiment, news, and local context',
    color: '#06b6d4',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1.5" y="3" width="13" height="10" rx="1.5" />
        <path d="M4.5 7h2v3h-2zM7.5 5.5h2v4.5h-2zM10.5 6.5h2v3.5h-2z" />
      </svg>
    ),
    title: 'Approval Scoring',
    desc: 'Weighted 0-100 score with factor breakdown and strategic reasoning',
    color: '#f59e0b',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 4l-6 6-3-3" />
        <path d="M1 8a7 7 0 1114 0" />
      </svg>
    ),
    title: 'Actionable Rebuttals',
    desc: 'Specific responses to use in your real council meeting, backed by data',
    color: '#22c55e',
  },
];

const STEPS = [
  { num: '01', label: 'Upload', desc: 'Drop your proposal PDF', color: '#3b82f6' },
  { num: '02', label: 'Simulate', desc: '5 agents debate live', color: '#a855f7' },
  { num: '03', label: 'Prepare', desc: 'Get scoring & rebuttals', color: '#22c55e' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [isExtracting, setIsExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [extractionStep, setExtractionStep] = useState('');

  const handleFile = async (file: File) => {
    if (!file) return;
    setIsExtracting(true);

    try {
      setExtractionStep('Reading document with AI...');
      const extracted = await extractDocument(file);

      setExtractionStep('Launching simulation...');
      const result = await createSimulation({
        city_name: extracted.city_name || 'Unknown City',
        state: extracted.state || '',
        company_name: extracted.company_name || '',
        proposal_details: extracted.proposal_details || 'Data center proposal',
        concerns: extracted.concerns || [],
        document: file,
      });

      navigate(`/simulation/${result.simulation_id}`);
    } catch {
      navigate('/setup');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="relative mx-auto">
      {/* Background illustration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
          style={{ backgroundImage: 'url(/background.png)', backgroundPosition: 'center 60%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-chamber-bg via-chamber-bg/70 to-chamber-bg/30" />
      </div>

      {/* Animated background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-accent-blue/[0.05] blur-[100px]"
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ repeat: Infinity, duration: 20, ease: 'easeInOut' }}
          style={{ top: '5%', left: '10%' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full bg-accent-purple/[0.05] blur-[100px]"
          animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
          transition={{ repeat: Infinity, duration: 15, ease: 'easeInOut' }}
          style={{ top: '30%', right: '5%' }}
        />
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full bg-accent-amber/[0.03] blur-[80px]"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }}
          style={{ bottom: '10%', left: '30%' }}
        />

        {/* Animated cityscape silhouette at bottom */}
        <svg className="absolute bottom-0 left-0 w-full h-[200px] opacity-30" viewBox="0 0 1440 200">
          {/* City Hall */}
          <rect x="100" y="80" width="120" height="120" rx="2" fill="rgba(59,130,246,0.3)" />
          <rect x="130" y="60" width="60" height="20" rx="1" fill="rgba(59,130,246,0.3)" />
          <polygon points="130,60 160,40 190,60" fill="rgba(59,130,246,0.25)" />
          {/* Data Center */}
          <rect x="350" y="60" width="180" height="140" rx="3" fill="rgba(99,102,241,0.3)" />
          <rect x="360" y="70" width="30" height="20" rx="1" fill="rgba(99,102,241,0.15)" />
          <rect x="400" y="70" width="30" height="20" rx="1" fill="rgba(99,102,241,0.15)" />
          <rect x="440" y="70" width="30" height="20" rx="1" fill="rgba(99,102,241,0.15)" />
          <rect x="480" y="70" width="30" height="20" rx="1" fill="rgba(99,102,241,0.15)" />
          {/* Houses */}
          <rect x="620" y="130" width="50" height="70" rx="2" fill="rgba(34,197,94,0.2)" />
          <polygon points="620,130 645,105 670,130" fill="rgba(34,197,94,0.15)" />
          <rect x="690" y="140" width="45" height="60" rx="2" fill="rgba(34,197,94,0.2)" />
          <polygon points="690,140 712,118 735,140" fill="rgba(34,197,94,0.15)" />
          <rect x="755" y="125" width="55" height="75" rx="2" fill="rgba(34,197,94,0.2)" />
          <polygon points="755,125 782,100 810,125" fill="rgba(34,197,94,0.15)" />
          {/* School */}
          <rect x="890" y="100" width="100" height="100" rx="2" fill="rgba(245,158,11,0.2)" />
          <rect x="920" y="85" width="40" height="15" rx="1" fill="rgba(245,158,11,0.2)" />
          {/* Trees */}
          <circle cx="580" cy="160" r="20" fill="rgba(34,197,94,0.1)" />
          <circle cx="850" cy="155" r="18" fill="rgba(34,197,94,0.1)" />
          <circle cx="1050" cy="160" r="22" fill="rgba(34,197,94,0.1)" />
          {/* More buildings far right */}
          <rect x="1060" y="110" width="80" height="90" rx="2" fill="rgba(59,130,246,0.2)" />
          <rect x="1160" y="130" width="60" height="70" rx="2" fill="rgba(59,130,246,0.15)" />
          <rect x="1240" y="100" width="100" height="100" rx="2" fill="rgba(99,102,241,0.2)" />
          {/* Ground line */}
          <rect x="0" y="198" width="1440" height="2" fill="rgba(59,130,246,0.1)" />
        </svg>

        {/* Floating connection lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <motion.line
            x1="20%" y1="30%" x2="40%" y2="50%"
            stroke="rgba(59,130,246,0.5)" strokeWidth="1" strokeDasharray="4 4"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ repeat: Infinity, duration: 4 }}
          />
          <motion.line
            x1="60%" y1="20%" x2="80%" y2="45%"
            stroke="rgba(168,85,247,0.5)" strokeWidth="1" strokeDasharray="4 4"
            animate={{ opacity: [0.5, 0.2, 0.5] }}
            transition={{ repeat: Infinity, duration: 5 }}
          />
          <motion.line
            x1="30%" y1="60%" x2="70%" y2="75%"
            stroke="rgba(6,182,212,0.5)" strokeWidth="1" strokeDasharray="4 4"
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ repeat: Infinity, duration: 3.5 }}
          />
          {/* Floating dots at intersections */}
          <motion.circle
            cx="40%" cy="50%" r="3" fill="rgba(59,130,246,0.4)"
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 3 }}
          />
          <motion.circle
            cx="80%" cy="45%" r="3" fill="rgba(168,85,247,0.4)"
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 4, delay: 1 }}
          />
          <motion.circle
            cx="70%" cy="75%" r="3" fill="rgba(6,182,212,0.4)"
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 3.5, delay: 0.5 }}
          />
        </svg>
      </div>

      {/* ===== HERO SECTION ===== */}
      <div className="relative z-10 text-center pt-12 sm:pt-20 pb-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-purple/8 border border-accent-purple/15 text-xs font-medium text-accent-purple mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse" />
            Multi-Agent AI Simulation &middot; Powered by Claude Opus 4.6
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-5xl sm:text-7xl lg:text-8xl font-normal leading-[1.05] mb-6 font-display"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <span className="text-gradient">City Council</span>
          <br />
          <span className="text-gradient-warm">Simulator</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="text-lg sm:text-xl text-chamber-muted max-w-2xl mx-auto leading-relaxed mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          Prepare for NIMBY opposition before it happens. Upload your data center proposal
          and watch 5 AI agents — residents, a council member, and a moderator — debate it live.
          Get an approval score, identify the strongest opposition arguments, and walk into your
          real council meeting with battle-tested rebuttals.
        </motion.p>

        {/* Steps row */}
        <motion.div
          className="flex items-center justify-center gap-2 sm:gap-4 mb-12"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center gap-3 sm:gap-5">
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: `${s.color}15`, color: s.color }}
                >
                  {s.num}
                </span>
                <div className="text-left">
                  <span className="text-sm font-semibold text-chamber-text block leading-tight">{s.label}</span>
                  <span className="text-xs text-chamber-muted/60 hidden sm:block">{s.desc}</span>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="text-chamber-border/60 shrink-0">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )}
            </div>
          ))}
        </motion.div>
      </div>

      {/* ===== UPLOAD SECTION ===== */}
      <motion.div
        className="relative z-10 max-w-2xl mx-auto mb-16"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div
          className={`relative rounded-2xl border-2 border-dashed p-10 sm:p-14 text-center transition-all duration-300 cursor-pointer group ${
            isExtracting
              ? 'border-accent-blue/40 bg-accent-blue/5 shadow-lg shadow-accent-blue/10'
              : dragOver
                ? 'border-accent-blue/50 bg-accent-blue/5 scale-[1.01] shadow-lg shadow-accent-blue/10'
                : 'border-chamber-border/60 hover:border-accent-blue/30 hover:bg-accent-blue/[0.02] hover:shadow-lg hover:shadow-accent-blue/5'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onClick={() => {
            if (isExtracting) return;
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf,.txt,.doc,.docx';
            input.onchange = (ev) => {
              const file = (ev.target as HTMLInputElement).files?.[0];
              if (file) handleFile(file);
            };
            input.click();
          }}
        >
          {/* Background glow when hovering */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-accent-blue/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          {isExtracting ? (
            <div className="flex flex-col items-center gap-5">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-2xl bg-accent-blue/10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-7 h-7 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
                </div>
                {/* Orbiting particles */}
                <motion.div
                  className="absolute w-2 h-2 rounded-full bg-accent-cyan"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  style={{ top: -4, left: '50%', marginLeft: -4, transformOrigin: '4px 36px' }}
                />
              </div>
              <div>
                <p className="text-base font-semibold text-accent-blue">{extractionStep}</p>
                <p className="text-sm text-chamber-muted mt-1.5">This will only take a few moments</p>
              </div>
              {/* Progress bar */}
              <div className="w-48 h-1 rounded-full bg-chamber-border/30 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-accent-blue"
                  animate={{ width: ['0%', '60%', '80%', '95%'] }}
                  transition={{ duration: 12, ease: 'easeOut' }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-chamber-surface-2 group-hover:bg-accent-blue/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-chamber-muted/50 group-hover:text-accent-blue transition-colors">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-chamber-text">
                  Drop your proposal PDF here
                </p>
                <p className="text-sm text-chamber-muted mt-1.5">
                  or <span className="text-accent-blue font-medium group-hover:underline">click to browse</span> — AI reads it and launches the simulation
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-chamber-muted/40">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 1v14M1 8h14" />
                </svg>
                Supports PDF up to 100+ pages
              </div>
            </div>
          )}
        </div>

        {/* Manual option */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <div className="h-px w-16 bg-chamber-border/40" />
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/setup'); }}
            className="text-xs text-chamber-muted/60 hover:text-accent-blue font-medium transition-colors"
          >
            or configure manually
          </button>
          <div className="h-px w-16 bg-chamber-border/40" />
        </div>
      </motion.div>

      {/* ===== FEATURES ===== */}
      <motion.div
        className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            className="glass-card rounded-xl p-5 group hover:border-chamber-border-light/50 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: `${f.color}10`, color: f.color }}
            >
              {f.icon}
            </div>
            <h3 className="text-sm font-semibold text-chamber-text mb-1">{f.title}</h3>
            <p className="text-[11px] text-chamber-muted/70 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ===== TECH FOOTER ===== */}
      <motion.div
        className="relative z-10 text-center pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-chamber-surface/40 border border-chamber-border/20 text-[11px] text-chamber-muted/50">
          <span>Built with</span>
          <span className="text-chamber-text/70 font-medium">Claude Agent SDK</span>
          <span className="w-0.5 h-0.5 rounded-full bg-chamber-muted/30" />
          <span className="text-chamber-text/70 font-medium">Opus 4.6</span>
          <span className="w-0.5 h-0.5 rounded-full bg-chamber-muted/30" />
          <span className="text-chamber-text/70 font-medium">4 Autonomous Agents</span>
        </div>
      </motion.div>
    </div>
  );
}
