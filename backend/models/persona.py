from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional


class PersonaRole(str, Enum):
    MODERATOR = "moderator"
    PETITIONER = "petitioner"
    RESIDENT = "resident"
    COUNCIL_MEMBER = "council_member"


class PersonaArchetype(str, Enum):
    CONCERNED_PARENT = "concerned_parent"
    ENVIRONMENTAL_ACTIVIST = "environmental_activist"
    PROPERTY_OWNER = "property_owner"
    LOCAL_BUSINESS_OWNER = "local_business_owner"
    FISCAL_CONSERVATIVE = "fiscal_conservative"
    LONGTIME_RESIDENT = "longtime_resident"


class Persona(BaseModel):
    id: str
    name: str
    role: PersonaRole
    archetype: Optional[PersonaArchetype] = None
    age: Optional[int] = None
    occupation: str = ""
    background: str = ""
    speaking_style: str = ""
    primary_concern: str = ""
    secondary_concerns: list[str] = Field(default_factory=list)
    intensity: int = Field(default=5, ge=1, le=10, description="How strongly they feel (1-10)")
    system_prompt: str = ""
    color: str = Field(default="#6366f1", description="Display color for UI")
