# ⚡ NEXUS AI LAB 3.0
### Hybrid AI Agent Orchestration Lab · DeepSeek-First Architecture & Failover Engine

NEXUS AI Lab es una capa maestra de orquestación de agentes de IA diseñada para trabajar en **Linux** y **Antigravity**, integrando **OpenCode CLI 2.x** y **DeepSeek API** como motor principal de ejecución económica, protegiendo al 100% los créditos de **Gemini** y rescatando tareas interrumpidas de **Claude**.

---

## 💡 ¿Por Qué Existe Nexus AI Lab?

Cuando trabajas con asistentes como Claude o Gemini en proyectos reales, te enfrentas a dos grandes problemas:
1. **La temida ventana rodante de 5 horas o límites de cuota:** Claude o Gemini se cortan a mitad de un prompt complejo o refactor grande, dejando el código roto o a medio hacer.
2. **Consumo excesivo de tokens y créditos caros:** Usar modelos premium para tareas mecánicas (boilerplate, pruebas unitarias, documentación, corrección de linter) agota tus límites mensuales en días.

**Nexus AI Lab resuelve esto de raíz:**
- **DeepSeek como motor primario (90% de tareas):** Ejecuta código, pruebas, docs y refactors a máxima velocidad por una fracción de centavo (~ash.001–0.01 por tarea) usando `deepseek/deepseek-flash` o `deepseek/deepseek-v4-pro` vía OpenCode 2.x.
- **Failover Automático (5 Horas / Cuota):** Si Claude o Gemini se cortan por límite de uso, Nexus detecta la interrupción, congela el estado de Git en un checkpoint de emergencia (`.nexus/handoff.md`), asume la tarea con DeepSeek y la completa al 100% sin intervención humana.
- **Control Supremo en Antigravity:** Coloca la palabra **"nexus"** en cualquier parte de tu petición en Antigravity, y el asistente cede el control a Nexus, delega a DeepSeek y entrega el informe obligatorio **`NEXUS EXECUTION REPORT`**.
- **Cero Bloat de Memoria:** Diseñado y optimizado para funcionar fluido incluso en equipos con **8 GB de RAM**, sin necesidad de ejecutar modelos locales pesados que congelen tu sistema.

---

## 🛠️ Herramientas y Superpoderes Integrados

| Componente | Rol | Beneficio Clave |
| :--- | :--- | :--- |
| **DeepSeek API (OpenCode 2.x)** | Motor ejecutor principal | Desarrollo de software ágil, refactorización y depuración con coste casi cero. |
| **Upstash Context7** | Servidor MCP oficial | Extracción de documentación oficial en tiempo real sin alucinaciones ni tokens desperdiciados. |
| **Semgrep SAST** | Quality Gate de Seguridad | Escaneo de vulnerabilidades determinista en local (bash tokens de LLM). |
| **Playwright Engine** | Runner E2E acotado | Pruebas de navegador automatizadas con guardián de RAM (<512 MB). |
| **REA (Reverse Engineering)** | Análisis binario local | Reconstrucción JS/Electron, decompilación de APKs y herramientas ADB. |
| **Solution Navigator** | Asesor de desbloqueo | Genera exactamente **7 alternativas técnicas viables** cuando un agente de IA queda en bucle. |

---

## 🚀 Instalación Rápida (2 Minutos)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/darwinsin822/nexus-ai-lab.git
cd nexus-ai-lab
```

### 2. Ejecutar el Instalador Automatizado
```bash
./scripts/install.sh
```
*El instalador enlaza el wrapper de OpenCode 2.x (`@opencode/cli`), enlaza el comando global `nexus` a `~/.local/bin/nexus` e instala las skills de Antigravity en tu entorno.*

### 3. Configurar tu Clave de DeepSeek
Agrega tu API Key a tu archivo `~/.bashrc` o `~/.zshrc`:
```bash
export DEEPSEEK_API_KEY="sk-tu-api-key-de-deepseek"
```
Y para que OpenCode la reconozca directamente:
```bash
opencode auth login
# O guárdala en ~/.local/share/opencode/auth.json
```

### 4. Verificar con Nexus Doctor
```bash
nexus doctor
```
Deberás ver todas las verificaciones en verde:
```text
======================================================
       NEXUS AI LAB 3.0 — DIAGNOSTIC DOCTOR
