import os
import json
from .models import NavigatorCase

def generate_debug_log_md(case: NavigatorCase) -> str:
    diag = case.diagnosis
    facts = "\n".join(f"- {f}" for f in (diag.proven_facts if diag else [])) or "- No se registraron hechos comprobados aún."
    hyps = "\n".join(f"- {h}" for h in (diag.hypotheses if diag else [])) or "- Ninguna hipótesis formulada."
    missing = "\n".join(f"- {m}" for m in (diag.missing_info if diag else [])) or "- Información completa para el diagnóstico actual."
    limits = "\n".join(f"- {l}" for l in (diag.confirmed_limitations if diag else [])) or "- Sin limitaciones externas confirmadas."

    attempts_md = ""
    if case.failed_attempts:
        for idx, att in enumerate(case.failed_attempts, 1):
            attempts_md += f"""
### Intento {idx}: {att.strategy}
- **Resultado:** {att.outcome}
- **Error Observado:** `{att.error_message or 'N/A'}`
- **Causa del Fallo:** {att.why_it_failed}
"""
    else:
        attempts_md = "_No se han documentado intentos fallidos previos._\n"

    return f"""# 🔍 DEBUG LOG & ANTECEDENTES TÉCNICOS
**Caso:** `{case.id}` — {case.name}  
**Fecha:** {case.updated_at}  
**Objetivo Original:** {case.objective}

---

## 1. Hechos Comprobados (Evidencias Técnicas)
{facts}

---

## 2. Intentos Fallidos Previos de Resolución
{attempts_md}

---

## 3. Hipótesis Causal y Nivel de Confianza
- **Causa Raíz Diagnosticada:** {diag.root_cause if diag else 'Diagnóstico pendiente'}
- **Nivel de Confianza:** {f"{diag.confidence * 100:.0f}%" if diag else 'N/A'}

{hyps}

---

## 4. Limitaciones Confirmadas del Entorno
{limits}

---

## 5. Información Faltante Necesaria
{missing}
"""

def generate_alternatives_md(case: NavigatorCase) -> str:
    table_rows = []
    for a in case.alternatives:
        status_badge = "❌ DESCARTADA" if a.is_excluded else "✅ VIABLE"
        score_val = f"{a.scores.weighted_total:.2f}/5.00" if a.scores else "N/A"
        table_rows.append(f"| `{a.id}` | **{a.title}** | {a.category.value} | {score_val} | {status_badge} | {a.confidence} |")

    table_md = "\n".join(table_rows) if table_rows else "| - | Sin alternativas generadas aún | - | - | - | - |"

    details_md = ""
    for a in case.alternatives:
        details_md += f"""
### Alternativa `{a.id}`: {a.title}
- **Categoría:** `{a.category.value}`
- **Descripción:** {a.description}
- **Ventajas:** {', '.join(a.pros) if a.pros else 'N/A'}
- **Desventajas / Riesgos:** {', '.join(a.cons) if a.cons else 'N/A'}
- **Dependencias:** {', '.join(a.dependencies) if a.dependencies else 'Ninguna adicional'}
- **Coste Estimado:** {a.estimated_cost} | **Esfuerzo:** {a.effort}
- **Viabilidad:** {a.confidence}
"""
        if a.is_excluded:
            details_md += f"- ⚠️ **MOTIVO DE EXCLUSIÓN:** {a.exclusion_reason}\n"
        elif a.scores:
            details_md += f"""- **Puntuaciones Ponderadas:**
  * Cumplimiento del Objetivo (30%): `{a.scores.objective_compliance}/5`
  * Viabilidad Técnica (25%): `{a.scores.technical_feasibility}/5`
  * Riesgo de Implementación (15%): `{a.scores.implementation_risk}/5`
  * Tiempo y Esfuerzo (10%): `{a.scores.time_effort}/5`
  * Coste de Operación (10%): `{a.scores.operational_cost}/5`
  * Mantenimiento (10%): `{a.scores.maintainability}/5`
  * **TOTAL PONDERADO:** **`{a.scores.weighted_total:.2f} / 5.00`**
"""

    rec_alt = next((a for a in case.alternatives if a.id == case.recommended_alternative_id), None)
    rec_md = f"**`{rec_alt.id}` — {rec_alt.title}**\n\n{rec_alt.description}" if rec_alt else "_Recomendación pendiente de evaluación._"

    return f"""# ⚖️ EVALUACIÓN DE ALTERNATIVAS TÉCNICAS
**Caso:** `{case.id}` — {case.name}  
**Objetivo Preservado:** {case.objective}

---

## 1. Matriz Resumen de las 7 Alternativas

| ID | Título | Categoría | Puntuación | Estado | Viabilidad |
| :--- | :--- | :--- | :---: | :---: | :---: |
{table_md}

---

## 2. Detalle y Tradeoffs por Alternativa
{details_md}

---

## 3. Alternativa Recomendada
{rec_md}
"""

