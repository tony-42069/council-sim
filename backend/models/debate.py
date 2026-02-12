from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional
from datetime import datetime


class DebatePhase(str, Enum):
    OPENING = "opening"
    PUBLIC_COMMENT = "public_comment"
    REBUTTAL = "rebuttal"
    COUNCIL_QA = "council_qa"
    DELIBERATION = "deliberation"


class DebateTurn(BaseModel):
    id: str = Field(default_factory=lambda: str(__import__('uuid').uuid4()))
    phase: DebatePhase
    persona_id: str
    persona_name: str
    persona_role: str
    content: str = ""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
