# NEXUS AI LAB — ARQUITECTURA DEL SISTEMA

```text
                         USER / IDE
                             │
                             ▼
                        NEXUS CLI
                             │
                      ┌──────┴──────┐
                      │ NEXUS CORE  │
                      └──────┬──────┘
                             │
                       TASK ANALYZER (Incluye Planificación y Documentación)
                             │
                       ┌─────▼─────┐
                       │ AI ROUTER │ ─── [GEMINI BUDGET GUARD]
                       └─────┬─────┘
                             │
          ┌──────────────────┴──────────────────┐
          ▼                                     ▼
   OPENCODE ADAPTER                      GEMINI ADAPTER
   (Planificación, Docs, Código, Tests)  (Arquitectura Superior / Fallback)
          │                                     │
          └──────────────────┬──────────────────┘
                             ▼
                     HANDOFF SUBSYSTEM
                             │
                     GIT SAFETY LAYER
                             │
                       QUALITY GATE
                             │
                    SHARED WORKSPACE (GIT)
```

## Políticas de Arquitectura

1. **Exclusión de Motores Locales:**  
   Debido a las restricciones de hardware del host (**8 GB RAM / 4 núcleos CPU**), se ha retirado el soporte para modelos locales en host (Ollama / LM-Studio), evitando el riesgo de *OOM Killer* o saturación de swap. Todo trabajo económico se delega a OpenCode.

2. **Delegación de Planificación y Documentación:**  
   - **Planificación:** Asignada por defecto a OpenCode a través de su agente `plan`.
   - **Documentación:** Asignada a OpenCode a través de su agente `general`.
   - **Gemini:** Reservado para arbitraje arquitectónico profundo y modo `PREMIUM`.

## Componentes Clave

1. **`src/core/`**:
   - `config.js`: Carga y validación de `.nexus/config.json`.
   - `logger.js`: Sanitización de API keys y redacción automática antes de escribir a `.nexus/logs/`.
   - `context.js`: Empaquetado comprimido de contexto (`.nexus/context/task-XXXX.md`).
   - `memory.js`: Gestión de memoria persistente en `.nexus/memory/`.

2. **`src/engines/`**:
   - `base.js`: Interfaz común (`detect`, `health`, `listModels`, `listAgents`, `execute`, `cancel`, `capabilities`).
   - `opencode/adapter.js`: Integración directa con el binario oficial de OpenCode CLI.
   - `gemini/adapter.js`: Desacoplado para Antigravity IDE y Google Gemini.
   - `local/adapter.js`: Deshabilitado formalmente por política de protección de hardware.

3. **`src/router/`**:
   - `ai-router.js`: Enrutamiento por complejidad, dificultad, riesgo y coste.
   - `budget-guard.js`: Filtro estricto que reserva Gemini y delega planificación/documentación/código a OpenCode.
   - `fallback.js`: Ciclo de recuperación con límite de 2 reintentos y escalación.

4. **`src/git/`**:
   - `git-safety.js`: Creación de checkpoints automáticos y ramas aisladas `nexus/task-XXXX`. Bloquea comandos peligrosos.

5. **`src/quality/`**:
   - `quality-gate.js`: Verificación empírica post-ejecución (`PASS`, `WARN`, `FAIL`).

6. **`src/handoff/`**:
   - `handoff-manager.js`: Protocolo de transferencia de contexto entre agentes.
