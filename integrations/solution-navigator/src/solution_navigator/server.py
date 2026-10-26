import os
import json
import uuid
from typing import List, Optional, Dict, Any
from mcp.server.fastmcp import FastMCP

from .core.models import (
    NavigatorCase, Evidence, EvidenceType, FailedAttempt, BlockerDiagnosis,
    Alternative, AlternativeCategory, PocPlan, ScoringCriteria
)
from .core.scoring import evaluate_alternative, rank_alternatives, calculate_score
from .core.sanitization import sanitize_text, validate_path
from .core.report_generator import write_case_reports
from .deepseek.client import default_deepseek_client

DEFAULT_STORAGE_DIR = os.path.expanduser("~/.solution-navigator/cases")
os.makedirs(DEFAULT_STORAGE_DIR, exist_ok=True)

mcp = FastMCP("solution-navigator")

# In-memory case cache / repository
cases_cache: Dict[str, NavigatorCase] = {}

def load_case_from_disk(case_id: str) -> Optional[NavigatorCase]:
    case_path = os.path.join(DEFAULT_STORAGE_DIR, case_id, "case.json")
    if os.path.exists(case_path):
        try:
            with open(case_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                case = NavigatorCase(**data)
                cases_cache[case_id] = case
                return case
        except Exception:
            return None
    return None

def save_case_to_disk(case: NavigatorCase):
    cases_cache[case.id] = case
    case_dir = os.path.join(DEFAULT_STORAGE_DIR, case.id)
    os.makedirs(case_dir, exist_ok=True)
    with open(os.path.join(case_dir, "case.json"), "w", encoding="utf-8") as f:
        f.write(case.model_dump_json(indent=2))

@mcp.tool()
def navigator_start_case(
    name: str,
    project_path: str,
    objective: str,
    mandatory_requirements: Optional[List[str]] = None,
    constraints: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Inicia un nuevo expediente de asesoramiento técnico en Solution Navigator.
    No modifica código ni repositorios.
    """
    valid, real_project = validate_path(project_path, "/")
    if not valid:
        return {"success": False, "error": f"Ruta inválida: {project_path}"}

    case_id = f"case-{uuid.uuid4().hex[:8]}"
    case = NavigatorCase(
        id=case_id,
        name=name,
        project_path=real_project,
        objective=objective,
        mandatory_requirements=mandatory_requirements or [],
        constraints=constraints or []
    )
    save_case_to_disk(case)
    return {
        "success": True,
        "case_id": case_id,
        "message": f"Caso '{name}' iniciado con éxito. Objetivo preservado: '{objective}'"
    }

@mcp.tool()
def navigator_collect_evidence(
    case_id: str,
    evidence_type: str,
    content: str,
    file_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Registra evidencias autorizadas (logs, errores, diffs) aplicando sanitización estricta de secretos.
    No lee fuera de rutas autorizadas.
    """
    case = cases_cache.get(case_id) or load_case_from_disk(case_id)
    if not case:
        return {"success": False, "error": f"Caso '{case_id}' no encontrado."}

    # Path traversal validation if file path provided
    if file_path:
        is_valid, real_file = validate_path(file_path, case.project_path)
        if not is_valid:
            return {"success": False, "error": real_file}
        source = real_file
    else:
        source = None

    sanitized_content = sanitize_text(content)
    try:
        ev_type = EvidenceType(evidence_type.upper())
    except ValueError:
        ev_type = EvidenceType.LOG

    evidence_id = f"ev-{len(case.evidences) + 1}"
    ev = Evidence(
        id=evidence_id,
        type=ev_type,
        content=sanitized_content,
        source_path=source
    )
    case.evidences.append(ev)
    save_case_to_disk(case)

    return {
        "success": True,
        "evidence_id": evidence_id,
        "type": ev_type.value,
        "sanitized_length": len(sanitized_content)
    }

@mcp.tool()
def navigator_analyze_blocker(
    case_id: str,
    failed_attempts: Optional[List[Dict[str, str]]] = None,
    mock_response: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Diagnostica la causa raíz del bloqueo distinguiendo hechos de hipótesis.
    """
    case = cases_cache.get(case_id) or load_case_from_disk(case_id)
    if not case:
        return {"success": False, "error": f"Caso '{case_id}' no encontrado."}

    if failed_attempts:
        for fa in failed_attempts:
            case.failed_attempts.append(FailedAttempt(
                strategy=fa.get("strategy", "Estrategia no detallada"),
                outcome=fa.get("outcome", "Fallo"),
                error_message=sanitize_text(fa.get("error_message", "")),
                why_it_failed=fa.get("why_it_failed", "No especificado")
            ))

    # Perform analysis via DeepSeek or use provided mock (for testing)
    if mock_response:
        res = mock_response
    else:
        res = default_deepseek_client.analyze_blocker(
            objective=case.objective,
            evidences=case.evidences,
            failed_attempts=case.failed_attempts
        )

    diagnosis = BlockerDiagnosis(
        root_cause=res.get("root_cause", "Causa indeterminada."),
        confidence=float(res.get("confidence", 0.5)),
        proven_facts=res.get("proven_facts", []),
        hypotheses=res.get("hypotheses", []),
        missing_info=res.get("missing_info", []),
        confirmed_limitations=res.get("confirmed_limitations", [])
    )
    case.diagnosis = diagnosis
    case.status = "DIAGNOSED"
    save_case_to_disk(case)

    return {
        "success": True,
        "root_cause": diagnosis.root_cause,
        "confidence": diagnosis.confidence,
        "facts_count": len(diagnosis.proven_facts),
        "hypotheses_count": len(diagnosis.hypotheses),
        "missing_info": diagnosis.missing_info
    }

@mcp.tool()
def navigator_generate_alternatives(
    case_id: str,
    custom_alternatives: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Genera exactamente siete alternativas técnicas diferenciadas respetando requisitos obligatorios.
    """
    case = cases_cache.get(case_id) or load_case_from_disk(case_id)
    if not case:
        return {"success": False, "error": f"Caso '{case_id}' no encontrado."}

    alternatives_list: List[Alternative] = []

    # If custom alternatives provided (e.g. from fixtures or client)
    if custom_alternatives and len(custom_alternatives) > 0:
        for idx, ca in enumerate(custom_alternatives, 1):
            category_str = ca.get("category", "REPAIR").upper()
            try:
                cat = AlternativeCategory(category_str)
            except ValueError:
                cat = AlternativeCategory.REPAIR

            alt = Alternative(
                id=f"alt-{idx}",
                title=ca.get("title", f"Alternativa {idx}"),
                category=cat,
                description=ca.get("description", ""),
                pros=ca.get("pros", []),
                cons=ca.get("cons", []),
                dependencies=ca.get("dependencies", []),
                estimated_cost=ca.get("estimated_cost", "Bajo"),
                effort=ca.get("effort", "Medio"),
                confidence=ca.get("confidence", "ESTIMADA"),
                is_excluded=ca.get("is_excluded", False),
                exclusion_reason=ca.get("exclusion_reason")
            )
            # Apply initial scores if provided
            crit = ca.get("criteria_estimates")
            if crit:
                evaluate_alternative(alt, crit)
            alternatives_list.append(alt)
    else:
        # Call DeepSeek to formulate the 7 alternatives
        res = default_deepseek_client.generate_seven_alternatives(
            objective=case.objective,
            requirements=case.mandatory_requirements,
            blocker_info=case.diagnosis.dict() if case.diagnosis else {}
        )
        raw_alts = res.get("alternatives", [])
        for idx, ra in enumerate(raw_alts[:7], 1):
            try:
                cat = AlternativeCategory(ra.get("category", "REPAIR").upper())
            except ValueError:
                cat = AlternativeCategory.REPAIR
            alt = Alternative(
                id=f"alt-{idx}",
                title=ra.get("title", f"Alternativa {idx}"),
                category=cat,
                description=ra.get("description", ""),
                pros=ra.get("pros", []),
                cons=ra.get("cons", []),
                dependencies=ra.get("dependencies", []),
                estimated_cost=ra.get("estimated_cost", "Bajo"),
                effort=ra.get("effort", "Medio"),
                confidence=ra.get("confidence", "ESTIMADA")
            )
            if "criteria_estimates" in ra:
                evaluate_alternative(alt, ra["criteria_estimates"])
            alternatives_list.append(alt)

    case.alternatives = alternatives_list
    save_case_to_disk(case)

    return {
        "success": True,
        "total_alternatives": len(alternatives_list),
        "is_exact_seven": len(alternatives_list) == 7,
        "alternatives": [{"id": a.id, "title": a.title, "category": a.category.value} for a in alternatives_list]
    }

@mcp.tool()
def navigator_compare_alternatives(
    case_id: str,
    scores_per_alternative: Optional[Dict[str, Dict[str, float]]] = None
) -> Dict[str, Any]:
    """
    Aplica la matriz matemática determinista con los pesos oficiales de la Sección 7.
    """
    case = cases_cache.get(case_id) or load_case_from_disk(case_id)
    if not case:
        return {"success": False, "error": f"Caso '{case_id}' no encontrado."}

    if scores_per_alternative:
        for alt in case.alternatives:
            if alt.id in scores_per_alternative:
                crit_dict = scores_per_alternative[alt.id]
                evaluate_alternative(alt, crit_dict)

    ranked = rank_alternatives(case.alternatives)
    case.alternatives = ranked
    if ranked and not ranked[0].is_excluded:
        case.recommended_alternative_id = ranked[0].id
    case.status = "EVALUATED"
    save_case_to_disk(case)

    return {
        "success": True,
        "ranked_alternatives": [
            {
                "id": a.id,
                "title": a.title,
                "score": a.scores.weighted_total if a.scores else 0.0,
                "is_excluded": a.is_excluded
            }
            for a in ranked
        ],
        "recommended_id": case.recommended_alternative_id
    }

@mcp.tool()
def navigator_create_report(case_id: str) -> Dict[str, Any]:
    """
    Genera DEBUG_LOG.md, ALTERNATIVES.md, POC_PLAN.md, case.json y report.json
    en el directorio de almacenamiento aislado del caso.
    """
    case = cases_cache.get(case_id) or load_case_from_disk(case_id)
    if not case:
        return {"success": False, "error": f"Caso '{case_id}' no encontrado."}

    written = write_case_reports(case, DEFAULT_STORAGE_DIR)
    return {
        "success": True,
        "files_generated": written,
        "reports_directory": os.path.join(DEFAULT_STORAGE_DIR, case.id)
    }

@mcp.tool()
def navigator_prepare_poc(
    case_id: str,
    alternative_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Produce el plan de Prueba de Concepto (PoC) mínima, verificable y reversible.
    No ejecuta código ni modifica archivos.
    """
    case = cases_cache.get(case_id) or load_case_from_disk(case_id)
    if not case:
        return {"success": False, "error": f"Caso '{case_id}' no encontrado."}

    target_id = alternative_id or case.recommended_alternative_id
    alt = next((a for a in case.alternatives if a.id == target_id), None)
    if not alt:
        return {"success": False, "error": f"Alternativa '{target_id}' no encontrada en el caso."}

    poc = PocPlan(
        alternative_id=alt.id,
        title=f"PoC para {alt.title}",
        objective=f"Validar empíricamente la viabilidad de '{alt.title}' antes de integrarla en el proyecto.",
        prerequisites=[
            "Crear rama aislada 'poc/solution-navigator-check'",
            "Verificar que el entorno disponga de las dependencias requeridas",
            "Aislar pruebas en un entorno de sandbox o test fixture"
        ],
        steps=[
            f"1. Implementar prototipo mínimo de '{alt.title}' en directorio temporal",
            "2. Ejecutar prueba unitaria o de integración de validación",
            "3. Medir impacto en memoria RAM, tiempo y dependencias",
            "4. Comprobar cumplimiento del objetivo original"
        ],
        success_criteria=[
            "El error reproducible original queda resuelto en el entorno de prueba",
            "Cero regresiones en componentes adyacentes",
            "Uso de memoria acotado (<100 MB)",
            "Pruebas unitarias pasan con código de salida 0"
        ],
        possible_failure_modes=[
            "Incompatibilidad de versión de biblioteca",
            "Latencia superior a la aceptable",
            "Dependencia no disponible en Linux Mint"
        ],
        verification_evidence=[
            "Salida de comando de pruebas con resultado PASS",
            "Registro de tiempo de ejecución y consumo de recursos"
        ],
        reversal_plan="Eliminar la rama temporal 'poc/solution-navigator-check' o el directorio aislado. Cero impacto en rama principal."
    )
    case.poc_plan = poc
    save_case_to_disk(case)

    return {
        "success": True,
        "poc_title": poc.title,
        "reversal_guaranteed": True,
        "message": "Plan de PoC generado con éxito. Recuerde: La ejecución debe ser autorizada por el usuario."
    }

@mcp.tool()
def navigator_record_outcome(
    case_id: str,
    user_decision: str,
    learnings: Optional[str] = None
) -> Dict[str, Any]:
    """
    Registra el veredicto final del usuario y las lecciones aprendidas en el historial del caso.
    """
    case = cases_cache.get(case_id) or load_case_from_disk(case_id)
    if not case:
        return {"success": False, "error": f"Caso '{case_id}' no encontrado."}

    case.user_outcome = user_decision
    case.learnings = learnings or "Lecciones registradas."
    case.status = "RESOLVED"
    save_case_to_disk(case)

    return {
        "success": True,
        "case_id": case.id,
        "status": case.status,
        "outcome": user_decision
    }

if __name__ == "__main__":
    mcp.run()
