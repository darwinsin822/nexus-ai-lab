#!/usr/bin/env bash
set -e

echo "=== Instalando Nexus AI Lab 2.0 ==="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOCAL_BIN="$HOME/.local/bin"

mkdir -p "$LOCAL_BIN"

# 1. Enlazar wrapper opencode si no existe
if [ ! -f "$LOCAL_BIN/opencode" ]; then
  cat << 'EOF' > "$LOCAL_BIN/opencode"
#!/usr/bin/env bash
exec npx --yes opencode-ai "$@"
EOF
  chmod +x "$LOCAL_BIN/opencode"
  echo "✔ Wrapper opencode instalado en $LOCAL_BIN/opencode"
fi

# 2. Enlazar binario nexus
chmod +x "$PROJECT_DIR/bin/nexus.js"
ln -sf "$PROJECT_DIR/bin/nexus.js" "$LOCAL_BIN/nexus"
echo "✔ Binario nexus enlazado en $LOCAL_BIN/nexus"

echo "=== Instalación completada con éxito ==="
echo "Ejecuta: nexus doctor"
