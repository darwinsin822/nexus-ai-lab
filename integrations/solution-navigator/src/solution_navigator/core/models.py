from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone

class EvidenceType(str, Enum):
    LOG = "LOG"
    ERROR = "ERROR"
    GIT_DIFF = "GIT_DIFF"
    TEST_RESULT = "TEST_RESULT"
    CODE_SNIPPET = "CODE_SNIPPET"
    DOCUMENTATION = "DOCUMENTATION"

class Evidence(BaseModel):
    id: str
    type: EvidenceType
    content: str
    source_path: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FailedAttempt(BaseModel):
    strategy: str
    outcome: str
    error_message: Optional[str] = None
    why_it_failed: str

class BlockerDiagnosis(BaseModel):
    root_cause: str
    confidence: float = Field(ge=0.0, le=1.0)
    proven_facts: List[str] = Field(default_factory=list)
    hypotheses: List[str] = Field(default_factory=list)
    missing_info: List[str] = Field(default_factory=list)
    confirmed_limitations: List[str] = Field(default_factory=list)

class ScoringCriteria(BaseModel):
    objective_compliance: float = Field(ge=1.0, le=5.0)  # 30%
    technical_feasibility: float = Field(ge=1.0, le=5.0) # 25%
    implementation_risk: float = Field(ge=1.0, le=5.0)   # 15% (5 = menor riesgo)
    time_effort: float = Field(ge=1.0, le=5.0)            # 10% (5 = menor esfuerzo)
    operational_cost: float = Field(ge=1.0, le=5.0)       # 10% (5 = menor costo)
    maintainability: float = Field(ge=1.0, le=5.0)        # 10% (5 = mayor mantenibilidad)
    weighted_total: float = 0.0
    justification: Dict[str, str] = Field(default_factory=dict)

class AlternativeCategory(str, Enum):
    REPAIR = "REPAIR"                     # Reparar solución actual
    SIMPLIFICATION = "SIMPLIFICATION"     # Simplificar arquitectura
    SUBSTITUTION = "SUBSTITUTION"         # Sustituir componente problemático
    TECH_CHANGE = "TECH_CHANGE"           # Usar otra tecnología o herramienta
    ARCH_REDESIGN = "ARCH_REDESIGN"       # Cambiar arquitectura de la aplicación
    HYBRID = "HYBRID"                     # Implementación híbrida
    PATH_REDESIGN = "PATH_REDESIGN"       # Rediseñar camino de implementación manteniendo resultado

class Alternative(BaseModel):
    id: str                               # alt-1 .. alt-7
    title: str
    category: AlternativeCategory
    description: str
    pros: List[str] = Field(default_factory=list)
    cons: List[str] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)
    estimated_cost: str
    effort: str
    confidence: str                       # DEMOSTRADA / ESTIMADA
    scores: Optional[ScoringCriteria] = None
    is_excluded: bool = False
    exclusion_reason: Optional[str] = None

class PocPlan(BaseModel):
    alternative_id: str
    title: str
    objective: str
    prerequisites: List[str] = Field(default_factory=list)
    steps: List[str] = Field(default_factory=list)
    success_criteria: List[str] = Field(default_factory=list)
    possible_failure_modes: List[str] = Field(default_factory=list)
    verification_evidence: List[str] = Field(default_factory=list)
    reversal_plan: str

class NavigatorCase(BaseModel):
    id: str
    name: str
    project_path: str
    objective: str
    mandatory_requirements: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    evidences: List[Evidence] = Field(default_factory=list)
    failed_attempts: List[FailedAttempt] = Field(default_factory=list)
    diagnosis: Optional[BlockerDiagnosis] = None
    alternatives: List[Alternative] = Field(default_factory=list)
    recommended_alternative_id: Optional[str] = None
    poc_plan: Optional[PocPlan] = None
    status: str = "OPEN"                   # OPEN, DIAGNOSED, EVALUATED, RESOLVED
    user_outcome: Optional[str] = None
    learnings: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
