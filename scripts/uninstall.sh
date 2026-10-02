#!/usr/bin/env bash
set -e

echo "=== Desinstalando accesos directos de Nexus AI Lab ==="
rm -f "$HOME/.local/bin/nexus"
echo "✔ Enlace $HOME/.local/bin/nexus eliminado."
echo "Nota: El repositorio local y los archivos en .nexus/ se preservan."
