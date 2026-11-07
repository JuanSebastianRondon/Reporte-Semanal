# Cliente Linux en Go — Reporte Semanal

Este directorio contiene el cliente nativo para sistemas Linux (escrito en Go) para interactuar con el backend común de Node.js.

## Estructura

* `cmd/launcher/`: Inicia el servicio de fondo (Node.js) y levanta la bandeja.
* `cmd/tray/`: Bandeja de sistema con menú contextual para escritorios Linux (X11 / Wayland).
* `cmd/config/`: Herramienta para gestionar `.env` y el servicio de usuario de systemd.

## Dependencias en Linux

Para compilar con soporte de bandeja del sistema (`systray` / `libappindicator`):
```bash
# Ubuntu / Debian
sudo apt install libayatana-appindicator3-dev gcc

# Fedora
sudo dnf install libayatana-appindicator3-devel gcc

# Arch Linux
sudo pacman -S libayatana-appindicator gcc
```

## Compilación

```bash
# Compilar launcher
go build -o bin/launcher ./cmd/launcher

# Compilar tray
go build -o bin/tray ./cmd/tray

# Compilar config
go build -o bin/config ./cmd/config
```

