# NEXUS AI LAB 2.0 — AUDITORÍA DEL ENTORNO DE EJECUCIÓN (FASE 0)
**Fecha:** 2026-10-01T19:15:00-05:00  
**Host:** `darwinsin-Latitude-3350` | Linux Mint 22.3 (Zena) / Ubuntu 24.04 noble (Kernel 7.0.0-34-generic x86_64)  
**Objetivo:** Determinar con rigor empírico y evidencia directa las capacidades, herramientas, runtimes, motores, agentes y proveedores disponibles antes de iniciar la construcción del laboratorio.

---

## 1. SISTEMA OPERATIVO Y RECURSOS DE HARDWARE

| Componente | Especificación Real Detectada | Estado / Observación |
| :--- | :--- | :--- |
| **Distribución** | Linux Mint 22.3 (Zena) / Ubuntu 24.04 (noble) | Totalmente compatible con binarios Linux x86_64 |
| **Kernel** | 7.0.0-34-generic #34~24.04.1-Ubuntu SMP PREEMPT_DYNAMIC | x86_64 GNU/Linux |
| **CPU** | 4 hilos (Intel 64-bit) | Apto para tareas concurrentes ligeras/medias |
| **Memoria RAM** | **7.7 GiB Total** \| ~4.8 GiB Usados \| ~2.9 GiB Disponibles \| Swap 2.0 GiB | **Restricción crítica**: Se debe aplicar contención de memoria (`optiram`) |
| **Almacenamiento** | Disco 234 GiB \| 110 GiB Usados \| **112 GiB Disponibles (50%)** | Espacio amplio para repositorios, cachés y logs |
| **Shell por defecto** | `/usr/bin/bash` | Bash estándar interactivo y scripts sh |

---

## 2. DETECCIÓN DE MOTORES Y AGENTES

### A. Antigravity & Gemini (Motor Primario / Supervisor)
- **Instalación:** Antigravity IDE v2.9.1 en ejecución (`/home/darwinsin/Documentos/Antigravity-x64/antigravity`).
- **Language Server:** Backend activo en PID 30823 (`/home/darwinsin/Documentos/Antigravity-x64/resources/bin/language_server`).
- **API Server:** `https://generativelanguage.googleapis.com` con autenticación CSRF y token de sesión.
- **Modelo Activo en Configuración:** `Gemini 3.8 Flash` (`~/.gemini/antigravity/settings.json`).
- **Bridge CLI (`agy`):** Presente en `/home/darwinsin/.local/bin/agy` (binario ELF puente compilado con GCC 13.3).
- **Subagentes Nativos Disponibles:**
  - `self` (hereda contexto y herramientas del agente padre).
  - `research` (modo solo lectura para búsquedas web, exploración y lectura de archivos).
  - Soporte dinámico de subagentes vía `define_subagent` e `invoke_subagent`.
