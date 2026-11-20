# Cliente Linux en Go — Reporte Semanal

Este directorio contiene los clientes nativos para Linux que interactúan con el backend de Node.js.

## Estructura

* `cmd/launcher/`: comprueba `/status` con token y lanza el backend.
* `cmd/tray/`: **monitor de estado por consola** (no hay AppIndicator/Systray implementado); verifica el servicio cada 30 s.
* `cmd/config/`: escribe `.env` con permisos `0600` y guarda `EMAIL_PASS` con `secret-tool` si está disponible.
* `internal/api/`: cliente HTTP que añade la cabecera `X-Report-Token` leyendo `<raiz>/.token`.

## Dependencias en Linux

Para la detección de inactividad se usa `xprintidle` (X11). Para guardar la contraseña en el llavero se usa `secret-tool` (libsecret). Ambos son opcionales: si faltan, se sigue con comportamiento degradado.

```bash
# Ubuntu / Debian (opcional)
sudo apt install libsecret-tools xprintidle
```

## Compilación

```bash
cd clients/linux
go build -o bin/launcher ./cmd/launcher
go build -o bin/monitor ./cmd/tray
go build -o bin/config ./cmd/config
```

El instalador `packaging/linux/install.sh` compila estos binarios automáticamente cuando `go` está disponible y los copia a `~/.local/share/reporte-semanal/bin`.
