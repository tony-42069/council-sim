import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSimulation } from '../../hooks/useSimulation';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import PhaseIndicator from './PhaseIndicator';
import ChamberScene from './ChamberScene';
import TranscriptFeed from './TranscriptFeed';
import SpeakerPanel from './SpeakerPanel';
import ResultsDashboard from '../results/ResultsDashboard';

export default function CouncilChamber() {
  const { simulationId } = useParams();
  const navigate = useNavigate();
  const state = useSimulation(simulationId);
  const { speak, stop, toggleMute, isMuted } = useSpeechSynthesis();
  const spokenTurnsRef = useRef<Set<string>>(new Set());

  // Speak completed turns
  useEffect(() => {
    for (const msg of state.messages) {
      if (msg.is_complete && !spokenTurnsRef.current.has(msg.turn_id)) {
        spokenTurnsRef.current.add(msg.turn_id);
        speak(msg.content, msg.persona_id);
      }
    }
  }, [state.messages, speak]);

  // Stop speech on unmount or completion
  useEffect(() => {
    if (state.simulationStatus === 'complete' || state.simulationStatus === 'error') {
      stop();
    }
    return () => stop();
  }, [state.simulationStatus, stop]);

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Live Badge + Audio Toggle */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-red/10 border border-accent-red/20 text-xs font-medium text-accent-red">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-red opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-red" />
          </span>
          Live Simulation
        </div>
        <button
          onClick={toggleMute}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
            isMuted
              ? 'bg-chamber-surface border-chamber-border text-chamber-muted hover:border-accent-blue/30'
              : 'bg-accent-blue/10 border-accent-blue/20 text-accent-blue'
          }`}
          title={isMuted ? 'Enable voice narration' : 'Mute voice narration'}
        >
          {isMuted ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
            </svg>
          )}
          {isMuted ? 'Audio Off' : 'Audio On'}
        </button>
      </div>

      {/* Phase Progress */}
      <PhaseIndicator
        currentPhase={state.currentPhase}
        description={state.phaseDescription}
      />

      {/* Visual Council Chamber */}
      <ChamberScene
        personas={state.personas}
        currentSpeakerId={state.currentSpeaker?.personaId || null}
        currentPhase={state.currentPhase}
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
