export type SimulationStatus =
  | 'setup'
  | 'generating_personas'
  | 'opening'
  | 'public_comment'
  | 'rebuttal'
  | 'council_qa'
  | 'deliberation'
  | 'analysis'
  | 'complete'
  | 'error';

export interface SimulationInput {
  city_name: string;
  state: string;
  company_name: string;
  proposal_details: string;
  concerns: string[];
  document_text?: string;
}

export interface SimulationState {
  id: string;
  input: SimulationInput;
  status: SimulationStatus;
  personas: Persona[];
  transcript: TranscriptMessage[];
  analysis: AnalysisResult | null;
  error: string | null;
}

// Re-export from other type files for convenience
import type { Persona } from './persona';
import type { TranscriptMessage } from './websocket';
import type { AnalysisResult } from './analysis';
export type { Persona, TranscriptMessage, AnalysisResult };
