from typing import Dict, Any, Tuple
from .models import ScoringCriteria, Alternative

WEIGHTS = {
    "objective_compliance": 0.30,
    "technical_feasibility": 0.25,
    "implementation_risk": 0.15,
    "time_effort": 0.10,
    "operational_cost": 0.10,
    "maintainability": 0.10,
}

def calculate_score(criteria_values: Dict[str, float], justifications: Dict[str, str] = None) -> ScoringCriteria:
    """
    Calculates the deterministic weighted score for an alternative.
    Enforces strict 1.0 to 5.0 range and applies exact section 7 weights.
    """
    total = 0.0
    for key, weight in WEIGHTS.items():
        val = float(criteria_values.get(key, 1.0))
        # Clamp strictly between 1.0 and 5.0
        val = max(1.0, min(5.0, val))
        criteria_values[key] = val
        total += val * weight

    return ScoringCriteria(
        objective_compliance=criteria_values["objective_compliance"],
        technical_feasibility=criteria_values["technical_feasibility"],
        implementation_risk=criteria_values["implementation_risk"],
        time_effort=criteria_values["time_effort"],
        operational_cost=criteria_values["operational_cost"],
        maintainability=criteria_values["maintainability"],
        weighted_total=round(total, 2),
        justification=justifications or {}
    )

def evaluate_alternative(alt: Alternative, criteria_values: Dict[str, float], justifications: Dict[str, str] = None) -> Alternative:
    """
    Evaluates an alternative and updates its score object.
    If alternative is excluded, score is preserved but flagged.
    """
    scoring = calculate_score(criteria_values, justifications)
    alt.scores = scoring
    return alt

def rank_alternatives(alternatives: list[Alternative]) -> list[Alternative]:
    """
    Sorts alternatives deterministically:
    1. Valid alternatives ordered by weighted_total descending.
    2. Excluded alternatives placed at the end.
    """
    valid = [a for a in alternatives if not a.is_excluded and a.scores is not None]
    excluded = [a for a in alternatives if a.is_excluded or a.scores is None]

    valid_sorted = sorted(valid, key=lambda a: a.scores.weighted_total, reverse=True)
    return valid_sorted + excluded