======================================================
[OK] Node.js: v24.x o superior
[OK] Python 3: Python 3.12+
[OK] OpenCode CLI: v2.1.x activo (@opencode/cli)
[OK] DeepSeek Provider: Conectado (deepseek/deepseek-flash)
[OK] Git Safety Layer: Activo con checkpoints automáticos
[OK] Quality Gate: Semgrep SAST listo
✔ NEXUS DOCTOR VERIFIED: System is 100% operational!
======================================================
```

---

## 📖 Guía de Uso

### A. Uso desde la Terminal (CLI Global `nexus`)

```bash
# Ejecutar tarea con enrutamiento inteligente (por defecto DeepSeek Flash)
nexus run "crea una función en Python para validar JWT con tests unitarios"

# Planificación técnica desglosada (coste bash)
nexus plan "desglose de arquitectura y base de datos para sistema de usuarios"

# Pipeline Híbrido Completo (Plan -> Implement -> Test -> Review)
nexus hybrid "construye la API REST de productos con Express y validaciones"

# Rescate de Claude o Gemini interrumpidos por límite de 5 horas
nexus resume

# Diagnóstico del entorno y herramientas conectadas
nexus doctor
```

### B. Uso en Antigravity (Control Supremo)

Simplemente escribe la palabra **"nexus"** en cualquier mensaje o prompt:

> **Usuario:** *"nexus, implementa un middleware de autenticación con rate-limiting"*

Antigravity cederá el control de inmediato respondiendo:
```text
⚡ NEXUS 3.0 tomando control...
Delegando tarea al motor DeepSeek (deepseek/deepseek-flash) a través de OpenCode CLI...
```

Y al finalizar la ejecución, recibirás el informe estructurado obligatorio:
```text
══════════════════════════════════════════════════════════════
               NEXUS EXECUTION REPORT
══════════════════════════════════════════════════════════════
TASK ID:           task-0052
OBJETIVO:          Middleware de autenticación con rate-limiting
MOTOR UTILIZADO:   deepseek/deepseek-flash (OpenCode CLI 2.x)
ARCHIVOS CREADOS:  src/middleware/auth.js, tests/auth.test.js
QUALITY GATE:      [PASS] (Semgrep 0 issues, Tests 100% OK)
CRÉDITOS GEMINI:   bash.00 (PRESERVADOS AL 100%)
COSTO ESTIMADO:    ~bash.002 USD
ESTADO:            ✔ COMPLETADO CON ÉXITO
══════════════════════════════════════════════════════════════
```

---

## 🧱 Estructura del Proyecto

```text
nexus-ai-lab/
├── bin/
│   └── nexus.js             # Entrada ejecutable CLI global
├── scripts/
│   └── install.sh           # Instalador interactivo 1-click
├── skills/
│   ├── nexus-ai-lab/        # Skill universal para Antigravity
│   ├── solution-navigator/  # Asesor de rescate con 7 alternativas
│   └── ...                  # Skills especializadas (backend, git, tests)
├── src/
│   ├── cli/                 # Comandos del CLI y Doctor
│   ├── core/                # Configuración, contexto y memoria persistente
│   ├── engines/             # Adaptadores para OpenCode 2.x y Gemini
│   ├── git/                 # Git Safety Layer (checkpoints y ramas aisladas)
│   ├── handoff/             # Protocolo formal de transferencia entre agentes
│   ├── quality/             # Quality Gate (Semgrep SAST + test verification)
│   ├── registry/            # Catálogo de modelos, agentes y proveedores
│   ├── router/              # AI Router y Failover Engine (Claude/Gemini -> DeepSeek)
│   └── telemetry/           # Control de costes y presupuesto
└── tests/                   # Suite de pruebas automatizadas
```

---

## 🛡️ Licencia

MIT License. Creado por **DarwinSin** para compartir con la comunidad de desarrollo y automatización de IA.