def generate_poc_plan_md(case: NavigatorCase) -> str:
    poc = case.poc_plan
    if not poc:
        return "# 🧪 PLAN DE PRUEBA DE CONCEPTO (PoC)\n\n_PoC pendiente de formulación._\n"

    prereqs = "\n".join(f"- {p}" for p in poc.prerequisites) or "- Ninguno adicional."
    steps = "\n".join(f"{idx}. {s}" for idx, s in enumerate(poc.steps, 1)) or "1. Pasos no definidos."
    criteria = "\n".join(f"- {c}" for c in poc.success_criteria) or "- Criterios no definidos."
    failures = "\n".join(f"- {f}" for f in poc.possible_failure_modes) or "- No se anticiparon modos de fallo."
    evidences = "\n".join(f"- {e}" for e in poc.verification_evidence) or "- Evidencias no definidas."

    return f"""# 🧪 PLAN DE PRUEBA DE CONCEPTO (PoC) MÍNIMA Y REVERSIBLE
**Caso:** `{case.id}` — {case.name}  
**Alternativa Validada:** `{poc.alternative_id}` — {poc.title}  
**Objetivo de la PoC:** {poc.objective}

> [!IMPORTANT]
> **REGLA DE SEGURIDAD:** Este plan es de diseño y verificación. Solution Navigator **NO ejecuta código ni altera ramas** de forma autónoma. La ejecución debe ser aprobada y supervisada por el usuario.

---

## 1. Requisitos Previos
{prereqs}

---

## 2. Procedimiento Mínimo Paso a Paso
{steps}

---

## 3. Criterios de Éxito
{criteria}

---

## 4. Posibles Modos de Fallo
{failures}

---

## 5. Evidencias para Determinar si Funciona
{evidences}

---

## 6. Procedimiento de Reversión (Rollback Inmediato)
{poc.reversal_plan}
"""

def write_case_reports(case: NavigatorCase, base_storage_dir: str) -> dict:
    """
    Writes DEBUG_LOG.md, ALTERNATIVES.md, POC_PLAN.md, case.json and report.json
    strictly into base_storage_dir/<case_id>/. Avoids touching user code.
    """
    case_dir = os.path.join(base_storage_dir, case.id)
    os.makedirs(case_dir, exist_ok=True)

    files_written = {}

    debug_path = os.path.join(case_dir, "DEBUG_LOG.md")
    with open(debug_path, "w", encoding="utf-8") as f:
        f.write(generate_debug_log_md(case))
    files_written["debug_log"] = debug_path

    alts_path = os.path.join(case_dir, "ALTERNATIVES.md")
    with open(alts_path, "w", encoding="utf-8") as f:
        f.write(generate_alternatives_md(case))
    files_written["alternatives"] = alts_path

    poc_path = os.path.join(case_dir, "POC_PLAN.md")
    with open(poc_path, "w", encoding="utf-8") as f:
        f.write(generate_poc_plan_md(case))
    files_written["poc_plan"] = poc_path

    case_json_path = os.path.join(case_dir, "case.json")
    with open(case_json_path, "w", encoding="utf-8") as f:
        f.write(case.model_dump_json(indent=2))
    files_written["case_json"] = case_json_path

    report_json_path = os.path.join(case_dir, "report.json")
    report_data = {
        "case_id": case.id,
        "case_name": case.name,
        "objective": case.objective,
        "status": case.status,
        "alternatives_count": len(case.alternatives),
        "recommended_alternative_id": case.recommended_alternative_id,
        "has_poc": case.poc_plan is not None,
        "updated_at": case.updated_at
    }
    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)
    files_written["report_json"] = report_json_path

    return files_written
