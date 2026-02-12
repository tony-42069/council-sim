export interface ArgumentSummary {
  side: 'opposition' | 'petitioner';
  argument: string;
  strength: 'strong' | 'moderate' | 'weak';
  relevant_data: string;
}

export interface RecommendedRebuttal {
  concern: string;
  rebuttal: string;
  supporting_data: string;
  effectiveness: 'high' | 'moderate' | 'low';
}

export interface AnalysisResult {
  approval_score: number;
  approval_label: string;
  approval_reasoning: string;
  key_arguments: ArgumentSummary[];
  recommended_rebuttals: RecommendedRebuttal[];
  strongest_opposition_point: string;
  weakest_opposition_point: string;
  overall_assessment: string;
}
