# SEGURIDAD Y PROTECCIÓN DE DATOS

## 1. Política de Cero Pérdida de Datos (Git Safety)

Nexus cuenta con una capa de seguridad estricta para salvaguardar el trabajo del usuario:
- **Checkpoints Automáticos:** Antes de ejecutar cualquier tarea que modifique código, Nexus genera un checkpoint o rama `nexus/task-XXXX`.
- **Prohibición de Comandos Destructivos:** Quedan estrictamente bloqueados por el validador:
  - `git reset --hard`
  - `git clean -fd`
  - `rm -rf /`
  - Operaciones equivalentes de borrado masivo.

## 2. Protección de Credenciales y Secretos

- **Sanitización Activa:** El módulo `Logger` filtra y reemplaza automáticamente con `[REDACTED_SECRET]` cualquier patrón de:
  - Google API Keys (`AIza...`)
  - OpenAI / Anthropic Keys (`sk-...`)
  - GitHub Tokens (`ghp_...`)
  - Bearer tokens en cabeceras HTTP
- **Aislamiento en Git:** El archivo `.nexus/.gitignore` protege de forma permanente los directorios de logs, caché y archivos de autenticación.
- **Sin Persistencia de Secretos:** `.nexus/config.json` prohíbe el almacenamiento de claves API. Se utiliza la autenticación nativa de cada proveedor.
