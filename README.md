# NEXUS AI LAB 2.0
### Hybrid AI Agent Orchestration Lab

Nexus AI Lab es una capa de orquestación desacoplada e inteligente diseñada para trabajar desde Linux y Antigravity, enrutando tareas automáticamente entre OpenCode CLI, Google Gemini y modelos Open Source / locales, reduciendo al mínimo el consumo innecesario de créditos.

---

## Principio Fundamental

> **UTILIZAR EL MOTOR ADECUADO PARA CADA TAREA, PRIORIZANDO COSTE, CALIDAD, VELOCIDAD, SEGURIDAD Y TRAZABILIDAD.**
> 
> *No utilizar Gemini para trabajo que OpenCode, un modelo local u otro motor disponible pueda realizar adecuadamente.*

---

## Características Principales

- **AI Router Inteligente:** Clasifica semánticamente las tareas (Código, Debug, Tests, Arquitectura, UI, etc.) y evalúa complejidad y riesgo.
- **Gemini Budget Guard:** Protege activamente la cuota mensual de Gemini, delegando tareas rutinarias y mecánicas a modelos gratuitos o económicos de OpenCode.
- **Modos de Coste:**
  - `ECONOMY`: Prioridad a OpenCode y modelos gratuitos/libres (Default).
  - `BALANCED`: Equilibrio dinámico entre coste, latencia y precisión.
  - `PREMIUM`: Capacidad máxima de razonamiento (Gemini 2.5 Pro / 3.8 Flash).
- **Handoff Formal:** Transferencia estructurada de contexto entre agentes (`.nexus/handoff.md`, `task.json`, `plan.md`, `execution.md`, `review.md`).
- **Git Safety Layer:** Checkpoints automáticos, ramas aisladas `nexus/task-XXXX`, y prevención absoluta de comandos destructivos (`git reset --hard`, `git clean -fd`).
- **Quality Gate:** Evaluación estricta de cambios, diffs y suites de tests antes de marcar cualquier tarea como completada (`PASS`, `WARN`, `FAIL`).
- **Fallback Escalable:** Máximo 2 reintentos con cambio automático de agente/modelo y escalación final a Gemini ante fallos repetidos.
- **Memoria Persistente del Proyecto:** Registro en `.nexus/memory/` (arquitectura, decisiones, convenciones, problemas conocidos).

---

## Instalación Rápida

```bash
# Ejecutar instalador local
./scripts/install.sh

# Verificar salud del entorno
nexus doctor
```

---

## Comandos Principales

```bash
# Diagnóstico completo
nexus doctor

# Estado del workspace y motores
nexus status

# Listar agentes y perfiles disponibles
nexus agents

# Listar catálogo de modelos y costes
nexus models

# Ejecutar una tarea con auto-routing
nexus run "crea una función para validar contraseñas seguras"

# Forzar motor o modo específico
nexus run --engine opencode --mode ECONOMY "escribe pruebas unitarias"
nexus run --engine gemini "diseña la arquitectura distribuida"

# Planificación arquitectónica
nexus plan "diseña un sistema de autenticación OAuth2"

# Workflow Híbrido (Plan -> Implement -> Test -> Review)
nexus hybrid "diseña e implementa el módulo de pagos"

# Inspección de handoff activo
nexus handoff

# Dashboard interactivo
nexus dashboard

# Reporte de telemetría y ahorro de recursos
nexus history
```

---

## Licencia

MIT License. Diseñado para el ecosistema personal de DarwinSin.
