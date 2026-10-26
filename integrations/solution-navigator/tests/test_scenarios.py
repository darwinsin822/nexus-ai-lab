import unittest
import os
import shutil
from solution_navigator.server import (
    navigator_start_case, navigator_collect_evidence, navigator_analyze_blocker,
    navigator_generate_alternatives, navigator_compare_alternatives,
    navigator_create_report, navigator_prepare_poc, navigator_record_outcome,
    cases_cache, DEFAULT_STORAGE_DIR
)
from solution_navigator.core.sanitization import sanitize_text, validate_path
from solution_navigator.deepseek.client import DeepSeekClient

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

class TestMandatoryScenarios(unittest.TestCase):

    def setUp(self):
        cases_cache.clear()

    # Escenario 1: Un proyecto con un error reproducible
    def test_01_reproducible_error_project(self):
        proj_dir = os.path.join(FIXTURES_DIR, "project_reproducible")
        res = navigator_start_case(
            name="Caso Error Reproducible",
            project_path=proj_dir,
            objective="Resolver importación circular en módulo de aplicación",
            mandatory_requirements=["Mantener modularidad", "Cero dependencias adicionales"]
        )
        self.assertTrue(res["success"])
        case_id = res["case_id"]

        ev_res = navigator_collect_evidence(
            case_id=case_id,
            evidence_type="ERROR",
            content="ImportError: cannot import name 'main' from partially initialized module 'app'",
            file_path=os.path.join(proj_dir, "app.py")
        )
        self.assertTrue(ev_res["success"])
        self.assertEqual(ev_res["type"], "ERROR")

    # Escenario 2: Dos estrategias de reparación fallidas y una alternativa arquitectónica
    def test_02_two_failed_attempts_and_architectural_alternative(self):
        res = navigator_start_case(
            name="Caso 2 Intentos Fallidos",
            project_path="/tmp",
            objective="Resolver bloqueo de concurrencia en SQLite"
        )
        case_id = res["case_id"]

        failed_attempts = [
            {"strategy": "Aumentar timeout de SQLite", "outcome": "Fallo", "error_message": "database is locked tras 30s", "why_it_failed": "Escrituras concurrentes no serializadas"},
            {"strategy": "Usar modo WAL sin pool", "outcome": "Fallo", "error_message": "BusyError continua", "why_it_failed": "Múltiples conexiones compitiendo por lock exclusivo"}
        ]
        diag_res = navigator_analyze_blocker(
            case_id=case_id,
            failed_attempts=failed_attempts,
            mock_response={
                "root_cause": "Concurrencia de múltiples escritores sobre SQLite mono-proceso.",
                "confidence": 0.95,
                "proven_facts": ["SQLite bloquea la base completa en escritura"],
                "hypotheses": ["Separar lectura y cola de escritura en memoria resolverá el bloqueo"]
            }
        )
        self.assertTrue(diag_res["success"])

        # Generar alternativas incluyendo la arquitectónica (Cola de escritura en memoria)
        sample_alts = [
            {"id": "alt-1", "title": "Reparar configuración WAL", "category": "REPAIR", "description": "Ajustar pragma wal_autocheckpoint", "criteria_estimates": {"objective_compliance": 3.0, "technical_feasibility": 4.0, "implementation_risk": 3.0, "time_effort": 5.0, "operational_cost": 5.0, "maintainability": 3.0}},
            {"id": "alt-2", "title": "Arquitectura con Write-Queue en Memoria", "category": "ARCH_REDESIGN", "description": "Serializar escrituras mediante worker único en memoria manteniendo SQLite", "criteria_estimates": {"objective_compliance": 5.0, "technical_feasibility": 5.0, "implementation_risk": 4.5, "time_effort": 4.0, "operational_cost": 5.0, "maintainability": 4.5}},
            {"id": "alt-3", "title": "Migrar a PostgreSQL", "category": "TECH_CHANGE", "description": "Sustituir motor por PostgreSQL", "criteria_estimates": {"objective_compliance": 4.5, "technical_feasibility": 4.0, "implementation_risk": 2.5, "time_effort": 2.0, "operational_cost": 3.0, "maintainability": 4.0}},
            {"id": "alt-4", "title": "Simplificar esquema", "category": "SIMPLIFICATION", "description": "Reducir transacciones largas", "criteria_estimates": {"objective_compliance": 3.0, "technical_feasibility": 4.0, "implementation_risk": 3.0, "time_effort": 4.0, "operational_cost": 5.0, "maintainability": 3.5}},
            {"id": "alt-5", "title": "Sustituir ORM por Raw SQL", "category": "SUBSTITUTION", "description": "Evitar overhead de ORM en bloqueos", "criteria_estimates": {"objective_compliance": 3.5, "technical_feasibility": 4.0, "implementation_risk": 3.0, "time_effort": 3.0, "operational_cost": 5.0, "maintainability": 3.0}},
            {"id": "alt-6", "title": "Modelo Híbrido SQLite + DuckDB", "category": "HYBRID", "description": "DuckDB para analítica y SQLite para transacciones", "criteria_estimates": {"objective_compliance": 4.0, "technical_feasibility": 3.5, "implementation_risk": 3.0, "time_effort": 3.0, "operational_cost": 4.0, "maintainability": 3.5}},
            {"id": "alt-7", "title": "Rediseñar pipeline por lotes", "category": "PATH_REDESIGN", "description": "Agrupar mutaciones en batch periódico", "criteria_estimates": {"objective_compliance": 4.0, "technical_feasibility": 4.5, "implementation_risk": 4.0, "time_effort": 4.0, "operational_cost": 5.0, "maintainability": 4.0}}
        ]
        alts_res = navigator_generate_alternatives(case_id, custom_alternatives=sample_alts)
        self.assertTrue(alts_res["is_exact_seven"])

        comp_res = navigator_compare_alternatives(case_id)
        self.assertEqual(comp_res["recommended_id"], "alt-2", "La alternativa arquitectónica debe ganar por viabilidad y cumplimiento")

    # Escenario 3: Un caso sin evidencias suficientes
    def test_03_case_without_sufficient_evidence(self):
        res = navigator_start_case(name="Caso Sin Evidencias", project_path="/tmp", objective="Resolver fallo intermitente")
        case_id = res["case_id"]

        diag_res = navigator_analyze_blocker(
            case_id=case_id,
            mock_response={
                "root_cause": "Evidencias insuficientes para emitir diagnóstico causal.",
                "confidence": 0.20,
                "proven_facts": [],
                "hypotheses": ["Posible race condition o timeout de red"],
                "missing_info": ["Logs de error en el momento del fallo", "Entorno del sistema operativo", "Stack trace reproducible"]
            }
        )
        self.assertLess(diag_res["confidence"], 0.50)
        self.assertGreater(len(diag_res["missing_info"]), 0, "Debe reportar explícitamente qué información falta")

    # Escenario 4: Una hipótesis que contradiga los registros
    def test_04_hypothesis_contradicting_logs(self):
        res = navigator_start_case(name="Caso Hipótesis Contradictoria", project_path="/tmp", objective="Validar causa")
        case_id = res["case_id"]
        # Evidencia: el puerto es 8080 y respondió 200 OK
        navigator_collect_evidence(case_id, "LOG", "Server listening on port 8080: HTTP 200 OK")

        # Diagnóstico separa hecho comprobado de hipótesis refutada
        diag_res = navigator_analyze_blocker(
            case_id=case_id,
            mock_response={
                "root_cause": "Fallo en capa de datos interna, no en red.",
                "confidence": 0.80,
                "proven_facts": ["El servidor HTTP está activo y respondiendo 200 en puerto 8080"],
                "hypotheses": ["La hipótesis de 'servidor caído' se descarta por contradicción con los logs"]
            }
        )
        self.assertIn("El servidor HTTP está activo", diag_res["root_cause"] + str(cases_cache[case_id].diagnosis.proven_facts))

    # Escenario 5: Un repositorio con cambios sin guardar
    def test_05_repo_with_uncommitted_changes(self):
        res = navigator_start_case(name="Caso Repositorio Modificado", project_path="/tmp", objective="Inspección segura")
        case_id = res["case_id"]

        # Recopilar diff de cambios no guardados sin borrarlos
        dirty_diff = "diff --git a/app.py b/app.py\n+ # Cambios en progreso sin commit\n+ fix_attempt = True"
        ev_res = navigator_collect_evidence(case_id, "GIT_DIFF", dirty_diff)
        self.assertTrue(ev_res["success"])
        # Verificar que el diff queda registrado como evidencia sin modificar el repo
        case = cases_cache[case_id]
        self.assertEqual(len(case.evidences), 1)
        self.assertEqual(case.evidences[0].type.value, "GIT_DIFF")

    # Escenario 6: Un archivo secreto que nunca debe salir del entorno local
    def test_06_secret_file_redaction(self):
        secrets_file = os.path.join(FIXTURES_DIR, "project_secrets", "secrets.env")
        with open(secrets_file, "r") as f:
            raw_content = f.read()

        sanitized = sanitize_text(raw_content)
        self.assertNotIn("sk-mock-fake-test-key-for-sanitization-01234", sanitized)
        self.assertNotIn("supersecretpass", sanitized)
        self.assertNotIn("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", sanitized)
        self.assertIn("[REDACTED", sanitized)

    # Escenario 7: Un intento de acceso a una ruta no autorizada
    def test_07_unauthorized_path_access_attempt(self):
        base_project = "/home/darwinsin/.gemini/antigravity/scratch/solution-navigator"
        valid, err = validate_path("/etc/shadow", base_project)
        self.assertFalse(valid)
        self.assertIn("Acceso denegado", err)

        valid_traversal, err2 = validate_path(f"{base_project}/../../.ssh/id_rsa", base_project)
        self.assertFalse(valid_traversal)
        self.assertIn("Acceso denegado", err2)

    # Escenario 8: Una respuesta inválida o un error de la API de DeepSeek
    def test_08_deepseek_api_invalid_response_handling(self):
        client = DeepSeekClient(api_key="sk-invalid-key-test")
        # Simula llamada fallida con URL no accesible
        client.model = "modelo-inexistente"
        res = client.analyze_blocker("objetivo", [], [])
        self.assertFalse(res["success"])
        self.assertIn("error", res)
        # El sistema no crashea, devuelve error controlado
        self.assertEqual(res["confidence"], 0.0)

    # Escenario 9: Una alternativa que incumpla un requisito obligatorio
    def test_09_alternative_violating_mandatory_requirement(self):
        res = navigator_start_case(
            name="Caso Exclusión Obligatoria",
            project_path="/tmp",
            objective="Procesamiento local estricto",
            mandatory_requirements=["Prohibido el uso de servicios cloud externos"]
        )
        case_id = res["case_id"]

        alts = [
            {"id": "alt-1", "title": "Solución Local", "category": "REPAIR", "description": "Uso de lib local", "is_excluded": False, "criteria_estimates": {"objective_compliance": 4.0, "technical_feasibility": 4.0, "implementation_risk": 4.0, "time_effort": 4.0, "operational_cost": 5.0, "maintainability": 4.0}},
            {"id": "alt-2", "title": "Servicio AWS Cloud Lambda", "category": "TECH_CHANGE", "description": "Delegar cómputo a AWS", "is_excluded": True, "exclusion_reason": "Viola el requisito obligatorio: 'Prohibido el uso de servicios cloud externos'", "criteria_estimates": {"objective_compliance": 5.0, "technical_feasibility": 5.0, "implementation_risk": 5.0, "time_effort": 5.0, "operational_cost": 2.0, "maintainability": 5.0}}
        ]
        navigator_generate_alternatives(case_id, custom_alternatives=alts)
        comp_res = navigator_compare_alternatives(case_id)
        self.assertEqual(comp_res["recommended_id"], "alt-1")
        # alt-2 fue descartada a pesar de tener notas altas
        case = cases_cache[case_id]
        excluded = [a for a in case.alternatives if a.is_excluded]
        self.assertEqual(len(excluded), 1)
        self.assertIn("Viola el requisito obligatorio", excluded[0].exclusion_reason)

    # Escenario 10: Una recomendación que necesite aprobación antes de continuar
    def test_10_recommendation_requires_user_approval(self):
        res = navigator_start_case(name="Caso Aprobación Requerida", project_path="/tmp", objective="Migración crítica")
        case_id = res["case_id"]

        alts = [
            {"id": "alt-1", "title": "Refactor Crítico de Base de Datos", "category": "ARCH_REDESIGN", "description": "Migrar esquema a v2", "criteria_estimates": {"objective_compliance": 5.0, "technical_feasibility": 4.0, "implementation_risk": 2.0, "time_effort": 2.0, "operational_cost": 5.0, "maintainability": 4.5}}
        ]
        navigator_generate_alternatives(case_id, custom_alternatives=alts)
        navigator_compare_alternatives(case_id)
        poc_res = navigator_prepare_poc(case_id)

        case = cases_cache[case_id]
        # El estado permanece EVALUATED o DIAGNOSED, NUNCA RESOLVED ni IMPLEMENTED sin orden del usuario
        self.assertNotEqual(case.status, "RESOLVED")
        self.assertTrue(poc_res["reversal_guaranteed"])

        # Solo tras confirmación explícita del usuario pasa a RESOLVED
        rec_res = navigator_record_outcome(case_id, user_decision="APROBADO_PARA_POC", learnings="Validar backups antes")
        self.assertTrue(rec_res["success"])
        self.assertEqual(cases_cache[case_id].status, "RESOLVED")

if __name__ == "__main__":
    unittest.main()
