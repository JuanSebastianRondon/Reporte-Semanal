#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
INSTALL_DIR="${REPORTE_HOME:-$HOME/.local/share/reporte-semanal}"
SYSTEMD_DIR="$HOME/.config/systemd/user"

echo "=== Instalador de Reporte Semanal para Linux ==="

mkdir -p "$INSTALL_DIR" "$SYSTEMD_DIR"

echo "Copiando archivos a $INSTALL_DIR..."
cp -r "$SRC_DIR/dist" "$INSTALL_DIR/"
cp -r "$SRC_DIR/node_modules" "$INSTALL_DIR/"
cp "$SRC_DIR/package.json" "$INSTALL_DIR/"
if [ -f "$SRC_DIR/.env" ]; then
  install -m 600 "$SRC_DIR/.env" "$INSTALL_DIR/.env"
fi

if [ -x "$SRC_DIR/bin/launcher" ] && [ -x "$SRC_DIR/bin/monitor" ] && [ -x "$SRC_DIR/bin/config" ]; then
  echo "Usando clientes Go incluidos en el paquete..."
  mkdir -p "$INSTALL_DIR/bin"
  cp -f "$SRC_DIR/bin/"* "$INSTALL_DIR/bin/"
elif command -v go >/dev/null 2>&1 && [ -d "$SRC_DIR/clients/linux" ]; then
  echo "Compilando clientes Go desde el código fuente..."
  mkdir -p "$INSTALL_DIR/bin"
  (
    cd "$SRC_DIR/clients/linux"
    go build -trimpath -ldflags='-s -w' -o "$INSTALL_DIR/bin/launcher" ./cmd/launcher
    go build -trimpath -ldflags='-s -w' -o "$INSTALL_DIR/bin/monitor" ./cmd/tray
    go build -trimpath -ldflags='-s -w' -o "$INSTALL_DIR/bin/config" ./cmd/config
  )
else
  echo "[Aviso] No hay clientes Go preconstruidos ni código fuente con Go disponible."
fi

echo "Configurando servicio systemd de usuario..."
cp "$SCRIPT_DIR/reporte-semanal.service" "$SYSTEMD_DIR/"
systemctl --user daemon-reload
systemctl --user enable reporte-semanal.service
systemctl --user restart reporte-semanal.service

echo ""
echo "=== Instalación completada ==="
echo "Estado: systemctl --user status reporte-semanal.service"
echo "Configuración: $INSTALL_DIR/bin/config"
