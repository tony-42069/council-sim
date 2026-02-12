import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSimulation } from '../../lib/api';

const CONCERN_OPTIONS = [
  { id: 'water', label: 'Water Usage', desc: 'High water consumption for cooling systems' },
  { id: 'power', label: 'Power Grid Strain', desc: 'Increased electricity demand on local grid' },
  { id: 'noise', label: 'Noise Pollution', desc: 'Generator and cooling system noise' },
  { id: 'traffic', label: 'Traffic Impact', desc: 'Construction and operational traffic' },
  { id: 'property', label: 'Property Values', desc: 'Impact on nearby home values' },
  { id: 'environmental', label: 'Environmental Impact', desc: 'Carbon footprint and land use' },
];

const PRESET_SCENARIOS = [
  {
    label: 'Novi, Michigan',
    city: 'Novi',
    state: 'MI',
    company: 'Great Lakes Data Systems',
    proposal: 'A 150,000 sq ft hyperscale data center with 30MW capacity on the former Expo Center site off I-96. The facility would use advanced liquid cooling, create 75 permanent jobs, and generate $3.2M in annual tax revenue.',
    concerns: ['water', 'power', 'noise', 'property'],
  },
  {
    label: 'Plymouth Township, MI',
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

export default function SetupForm() {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [company, setCompany] = useState('');
  const [proposal, setProposal] = useState('');
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [document, setDocument] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleConcern = (id: string) => {
    setSelectedConcerns(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
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
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">Start a Simulation</h2>
        <p className="text-chamber-muted text-lg">
          Enter your data center proposal details to simulate a city council debate.
        </p>
      </div>

      {/* Preset Quick-Start */}
      <div className="mb-8">
        <p className="text-sm text-chamber-muted mb-3">Quick start with a preset scenario:</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_SCENARIOS.map(preset => (
            <button
              key={preset.label}
              type="button"
              onClick={() => loadPreset(preset)}
              className="px-4 py-2 rounded-lg bg-chamber-surface border border-chamber-border text-sm text-chamber-text hover:border-accent-blue hover:text-accent-blue transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* City + State */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">City / Town *</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g., Novi"
              className="w-full px-4 py-3 rounded-lg bg-chamber-surface border border-chamber-border text-chamber-text placeholder:text-chamber-muted/50 focus:outline-none focus:border-accent-blue transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">State</label>
            <input
              type="text"
              value={state}
              onChange={e => setState(e.target.value)}
              placeholder="MI"
              maxLength={2}
              className="w-full px-4 py-3 rounded-lg bg-chamber-surface border border-chamber-border text-chamber-text placeholder:text-chamber-muted/50 focus:outline-none focus:border-accent-blue transition-colors uppercase"
            />
          </div>
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Company Name</label>
          <input
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="e.g., Great Lakes Data Systems"
            className="w-full px-4 py-3 rounded-lg bg-chamber-surface border border-chamber-border text-chamber-text placeholder:text-chamber-muted/50 focus:outline-none focus:border-accent-blue transition-colors"
          />
        </div>

        {/* Proposal Details */}
        <div>
          <label className="block text-sm font-medium mb-2">Proposal Details *</label>
          <textarea
            value={proposal}
            onChange={e => setProposal(e.target.value)}
            placeholder="Describe the data center proposal: size, location, capacity, jobs created, community benefits..."
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-chamber-surface border border-chamber-border text-chamber-text placeholder:text-chamber-muted/50 focus:outline-none focus:border-accent-blue transition-colors resize-none"
          />
        </div>

        {/* Document Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Proposal Document <span className="text-chamber-muted font-normal">(optional PDF)</span>
          </label>
          <div
            className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              document
                ? 'border-accent-blue bg-accent-blue/5'
                : 'border-chamber-border hover:border-chamber-muted'
            }`}
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-accent-blue'); }}
            onDragLeave={e => { e.currentTarget.classList.remove('border-accent-blue'); }}
            onDrop={e => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-accent-blue');
              const file = e.dataTransfer.files[0];
              if (file && file.type === 'application/pdf') setDocument(file);
            }}
          >
            {document ? (
              <div className="flex items-center justify-center gap-3">
                <span className="text-sm text-accent-blue font-medium">{document.name}</span>
                <button
                  type="button"
                  onClick={() => setDocument(null)}
                  className="text-xs text-chamber-muted hover:text-accent-red transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-chamber-muted mb-1">
                  Drag & drop a PDF here, or{' '}
                  <label className="text-accent-blue cursor-pointer hover:underline">
                    browse
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setDocument(file);
                      }}
                    />
                  </label>
                </p>
                <p className="text-xs text-chamber-muted/60">
                  The AI will extract and analyze proposal details from your document
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Concerns */}
        <div>
          <label className="block text-sm font-medium mb-3">Community Concerns</label>
          <div className="grid grid-cols-2 gap-3">
            {CONCERN_OPTIONS.map(concern => (
              <button
                key={concern.id}
                type="button"
                onClick={() => toggleConcern(concern.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedConcerns.includes(concern.id)
                    ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
                    : 'border-chamber-border bg-chamber-surface text-chamber-text hover:border-chamber-muted'
                }`}
              >
                <span className="text-sm font-medium">{concern.label}</span>
                <span className="block text-xs text-chamber-muted mt-0.5">{concern.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
            isValid && !isSubmitting
              ? 'bg-accent-blue text-white hover:bg-accent-blue/90 shadow-lg shadow-accent-blue/20'
              : 'bg-chamber-surface text-chamber-muted border border-chamber-border cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Starting Simulation...
            </span>
          ) : (
            'Start City Council Simulation'
          )}
        </button>
      </form>
    </div>
  );
}
