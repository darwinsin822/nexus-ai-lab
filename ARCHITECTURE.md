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
                       TASK ANALYZER
                             │
                       ┌─────▼─────┐
                       │ AI ROUTER │ ─── [GEMINI BUDGET GUARD]
                       └─────┬─────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
   OPENCODE ADAPTER    GEMINI ADAPTER     LOCAL AI ADAPTER
          │                  │                  │
          └──────────────────┼──────────────────┘
                             ▼
                     HANDOFF SUBSYSTEM
                             │
                     GIT SAFETY LAYER
                             │
                       QUALITY GATE
                             │
                    SHARED WORKSPACE (GIT)
```

## Componentes Clave

1. **`src/core/`**:
   - `config.js`: Carga y validación de `.nexus/config.json`. NUNCA guarda credenciales.
   - `logger.js`: Sanitización de API keys y redacción automática antes de escribir a `.nexus/logs/`.
   - `context.js`: Empaquetado comprimido de contexto (`.nexus/context/task-XXXX.md`).
   - `memory.js`: Gestión de memoria persistente en `.nexus/memory/`.

2. **`src/engines/`**:
   - `base.js`: Interfaz común (`detect`, `health`, `listModels`, `listAgents`, `execute`, `cancel`, `capabilities`).
   - `opencode/adapter.js`: Integración directa con el binario oficial de OpenCode CLI.
   - `gemini/adapter.js`: Desacoplado para Antigravity IDE y Google Gemini.
   - `local/adapter.js`: Preparado para servidores OpenAI-compatibles locales (Ollama, LM Studio).

3. **`src/router/`**:
   - `ai-router.js`: Enrutamiento por complejidad, dificultad, riesgo y coste.
   - `budget-guard.js`: Filtro estricto que reserva Gemini para tareas de alto impacto cognitivo.
   - `fallback.js`: Ciclo de recuperación con límite de 2 reintentos y escalación.

4. **`src/git/`**:
   - `git-safety.js`: Creación de checkpoints automáticos y ramas aisladas `nexus/task-XXXX`. Bloquea comandos peligrosos.

5. **`src/quality/`**:
   - `quality-gate.js`: Verificación empírica post-ejecución (`PASS`, `WARN`, `FAIL`).

6. **`src/handoff/`**:
   - `handoff-manager.js`: Protocolo de transferencia de contexto entre agentes.
