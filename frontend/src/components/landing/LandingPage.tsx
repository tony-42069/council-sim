import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { extractDocument } from '../../lib/api';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

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
    desc: 'Moderator, petitioner, residents with real NIMBY concerns, and a probing council member',
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
    desc: 'Agent searches the web for actual resident sentiment, news articles, and local context',
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
    desc: 'Weighted analysis produces a 0-100 approval score with specific reasoning',
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
    desc: 'Get specific responses to use in your real council meeting, backed by data',
    color: '#22c55e',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [isExtracting, setIsExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;
    setIsExtracting(true);

    try {
      const extracted = await extractDocument(file);
      // Navigate to setup with extracted data as query params
      const params = new URLSearchParams();
      if (extracted.city_name) params.set('city', extracted.city_name);
      if (extracted.state) params.set('state', extracted.state);
      if (extracted.company_name) params.set('company', extracted.company_name);
      if (extracted.proposal_details) params.set('proposal', extracted.proposal_details);
      if (extracted.concerns?.length) params.set('concerns', extracted.concerns.join(','));
      navigate(`/setup?${params.toString()}`);
    } catch {
      // If extraction fails, still navigate to setup
      navigate('/setup');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <motion.div
        className="text-center pt-8 sm:pt-16 pb-12 sm:pb-16"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-xs font-medium text-accent-purple mb-8">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 1v4M8 11v4M1 8h4M11 8h4" />
            <circle cx="8" cy="8" r="2" />
          </svg>
          Multi-Agent AI Simulation &middot; Powered by Claude Opus 4.6
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-7xl font-normal leading-[1.1] mb-6 font-display">
          Prepare for Your
          <br />
          <span className="text-gradient">City Council</span>{' '}
          <span className="text-gradient-warm">Debate</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-chamber-muted max-w-2xl mx-auto leading-relaxed mb-12">
          Upload your data center proposal and watch 5 AI agents simulate a realistic city council
          meeting. Get approval scoring, opposition arguments, and actionable rebuttals.
        </p>

        {/* CTA: PDF Upload */}
        <motion.div
          className="max-w-xl mx-auto"
          {...fadeIn}
          transition={{ delay: 0.3 }}
        >
          <div
            className={`relative rounded-2xl border-2 border-dashed p-10 sm:p-12 text-center transition-all cursor-pointer group ${
              isExtracting
                ? 'border-accent-blue/50 bg-accent-blue/5'
                : dragOver
                  ? 'border-accent-blue/50 bg-accent-blue/5 scale-[1.01]'
                  : 'border-chamber-border hover:border-accent-blue/30 hover:bg-accent-blue/[0.02]'
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
            {isExtracting ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-accent-blue/10 flex items-center justify-center">
                  <span className="w-6 h-6 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
                </div>
                <div>
                  <p className="text-base font-semibold text-accent-blue">AI is reading your document...</p>
                  <p className="text-sm text-chamber-muted mt-1">Extracting city, company, and proposal details</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-chamber-surface-2 group-hover:bg-accent-blue/10 flex items-center justify-center transition-colors">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-chamber-muted/60 group-hover:text-accent-blue transition-colors">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-medium text-chamber-text">
                    Drop your proposal PDF here
                  </p>
                  <p className="text-sm text-chamber-muted mt-1">
                    or <span className="text-accent-blue font-medium">click to browse</span> &middot; AI auto-fills everything
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Or configure manually */}
          <div className="flex items-center gap-3 mt-6">
            <div className="h-px flex-1 bg-chamber-border/50" />
            <span className="text-xs text-chamber-muted/60">or</span>
            <div className="h-px flex-1 bg-chamber-border/50" />
          </div>

          <button
            onClick={() => navigate('/setup')}
            className="mt-4 text-sm text-accent-blue hover:text-accent-cyan font-medium transition-colors"
          >
            Configure manually without a document &rarr;
          </button>
        </motion.div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-16"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        {FEATURES.map(f => (
          <div key={f.title} className="glass-card rounded-xl p-5 flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${f.color}12`, color: f.color }}
            >
              {f.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-chamber-text mb-1">{f.title}</h3>
              <p className="text-xs text-chamber-muted leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Tech Stack Badge */}
      <motion.div
        className="text-center pb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-chamber-surface/60 border border-chamber-border/30 text-[11px] text-chamber-muted/60">
          <span>Built with</span>
          <span className="text-chamber-text font-medium">Claude Agent SDK</span>
          <span className="w-1 h-1 rounded-full bg-chamber-muted/30" />
          <span className="text-chamber-text font-medium">Opus 4.6</span>
          <span className="w-1 h-1 rounded-full bg-chamber-muted/30" />
          <span className="text-chamber-text font-medium">React</span>
          <span className="w-1 h-1 rounded-full bg-chamber-muted/30" />
          <span className="text-chamber-text font-medium">FastAPI</span>
        </div>
      </motion.div>
    </div>
  );
}
