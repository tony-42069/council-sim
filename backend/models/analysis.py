from pydantic import BaseModel, Field


class ArgumentSummary(BaseModel):
    side: str = Field(..., description="'opposition' or 'petitioner'")
    argument: str
    strength: str = Field(..., description="'strong', 'moderate', or 'weak'")
    relevant_data: str = ""


class RecommendedRebuttal(BaseModel):
    concern: str = Field(..., description="The NIMBY concern being addressed")
    rebuttal: str = Field(..., description="Recommended response")
    supporting_data: str = ""
    effectiveness: str = Field(default="moderate", description="'high', 'moderate', or 'low'")


class AnalysisResult(BaseModel):
    approval_score: float = Field(..., ge=0, le=100, description="Likelihood of approval 0-100")
    approval_label: str = Field(default="", description="e.g., 'Likely Approved'")
    approval_reasoning: str = ""
    key_arguments: list[ArgumentSummary] = Field(default_factory=list)
    recommended_rebuttals: list[RecommendedRebuttal] = Field(default_factory=list)
    strongest_opposition_point: str = ""
    weakest_opposition_point: str = ""
    overall_assessment: str = ""
