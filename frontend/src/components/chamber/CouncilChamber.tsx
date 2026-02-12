import { useParams, useNavigate } from 'react-router-dom';
import { useSimulation } from '../../hooks/useSimulation';
import PhaseIndicator from './PhaseIndicator';
import TranscriptFeed from './TranscriptFeed';
import SpeakerPanel from './SpeakerPanel';
import ResultsDashboard from '../results/ResultsDashboard';

export default function CouncilChamber() {
  const { simulationId } = useParams<{ simulationId: string }>();
  const navigate = useNavigate();
  const state = useSimulation(simulationId);

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
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-accent-red/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-accent-red">!</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Simulation Error</h2>
        <p className="text-chamber-muted mb-6">{state.error || 'An unexpected error occurred'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-lg bg-accent-blue text-white font-medium hover:bg-accent-blue/90 transition-colors"
        >
          Start New Simulation
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Phase Progress */}
      <PhaseIndicator
        currentPhase={state.currentPhase}
        description={state.phaseDescription}
      />

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
    </div>
  );
}
