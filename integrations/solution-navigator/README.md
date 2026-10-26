# Solution Navigator v0.1.0

Sistema de asesoramiento técnico de alta fidelidad para desbloquear proyectos y romper bucles de fallo de agentes de IA mediante la formulación estructurada de **7 alternativas técnicas viables** y planes de pruebas de concepto (PoC) reversibles.

## 🎯 Filosofía y Principios Operativos

1. **Modo Exclusivamente Asesor (No Autónomo):** Solution Navigator no modifica código fuente de forma autónoma. Todas las recomendaciones y planes de PoC requieren aprobación explícita del usuario.
2. **Generación Determinista de 7 Alternativas:**
   - `REPAIR`: Reparación quirúrgica de la solución actual.
   - `SIMPLIFY`: Eliminación de abstracciones y dependencias no esenciales.
   - `REPLACE_COMPONENT`: Sustitución de librerías o dependencias problemáticas.
   - `REDESIGN_WORKFLOW`: Reestructuración del flujo de ejecución o máquina de estados.
   - `EXTERNAL_DELEGATION`: Delegación a un proceso daemon, CLI nativo o servicio externo.
   - `HYBRID`: Combinación de componentes probados con adaptadores desacoplados.
   - `PRAGMATIC_COMPROMISE`: Degradación elegante o ajuste de alcance justificado.
3. **Matriz de Ponderación Determinista (100%):**
   - Cumplimiento de Objetivo: 30%
   - Viabilidad Técnica: 25%
   - Mitigación de Riesgo: 15%
   - Esfuerzo / Tiempo: 10%
   - Costo Operativo: 10%
   - Mantenibilidad: 10%
4. **Seguridad y Redacción de Secretos:**
   - Filtrado automático de API Keys, Bearer tokens, URLs de bases de datos y claves privadas.
   - Protección contra Path Traversal y lectura no autorizada fuera del proyecto.
   - Almacenamiento seguro y aislado en `~/.solution-navigator/cases/<case_id>/`.
5. **Eficiencia de Costos (DeepSeek + OpenCode):**
   - Utiliza la clave `DEEPSEEK_API_KEY` existente de Nexus / OpenCode sin duplicar credenciales ni cargar modelos locales pesados.

---

## 🛠️ Herramientas MCP Disponibles

Solution Navigator expone 8 herramientas a través del protocolo MCP (FastMCP):

| Herramienta | Descripción |
|---|---|
| `navigator_start_case` | Inicia un nuevo caso de diagnóstico con objetivo, requisitos y restricciones. |
| `navigator_collect_evidence` | Recopila y sanitiza logs, errores, diffs de git o fragmentos de código. |
| `navigator_analyze_blocker` | Diagnostica la causa raíz separando hechos comprobados de hipótesis. |
| `navigator_generate_alternatives` | Genera exactamente las 7 alternativas técnicas. |
| `navigator_compare_alternatives` | Calcula las puntuaciones ponderadas y clasifica las alternativas. |
| `navigator_prepare_poc` | Diseña un plan de PoC mínimo, aislado y 100% reversible (sin ejecutar cambios). |
| `navigator_create_report` | Genera los reportes `DEBUG_LOG.md`, `ALTERNATIVES.md`, `POC_PLAN.md`. |
| `navigator_record_outcome` | Registra el resultado final, comentarios y aprendizajes para memoria. |

---

## 🚀 Integración y Uso

### 1. En OpenCode CLI
Solution Navigator está registrado en `~/.config/opencode/opencode.jsonc`:
```jsonc
{
  "mcp": {
    "solution-navigator": {
      "type": "local",
      "command": [
        "/home/darwinsin/.local/share/semgrep-venv/bin/python",
        "-m",
        "solution_navigator.server"
      ],
      "environment": {
        "PYTHONPATH": "/home/darwinsin/.gemini/antigravity/scratch/solution-navigator/src"
      }
    }
  }
}
```
Verificación de estado:
```bash
opencode mcp list
```

### 2. En Antigravity
Se activa mediante la skill universal `solution-navigator` ubicada en:
`~/.gemini/config/skills/solution-navigator/SKILL.md`

**Comandos de Invocación Manual:**
- `"solution navigator"`
- `"navegador de soluciones"`
- `"diagnostica este bloqueo"`
- `"busca alternativas tecnicas"`
- `"destraba este proyecto"`

### 3. Ejecución de Pruebas Unitarias
```bash
PYTHONPATH=src /home/darwinsin/.local/share/semgrep-venv/bin/python -m unittest discover -s tests -p "test_*.py" -v
```

---

## 🔒 Desactivación / Desinstalación Limpia
Si en algún momento deseas desactivar el servidor MCP:
1. Eliminar la sección `"solution-navigator"` de `~/.config/opencode/opencode.jsonc`.
2. Para purgar el almacenamiento de casos anteriores:
   `rm -rf ~/.solution-navigator/cases/`
