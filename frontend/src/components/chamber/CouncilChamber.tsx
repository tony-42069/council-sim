import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSimulation } from '../../hooks/useSimulation';
import PhaseIndicator from './PhaseIndicator';
import ChamberScene from './ChamberScene';
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

  // Simulation complete but no analysis — show transcript with a note
  if (state.simulationStatus === 'complete' && !state.analysis) {
    return (
      <motion.div
        className="max-w-2xl mx-auto text-center py-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center mx-auto mb-5">
          <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent-amber">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 5v4M8 11h.01" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2 font-display">Debate Complete</h2>
        <p className="text-chamber-muted mb-8 max-w-md mx-auto">
          The debate finished but the analysis step timed out. The transcript is still available above.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan text-white font-medium hover:shadow-lg hover:shadow-accent-blue/20 transition-all"
        >
          Run Another Simulation
        </button>
      </motion.div>
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
        <h2 className="text-2xl font-bold mb-2 font-display">Simulation Error</h2>
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
      className="h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ===== LEFT: Chamber + Controls ===== */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {/* Top bar: Live badge */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-red/10 border border-accent-red/20 text-xs font-medium text-accent-red">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-red opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-red" />
            </span>
            Live Simulation
          </div>
        </div>

        {/* Phase Progress */}
        <div className="shrink-0">
          <PhaseIndicator
            currentPhase={state.currentPhase}
            description={state.phaseDescription}
          />
        </div>

        {/* Visual Council Chamber */}
        <div className="shrink-0">
          <ChamberScene
            personas={state.personas}
            currentSpeakerId={state.currentSpeaker?.personaId || null}
            currentPhase={state.currentPhase}
          />
        </div>

        {/* Speaker Panel — fills remaining space below chamber */}
        <div className="flex-1 min-h-0 overflow-y-auto mt-4">
          <SpeakerPanel
            personas={state.personas}
            currentSpeakerId={state.currentSpeaker?.personaId || null}
          />
        </div>
      </div>

      {/* ===== RIGHT SIDEBAR: Transcript ===== */}
      <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 min-h-0 flex flex-col">
        <TranscriptFeed
          messages={state.messages}
          personas={state.personas}
          statusMessage={state.statusMessage}
          agentId={state.agentId}
          agentStatus={state.agentStatus}
        />
      </div>
    </motion.div>
  );
}
