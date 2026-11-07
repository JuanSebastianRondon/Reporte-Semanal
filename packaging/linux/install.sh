#!/usr/bin/env bash
set -e

INSTALL_DIR="$HOME/.local/share/reporte-semanal"
SYSTEMD_DIR="$HOME/.config/systemd/user"

echo "=== Instalador de Reporte Semanal para Linux ==="

# 1. Crear directorios
mkdir -p "$INSTALL_DIR"
mkdir -p "$SYSTEMD_DIR"

# 2. Copiar archivos del backend
echo "Copiando archivos a $INSTALL_DIR..."
cp -r ../../dist "$INSTALL_DIR/"
cp -r ../../node_modules "$INSTALL_DIR/"
cp ../../package.json "$INSTALL_DIR/"
[ -f ../../.env ] && cp ../../.env "$INSTALL_DIR/"

# 3. Instalar servicio systemd de usuario
echo "Configurando servicio systemd de usuario..."
cp reporte-semanal.service "$SYSTEMD_DIR/"
systemctl --user daemon-reload
systemctl --user enable reporte-semanal.service
systemctl --user restart reporte-semanal.service

echo ""
echo "=== Instalación completada ==="
echo "El servicio se encuentra corriendo bajo systemd."
echo "Para ver el estado: systemctl --user status reporte-semanal.service"