- **Ecosistema de Superagentes Especializados en Skills:**
  - `zeus` (Supervisor, Devil's Advocate, RCA, 3-strike debugger).
  - `apolo` (Arquitecto y Senior Software Engineer).
  - `atenea` (Planificador y Orquestador de Flujos).
  - `afrodita-qa` (TDD y Adversarial QA Tester).
  - `tortugas-ninjas` (Squad multidisciplinario: Leonardo/Frontend, Donatello/Backend, Raphael/QA, Michelangelo/UX, Splinter/Seguridad).

### B. OpenCode CLI (Motor Autónomo / Ejecutor Económico)
- **Estado de Instalación:**
  - No figuraba como paquete deb instalado en `dpkg -l`.
  - Archivo instalador en disco: `/home/darwinsin/Documentos/MIS DEBS/opencode-desktop-linux-amd64.deb` (v1.18.25).
  - **Ejecutable CLI Oficial Disponible:** `opencode-ai` v1.18.34 (publicado por anomalyco / thdxr).
  - Se ejecuta directamente de forma instantánea vía Node / npx (`npx opencode-ai`) o mediante un wrapper ejecutable `opencode` en `~/.local/bin/opencode`.
- **Base de Datos y Estado Local:**
  - Base SQLite: `~/.local/share/opencode/opencode.db`
  - Logs: `~/.local/share/opencode/log/opencode.log`
  - Caché de Modelos: `~/.cache/opencode/models.json` (225 proveedores indexados de `models.dev`).
- **Agentes Nativos de OpenCode Detectados:**
  - `build` (primary)
  - `compaction` (primary)
  - `explore` (subagent)
  - `general` (subagent)
  - `plan` (primary)
  - `summary` (primary)
  - `title` (primary)
- **Comandos Clave de OpenCode Verificados:**
  - `opencode run [message..]` (admite `--model <provider/model>`, `--agent <agent>`, `--auto` para no bloquear por permisos, `--session`).
  - `opencode agent list` (descubrimiento dinámico de agentes).
  - `opencode models [provider] [--verbose]` (descubrimiento de modelos con costes de entrada/salida).
  - `opencode providers list` (gestión de autenticación de proveedores).
  - `opencode stats` (estadísticas reales de tokens y costes de sesión).
  - `opencode mcp` (gestión de servidores MCP en OpenCode).
  - `opencode session` / `opencode export` / `opencode import`.

### C. Motores Locales (Local AI)
- **Ollama:** `ollama` no está en PATH ni activo en memoria.
- **LM Studio:** Instalador disponible en `/home/darwinsin/Documentos/MIS DEBS/LM-Studio-0.4.13-1-x64.deb`. Actualmente no instalado ni en ejecución en background.
- **Conclusión de Motores Locales:** Modo `LOCAL` permanecerá en estado *STANDBY / INACTIVO* hasta que el usuario inicie un endpoint OpenAI-compatible o instale un runtime local.

---

## 3. CATÁLOGO DE MODELOS Y COSTES

### OpenCode (Modelos Gratuitos Listados sin API Keys):
- `opencode/big-pickle`
- `opencode/fledge-alpha-free`
- `opencode/ling-3.0-flash-fin-free`
- `opencode/longcat-2.5-preview-free`
- `opencode/mimo-v2.6-flash-free`
- `opencode/muse-spark-1.3-contributor-free`
- `opencode/nemotron-3-ultra-free`
- `opencode/nemotron-3.5-lightning-free`
- `opencode/space-bunny-free`

### OpenCode (Caché de Proveedores Externos en `models.json`):
- 225 proveedores con esquemas de precios y límites (OpenAI, Anthropic, DeepSeek, Groq, Mistral, Google, xAI, etc.).
- Permite al Router estimar con exactitud los costes por millón de tokens ($/input y $/output) cuando se configuren credenciales.

### Gemini / Antigravity:
- Modelo actual: `Gemini 3.8 Flash`
- Consumo gestionado por Antigravity IDE (cuota mensual de créditos de Google).
- Se aplicará el **Gemini Budget Guard** para reservar Gemini estrictamente a arquitectura, razonamiento profundo y fallback crítico.

---

## 4. RUNTIMES Y HERRAMIENTAS DE DESARROLLO

| Herramienta | Versión | Ruta | Estado |
| :--- | :--- | :--- | :--- |
| **Node.js** | v20.20.2 | `/home/darwinsin/.nvm/versions/node/v20.20.2/bin/node` | **DISPONIBLE** |
| **npm** | 10.8.2 | `/home/darwinsin/.nvm/versions/node/v20.20.2/bin/npm` | **DISPONIBLE** |
| **pnpm** | 12.3.4 | `/home/darwinsin/.nvm/versions/node/v20.20.2/bin/pnpm` | **DISPONIBLE** |
| **Bun** | N/A | No en PATH | No disponible |
| **Python 3** | 3.12.3 | `/usr/bin/python3` (con `venv` disponible) | **DISPONIBLE** (Gestión vía venv) |
| **Git** | 2.43.0 | `/usr/bin/git` | **DISPONIBLE** |
| **SQLite3** | 3.45.1 | `/usr/bin/sqlite3` | **DISPONIBLE** |
| **Curl** | 8.5.0 | `/usr/bin/curl` | **DISPONIBLE** |
| **Make / GCC** | 13.3.0 | `/usr/bin/make`, `/usr/bin/gcc` | **DISPONIBLE** |
| **Rclone** | 1.65.2 | `/usr/bin/rclone` | **DISPONIBLE** |
| **Java** | OpenJDK | `/usr/bin/java` | **DISPONIBLE** |

---

## 5. SKILLS Y EXTENSIONES DEL SISTEMA

Se detectaron **23 Skills universales** en `~/.gemini/config/skills/`:
- **Ingeniería y Calidad:** `apolo`, `zeus`, `atenea`, `afrodita-qa`, `tortugas-ninjas`, `optiram`, `total-cleanup`, `project-memory`.
- **Desarrollo y UI/UX:** `master-ui-ux-design`, `android-compose-expert`, `ui-styling`, `ui-ux-pro-max`, `impeccable`, `slides`, `design-system`, `design`, `brand`, `banner-design`.
- **Laboratorios Especializados:** `android-mod-lab`, `youtube-magic`, `music-laboratory`.
- **Built-in Skills:** `agy-customizations`, `antigravity_guide`, `permissioned-github`.

---

## 6. MODEL CONTEXT PROTOCOL (MCP)

- **Configuración Antigravity:** `~/.gemini/config/mcp_config.json`
- **Servidor Activo:** `notebooklm` ejecutado mediante `npx -y notebooklm-mcp@latest`.
- **Herramientas Expuestas:** 14 herramientas de investigación, subida de fuentes y generación de resúmenes estructurados.
- **Soporte MCP en OpenCode:** Verificado nativamente mediante el comando `opencode mcp`. Nexus AI Lab podrá orquestar MCP de manera unificada entre ambos entornos.

---

## 7. MATRIZ DE CAPACIDADES Y DECISIONES ARQUITECTÓNICAS (FASE 0)

1. **Lenguaje y Stack del Núcleo de Nexus AI Lab:**
   - Se utilizará **Node.js (v20.20.2) con soporte de módulos ESM y/o TypeScript** o **Python 3.12** con soporte CLI nativo. Dado que Node.js v20.20.2 y pnpm están disponibles sin restricciones de paquetes globales, y la CLI de OpenCode es nativa en Node/TypeScript, implementar el Core y CLI de Nexus en Node.js (con scripts ejecutables en bash/node) ofrece latencia mínima y paridad total con los eventos de OpenCode y SQLite.
2. **Wrapper de OpenCode:**
   - Crear un enlace ejecutable o script wrapper `/home/darwinsin/.local/bin/opencode` que apunte al paquete oficial `opencode-ai` para garantizar ejecución inmediata sin depender de la resolución de red de npx en cada comando.
3. **Control de Memoria:**
   - Dado que el sistema dispone de 7.7 GiB de RAM (~2.9 GiB libres), el orquestador debe limitar procesos paralelos pesados y nunca disparar más de 2 agentes concurrentes sin control de recursos.
4. **Git Safety:**
   - La raíz `/home/darwinsin` no es un repositorio git. Cada tarea de Nexus operará dentro del repositorio de trabajo especificado (por defecto `~/.gemini/antigravity/scratch/nexus-ai-lab` o el proyecto del usuario), gestionando ramas `nexus/task-XXXX` y checkpoints automáticos antes de cualquier edición.

---

## 8. CONCLUSIÓN Y ESTADO DE APROBACIÓN PARA FASE 1

- **Entorno auditado:** Completo y verificado empíricamente.
- **Herramientas disponibles:** Todas las dependencias fundamentales (Git, Node, npm, pnpm, Python, OpenCode CLI, Antigravity IDE, SQLite) están presentes y operativas.
- **Fase 0 completada con éxito.** Listo para comenzar la **FASE 1 (CORE, CONFIG, LOGGER, CLI BASE)** tras la confirmación.
