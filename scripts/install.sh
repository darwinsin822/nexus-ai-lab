#!/usr/bin/env bash
set -e

echo "=== Instalando Nexus AI Lab 3.0 (DeepSeek-First) ==="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOCAL_BIN="$HOME/.local/bin"

mkdir -p "$LOCAL_BIN"

# 1. Instalar / actualizar wrapper oficial OpenCode 2.x (@opencode/cli)
cat << 'EOF' > "$LOCAL_BIN/opencode"
#!/usr/bin/env bash
# OpenCode CLI wrapper for Linux/macOS
exec npx --yes --prefer-offline @opencode/cli "$@"
EOF
chmod +x "$LOCAL_BIN/opencode"
echo "✔ OpenCode CLI 2.x instalado en $LOCAL_BIN/opencode"

# 2. Enlazar binario global nexus
chmod +x "$PROJECT_DIR/bin/nexus.js"
ln -sf "$PROJECT_DIR/bin/nexus.js" "$LOCAL_BIN/nexus"
echo "✔ Binario nexus enlazado en $LOCAL_BIN/nexus"

# 3. Instalar skills de Antigravity si existe ~/.gemini/config/skills/
AG_SKILLS="$HOME/.gemini/config/skills"
if [ -d "$AG_SKILLS" ]; then
  mkdir -p "$AG_SKILLS/nexus-ai-lab"
  cp -u "$PROJECT_DIR/skills/nexus-ai-lab/SKILL.md" "$AG_SKILLS/nexus-ai-lab/SKILL.md" 2>/dev/null || true
  echo "✔ Skills de Antigravity instaladas en $AG_SKILLS"
fi

# 4. Asegurar ~/.local/bin en PATH
if [[ ":$PATH:" != *":$LOCAL_BIN:"* ]]; then
  echo "⚠ Recuerda añadir $LOCAL_BIN a tu PATH en ~/.bashrc o ~/.zshrc:"
  echo '  export PATH="$HOME/.local/bin:$PATH"'
fi

echo "======================================================"
echo "✔ Instalación completada con éxito."
echo "Para verificar el entorno ejecuta:"
echo "  nexus doctor"
echo "Para configurar tu clave de DeepSeek:"
echo "  export DEEPSEEK_API_KEY=\"sk-tu-clave-aqui\""
echo "======================================================"
