import type { Persona } from './persona';
import type { AnalysisResult } from './analysis';

export type DebatePhase =
  | 'opening'
  | 'public_comment'
  | 'rebuttal'
  | 'council_qa'
  | 'deliberation';

export interface TranscriptMessage {
  turn_id: string;
  persona_id: string;
  persona_name: string;
  persona_role: string;
  phase: DebatePhase;
  content: string;
  is_complete: boolean;
}

// WebSocket message types
export type WSMessageType =
  | 'phase_change'
  | 'persona_intro'
  | 'speaking_start'
  | 'token'
  | 'speaking_end'
  | 'analysis'
  | 'complete'
  | 'status'
  | 'error';

export interface WSMessage {
  type: WSMessageType;
  payload: Record<string, unknown>;
}

export interface PhaseChangePayload {
  phase: DebatePhase;
  description: string;
}

export interface PersonaIntroPayload extends Persona {}

export interface SpeakingStartPayload {
  turn_id: string;
  persona_id: string;
  persona_name: string;
  phase: DebatePhase;
}

export interface TokenPayload {
  turn_id: string;
  token: string;
  persona_id: string;
}

export interface SpeakingEndPayload {
  turn_id: string;
  persona_id: string;
  full_text: string;
}

export interface AnalysisPayload extends AnalysisResult {}

export interface StatusPayload {
  message: string;
  progress?: number;
}

export interface ErrorPayload {
  message: string;
  phase?: string;
}
