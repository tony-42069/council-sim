import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSimulation } from '../../hooks/useSimulation';
import PhaseIndicator from './PhaseIndicator';
import TranscriptFeed from './TranscriptFeed';
import SpeakerPanel from './SpeakerPanel';
import ResultsDashboard from '../results/ResultsDashboard';

export default function CouncilChamber() {
  const { simulationId } = useParams();
  const navigate = useNavigate();
  const state = useSimulation(simulationId);

  if (!simulationId) {
    navigate('/');
    return null;
  }

  // Show results view when analysis is ready
  if (state.simulationStatus === 'complete' && state.analysis) {
    return (
      <ResultsDashboard
        analysis={state.analysis}
        messages={state.messages}
        personas={state.personas}
        onNewSimulation={() => navigate('/')}
      />
    );
  }

  // Error state
  if (state.simulationStatus === 'error') {
    return (
      <motion.div
        className="max-w-2xl mx-auto text-center py-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-accent-red/10 border border-accent-red/20 flex items-center justify-center mx-auto mb-5">
          <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent-red">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 5v4M8 11h.01" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Simulation Error</h2>
        <p className="text-chamber-muted mb-8 max-w-md mx-auto">{state.error || 'An unexpected error occurred'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan text-white font-medium hover:shadow-lg hover:shadow-accent-blue/20 transition-all"
        >
          Start New Simulation
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Live Badge */}
      <div className="flex items-center justify-center mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-red/10 border border-accent-red/20 text-xs font-medium text-accent-red">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-red opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-red" />
          </span>
          Live Simulation
        </div>
      </div>

      {/* Phase Progress */}
      <PhaseIndicator
        currentPhase={state.currentPhase}
        description={state.phaseDescription}
      />

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Transcript — left 2/3 */}
        <div className="lg:col-span-2">
          <TranscriptFeed
            messages={state.messages}
            personas={state.personas}
            statusMessage={state.statusMessage}
          />
        </div>

        {/* Speaker Panel — right 1/3 */}
        <div>
          <SpeakerPanel
            personas={state.personas}
            currentSpeakerId={state.currentSpeaker?.personaId || null}
          />
        </div>
      </div>
    </motion.div>
  );
}
