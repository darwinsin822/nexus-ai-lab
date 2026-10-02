# RESOLUCIÓN DE PROBLEMAS (TROUBLESHOOTING)

### 1. `nexus doctor` reporta que OpenCode CLI no se encuentra
- Verifica que `/home/darwinsin/.local/bin` esté en tu `$PATH`.
- Ejecuta `which opencode`. Si no aparece, ejecuta `./scripts/install.sh`.

### 2. Tarea rechazada por Quality Gate (`FAIL`)
- Revisa el archivo de log en `.nexus/logs/nexus.log`.
- Comprueba si el código generado provocó errores de sintaxis o tests fallidos en `npm test`.
- Utiliza `nexus debug "<descripción del fallo>"` para intentar una corrección automática con fallback.

### 3. OpenCode responde lentamente o con error de timeout
- Los modelos gratuitos en la nube (`opencode/big-pickle`, etc.) dependen del tráfico en los servidores de la comunidad.
- Si un reintento falla dos veces, Nexus activará automáticamente el **Gemini Escalation Rule** para asegurar la entrega de la tarea.

### 4. Git reporta cambios pendientes antes de ejecutar
- Nexus crea automáticamente un checkpoint mediante stash/commit antes de ramas `nexus/task-XXXX`.
- Si deseas descartar cambios no deseados manualmente, hazlo mediante `git checkout` tras revisar `git diff`.
