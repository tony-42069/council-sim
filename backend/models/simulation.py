from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional
import uuid


class SimulationStatus(str, Enum):
    SETUP = "setup"
    GENERATING_PERSONAS = "generating_personas"
    OPENING = "opening"
    PUBLIC_COMMENT = "public_comment"
    REBUTTAL = "rebuttal"
    COUNCIL_QA = "council_qa"
    DELIBERATION = "deliberation"
    ANALYSIS = "analysis"
    COMPLETE = "complete"
    ERROR = "error"


class SimulationInput(BaseModel):
    city_name: str = Field(..., description="City/town name, e.g., 'Novi, Michigan'")
    state: str = Field(default="", description="State abbreviation, e.g., 'MI'")
    company_name: str = Field(default="", description="Company proposing the data center")
    proposal_details: str = Field(..., description="Description of the proposed data center")
    concerns: list[str] = Field(default_factory=list, description="Key community concerns")
    document_text: Optional[str] = Field(default=None, description="Extracted text from uploaded doc")


class SimulationState(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    input: SimulationInput
    status: SimulationStatus = SimulationStatus.SETUP
    personas: list[dict] = Field(default_factory=list)
    transcript: list[dict] = Field(default_factory=list)
    analysis: Optional[dict] = None
    error: Optional[str] = None
