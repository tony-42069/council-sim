import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createSimulation, extractDocument } from '../../lib/api';

const CONCERN_OPTIONS = [
  { id: 'water', label: 'Water Usage', desc: 'Cooling system consumption', icon: '\u{1F4A7}' },
  { id: 'power', label: 'Power Grid', desc: 'Electricity demand strain', icon: '\u26A1' },
  { id: 'noise', label: 'Noise', desc: 'Generator & cooling noise', icon: '\u{1F50A}' },
  { id: 'traffic', label: 'Traffic', desc: 'Construction & operations', icon: '\u{1F697}' },
  { id: 'property', label: 'Property Values', desc: 'Impact on home prices', icon: '\u{1F3E0}' },
  { id: 'environmental', label: 'Environment', desc: 'Emissions & land use', icon: '\u{1F33F}' },
];

const PRESET_SCENARIOS = [
  {
    label: 'Novi, MI',
    city: 'Novi',
    state: 'MI',
    company: 'Great Lakes Data Systems',
    proposal: 'A 150,000 sq ft hyperscale data center with 30MW capacity on the former Expo Center site off I-96. The facility would use advanced liquid cooling, create 75 permanent jobs, and generate $3.2M in annual tax revenue.',
    concerns: ['water', 'power', 'noise', 'property'],
  },
  {
    label: 'Plymouth Twp, MI',
    city: 'Plymouth Township',
    state: 'MI',
    company: 'Midwest Cloud Infrastructure',
    proposal: 'A 100,000 sq ft data center campus on M-14 corridor near the former Unisys site. Two-phase build with 20MW initial capacity. Includes a community fiber broadband commitment and 50 permanent tech jobs.',
    concerns: ['traffic', 'noise', 'environmental', 'power'],
  },
  {
    label: 'Rochester Hills, MI',
    city: 'Rochester Hills',
    state: 'MI',
    company: 'Automation Alley Data',
    proposal: 'An AI-focused 80,000 sq ft data center near Oakland University on University Drive. 15MW capacity using geothermal cooling. Partnership with OU for workforce development. 40 permanent jobs.',
    concerns: ['water', 'environmental', 'property', 'noise'],
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function SetupForm() {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [company, setCompany] = useState('');
  const [proposal, setProposal] = useState('');
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [document, setDocument] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState('');

  const toggleConcern = (id: string) => {
    setSelectedConcerns(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleDocumentUpload = async (file: File) => {
    setDocument(file);
    setIsExtracting(true);
    setError('');

    try {
      const extracted = await extractDocument(file);
      if (extracted.city_name) setCity(extracted.city_name);
      if (extracted.state) setState(extracted.state);
      if (extracted.company_name) setCompany(extracted.company_name);
      if (extracted.proposal_details) setProposal(extracted.proposal_details);
      if (extracted.concerns?.length) {
        const validConcerns = extracted.concerns.filter(c =>
          CONCERN_OPTIONS.some(opt => opt.id === c)
        );
        if (validConcerns.length) setSelectedConcerns(validConcerns);
      }
    } catch (err) {
      console.error('Document extraction failed:', err);
      // Silently continue — user can still fill manually
    } finally {
      setIsExtracting(false);
    }
  };

  const loadPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setCity(preset.city);
    setState(preset.state);
    setCompany(preset.company);
    setProposal(preset.proposal);
    setSelectedConcerns(preset.concerns);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await createSimulation({
        city_name: city,
        state,
        company_name: company,
        proposal_details: proposal,
        concerns: selectedConcerns,
        document: document || undefined,
      });
      navigate(`/simulation/${result.simulation_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create simulation');
      setIsSubmitting(false);
    }
  };

  const isValid = city.trim() && proposal.trim();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <motion.div
        className="text-center mb-10 sm:mb-14"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-xs font-medium text-accent-blue mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
          Multi-Agent AI Simulation
        </div>
        <h2 className="text-5xl sm:text-6xl font-normal mb-4 leading-tight font-display">
          Simulate Your{' '}
          <span className="text-gradient">City Council</span>
          <br />
          <span className="text-gradient-warm">Debate</span>
        </h2>
        <p className="text-chamber-muted text-lg max-w-2xl mx-auto leading-relaxed">
          Upload a proposal PDF and our AI agents handle the rest — or fill in the details manually.
          Watch a live debate, then get approval scoring and actionable rebuttals.
        </p>
      </motion.div>

      {/* Quick Start Presets */}
      <motion.div
        className="mb-8"
        {...fadeInUp}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-semibold text-chamber-muted uppercase tracking-wider">Quick Start</span>
          <div className="h-px flex-1 bg-chamber-border/50" />
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_SCENARIOS.map(preset => (
            <button
              key={preset.label}
              type="button"
              onClick={() => loadPreset(preset)}
              className="group px-4 py-2.5 rounded-xl glass-card-hover text-sm text-chamber-text flex items-center gap-2"
            >
              <span className="w-5 h-5 rounded-md bg-accent-blue/10 flex items-center justify-center text-[10px] font-bold text-accent-blue group-hover:bg-accent-blue group-hover:text-white transition-colors">
                {preset.state}
              </span>
              {preset.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Document Upload Card — PRIMARY ACTION */}
        <motion.div
          className="glass-card rounded-2xl p-6 sm:p-8 mb-5 relative overflow-hidden"
          {...fadeInUp}
          transition={{ delay: 0.2 }}
        >
          {/* Subtle highlight border for primary action */}
          <div className="absolute inset-0 rounded-2xl border border-accent-blue/20 pointer-events-none" />

          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center text-accent-blue text-sm">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 1.5H4a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5V6L9 1.5z" />
                <path d="M9 1.5V6h4.5" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-normal font-display">Upload Proposal Document</h3>
              <p className="text-xs text-chamber-muted">Drop a PDF and AI auto-fills everything below</p>
            </div>
          </div>

          <div
            className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
              document
                ? 'border-accent-blue/40 bg-accent-blue/5'
                : 'border-chamber-border hover:border-accent-blue/30'
            }`}
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-accent-blue/50'); }}
            onDragLeave={e => { e.currentTarget.classList.remove('border-accent-blue/50'); }}
            onDrop={e => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-accent-blue/50');
              const file = e.dataTransfer.files[0];
              if (file && file.type === 'application/pdf') handleDocumentUpload(file);
            }}
            onClick={() => {
              if (!document) {
                const input = window.document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf';
                input.onchange = (ev) => {
                  const file = (ev.target as HTMLInputElement).files?.[0];
                  if (file) handleDocumentUpload(file);
                };
                input.click();
              }
            }}
          >
            {document ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center">
                  {isExtracting ? (
                    <span className="w-5 h-5 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent-blue">
                      <path d="M9 1.5H4a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5V6L9 1.5z" />
                      <path d="M9 1.5V6h4.5" />
                    </svg>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-accent-blue">{document.name}</p>
                  <p className="text-xs text-chamber-muted">
                    {isExtracting ? 'AI is reading and extracting details...' : `${(document.size / 1024 / 1024).toFixed(1)} MB — Fields auto-filled`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDocument(null); }}
                  className="ml-4 text-xs px-3 py-1.5 rounded-lg border border-chamber-border text-chamber-muted hover:text-accent-red hover:border-accent-red/30 transition-colors"
                  disabled={isExtracting}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-xl bg-chamber-surface-2 flex items-center justify-center mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-chamber-muted/60">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                </div>
                <p className="text-sm text-chamber-muted mb-1">
                  Drop a PDF here or <span className="text-accent-blue font-medium">browse files</span>
                </p>
                <p className="text-[11px] text-chamber-muted/40">
                  Supports large documents (70+ pages) with smart extraction
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Divider — or fill manually */}
        <motion.div
          className="flex items-center gap-3 my-6"
          {...fadeInUp}
          transition={{ delay: 0.25 }}
        >
          <div className="h-px flex-1 bg-chamber-border/50" />
          <span className="text-xs font-semibold text-chamber-muted uppercase tracking-wider">Review & Customize</span>
          <div className="h-px flex-1 bg-chamber-border/50" />
        </motion.div>

        {/* Location Card */}
        <motion.div
          className="glass-card rounded-2xl p-6 sm:p-8 mb-5"
          {...fadeInUp}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center text-accent-blue text-sm">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6C3.5 9.5 8 14.5 8 14.5S12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5Z" />
                <circle cx="8" cy="6" r="2" />
              </svg>
            </div>
            <h3 className="text-lg font-normal font-display">Location & Company</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-chamber-muted mb-1.5 uppercase tracking-wider">
                City / Township *
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g., Van Buren Township"
                className="w-full px-4 py-3 rounded-xl bg-chamber-bg/60 border border-chamber-border text-chamber-text placeholder:text-chamber-muted/40 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-chamber-muted mb-1.5 uppercase tracking-wider">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={e => setState(e.target.value)}
                placeholder="MI"
                maxLength={2}
                className="w-full px-4 py-3 rounded-xl bg-chamber-bg/60 border border-chamber-border text-chamber-text placeholder:text-chamber-muted/40 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20 transition-all text-sm uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-chamber-muted mb-1.5 uppercase tracking-wider">
                Company
              </label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Optional"
                className="w-full px-4 py-3 rounded-xl bg-chamber-bg/60 border border-chamber-border text-chamber-text placeholder:text-chamber-muted/40 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20 transition-all text-sm"
              />
            </div>
          </div>
        </motion.div>

        {/* Proposal Card */}
        <motion.div
          className="glass-card rounded-2xl p-6 sm:p-8 mb-5"
          {...fadeInUp}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center text-accent-cyan text-sm">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="1.5" width="12" height="13" rx="1.5" />
                <path d="M5 5h6M5 8h6M5 11h3" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-normal font-display">Proposal Details *</h3>
              <p className="text-xs text-chamber-muted">Auto-filled from document — edit to refine</p>
            </div>
          </div>

          <textarea
            value={proposal}
            onChange={e => setProposal(e.target.value)}
            placeholder="Upload a PDF above to auto-fill, or describe the proposal manually: facility size, power capacity, water usage, location, jobs, tax revenue, community commitments..."
            rows={6}
            className="w-full px-4 py-3 rounded-xl bg-chamber-bg/60 border border-chamber-border text-chamber-text placeholder:text-chamber-muted/40 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20 transition-all text-sm leading-relaxed resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] text-chamber-muted/50">
              More detail = more realistic debate
            </p>
            <p className="text-[11px] text-chamber-muted/50 font-mono">
              {proposal.length.toLocaleString()} chars
            </p>
          </div>
        </motion.div>

        {/* Concerns Card */}
        <motion.div
          className="glass-card rounded-2xl p-6 sm:p-8 mb-8"
          {...fadeInUp}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-accent-red/10 flex items-center justify-center text-accent-red text-sm">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M8 5v4M8 11h.01" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-normal font-display">Community Concerns</h3>
              <p className="text-xs text-chamber-muted">Select topics the AI residents will argue about</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CONCERN_OPTIONS.map(concern => {
              const selected = selectedConcerns.includes(concern.id);
              return (
                <button
                  key={concern.id}
                  type="button"
                  onClick={() => toggleConcern(concern.id)}
                  className={`group relative p-4 rounded-xl border text-left transition-all duration-200 ${
                    selected
                      ? 'border-accent-blue/40 bg-accent-blue/8 shadow-sm shadow-accent-blue/10'
                      : 'border-chamber-border/50 bg-chamber-bg/40 hover:border-chamber-border-light hover:bg-chamber-bg/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg leading-none mt-0.5">{concern.icon}</span>
                    <div>
                      <span className={`text-sm font-medium block ${selected ? 'text-accent-blue' : 'text-chamber-text'}`}>
                        {concern.label}
                      </span>
                      <span className="text-xs text-chamber-muted mt-0.5 block">{concern.desc}</span>
                    </div>
                  </div>
                  {/* Check indicator */}
                  <div className={`absolute top-3 right-3 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    selected
                      ? 'border-accent-blue bg-accent-blue'
                      : 'border-chamber-border group-hover:border-chamber-muted'
                  }`}>
                    {selected && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2">
                        <path d="M2.5 6l2.5 2.5 4.5-5" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            className="p-4 rounded-xl bg-accent-red/8 border border-accent-red/20 text-accent-red text-sm mb-6 flex items-center gap-3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M8 5v4M8 11h.01" />
            </svg>
            {error}
          </motion.div>
        )}

        {/* Submit */}
        <motion.div {...fadeInUp} transition={{ delay: 0.5 }}>
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`w-full py-4 rounded-xl font-semibold text-base transition-all duration-300 relative overflow-hidden ${
              isValid && !isSubmitting
                ? 'bg-gradient-to-r from-accent-blue to-accent-cyan text-white shadow-lg shadow-accent-blue/25 hover:shadow-accent-blue/40 hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-chamber-surface text-chamber-muted border border-chamber-border cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Initializing AI Agents...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Start Council Simulation
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </span>
            )}
          </button>
          <p className="text-center text-[11px] text-chamber-muted/40 mt-3">
            Simulation takes 2-3 minutes with 5 AI agents debating your proposal
          </p>
        </motion.div>
      </form>
    </div>
  );
}
