import { useReducer, useEffect, useCallback, useRef } from 'react';
import { getWebSocketUrl } from '../lib/api';
import type {
  SimulationStatus,
  Persona,
  AnalysisResult,
  TranscriptMessage,
  DebatePhase,
  WSMessage,
} from '../types';

// --- State ---

export interface SimulationState {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  simulationStatus: SimulationStatus;
  currentPhase: DebatePhase | null;
  phaseDescription: string;
  personas: Persona[];
  messages: TranscriptMessage[];
  currentSpeaker: { turnId: string; personaId: string; personaName: string } | null;
  analysis: AnalysisResult | null;
  statusMessage: string;
  error: string | null;
}

const initialState: SimulationState = {
  connectionStatus: 'connecting',
  simulationStatus: 'setup',
  currentPhase: null,
  phaseDescription: '',
  personas: [],
  messages: [],
  currentSpeaker: null,
  analysis: null,
  statusMessage: 'Connecting...',
  error: null,
};

// --- Actions ---

type Action =
  | { type: 'CONNECTED' }
  | { type: 'DISCONNECTED' }
  | { type: 'CONNECTION_ERROR'; error: string }
  | { type: 'PHASE_CHANGE'; phase: DebatePhase; description: string }
  | { type: 'PERSONA_INTRO'; persona: Persona }
  | { type: 'SPEAKING_START'; turnId: string; personaId: string; personaName: string; phase: DebatePhase }
  | { type: 'TOKEN'; turnId: string; token: string; personaId: string }
  | { type: 'SPEAKING_END'; turnId: string; personaId: string; fullText: string }
  | { type: 'ANALYSIS'; analysis: AnalysisResult }
  | { type: 'COMPLETE' }
  | { type: 'STATUS'; message: string }
  | { type: 'ERROR'; message: string };

function reducer(state: SimulationState, action: Action): SimulationState {
  switch (action.type) {
    case 'CONNECTED':
      return { ...state, connectionStatus: 'connected', statusMessage: 'Connected' };

    case 'DISCONNECTED':
      return { ...state, connectionStatus: 'disconnected' };

    case 'CONNECTION_ERROR':
      return { ...state, connectionStatus: 'error', error: action.error };

    case 'PHASE_CHANGE':
      return {
        ...state,
        currentPhase: action.phase,
        phaseDescription: action.description,
        simulationStatus: action.phase as SimulationStatus,
      };

    case 'PERSONA_INTRO':
      return {
        ...state,
        personas: [...state.personas, action.persona],
      };

    case 'SPEAKING_START': {
      const newMessage: TranscriptMessage = {
        turn_id: action.turnId,
        persona_id: action.personaId,
        persona_name: action.personaName,
        persona_role: state.personas.find(p => p.id === action.personaId)?.role || 'resident',
        phase: action.phase,
        content: '',
        is_complete: false,
      };
      return {
        ...state,
        currentSpeaker: {
          turnId: action.turnId,
          personaId: action.personaId,
          personaName: action.personaName,
        },
        messages: [...state.messages, newMessage],
      };
    }

    case 'TOKEN': {
      const messages = state.messages.map(m =>
        m.turn_id === action.turnId
          ? { ...m, content: m.content + action.token }
          : m
      );
      return { ...state, messages };
    }

    case 'SPEAKING_END': {
      const messages = state.messages.map(m =>
        m.turn_id === action.turnId
          ? { ...m, content: action.fullText, is_complete: true }
          : m
      );
      return { ...state, messages, currentSpeaker: null };
    }

    case 'ANALYSIS':
      return {
        ...state,
        analysis: action.analysis,
        simulationStatus: 'analysis',
      };

    case 'COMPLETE':
      return {
        ...state,
        simulationStatus: 'complete',
        currentSpeaker: null,
        statusMessage: 'Simulation complete',
      };

    case 'STATUS':
      return { ...state, statusMessage: action.message };

    case 'ERROR':
      return {
        ...state,
        simulationStatus: 'error',
        error: action.message,
      };

    default:
      return state;
  }
}

// --- Hook ---

export function useSimulation(simulationId: string | undefined) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const wsRef = useRef<WebSocket | null>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const msg: WSMessage = JSON.parse(event.data);
      const p = msg.payload;

      switch (msg.type) {
        case 'phase_change':
          dispatch({
            type: 'PHASE_CHANGE',
            phase: p.phase as DebatePhase,
            description: p.description as string,
          });
          break;

        case 'persona_intro':
          dispatch({ type: 'PERSONA_INTRO', persona: p as unknown as Persona });
          break;

        case 'speaking_start':
          dispatch({
            type: 'SPEAKING_START',
            turnId: p.turn_id as string,
            personaId: p.persona_id as string,
            personaName: p.persona_name as string,
            phase: p.phase as DebatePhase,
          });
          break;

        case 'token':
          dispatch({
            type: 'TOKEN',
            turnId: p.turn_id as string,
            token: p.token as string,
            personaId: p.persona_id as string,
          });
          break;

        case 'speaking_end':
          dispatch({
            type: 'SPEAKING_END',
            turnId: p.turn_id as string,
            personaId: p.persona_id as string,
            fullText: p.full_text as string,
          });
          break;

        case 'analysis':
          dispatch({ type: 'ANALYSIS', analysis: p as unknown as AnalysisResult });
          break;

        case 'complete':
          dispatch({ type: 'COMPLETE' });
          break;

        case 'status':
          dispatch({ type: 'STATUS', message: p.message as string });
          break;

        case 'error':
          dispatch({ type: 'ERROR', message: p.message as string });
          break;
      }
    } catch {
      console.error('Failed to parse WebSocket message');
    }
  }, []);

  useEffect(() => {
    if (!simulationId) return;

    const url = getWebSocketUrl(simulationId);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => dispatch({ type: 'CONNECTED' });
    ws.onmessage = handleMessage;
    ws.onerror = () => dispatch({ type: 'CONNECTION_ERROR', error: 'WebSocket connection failed' });
    ws.onclose = () => dispatch({ type: 'DISCONNECTED' });

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [simulationId, handleMessage]);

  return state;
}
