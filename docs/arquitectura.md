# Arquitectura del Proyecto — Reporte Semanal

Reporte Semanal es un sistema de monitoreo de productividad personal y generación de reportes semanales con arquitectura cliente-servidor desacoplada.

```
                           +----------------------------+
                           |  Backend NestJS (Node.js)  |
                           |   API REST: :4577          |
                           |   Tracker + Cron + PDF     |
                           +--------------+-------------+
                                          |
                    +---------------------+---------------------+
                    |                                           |
       +------------v------------+                 +------------v------------+
       |   clients/windows       |                 |   clients/linux         |
       |   (C# / .NET 4.8)       |                 |   (Go)                  |
       |  - Launcher.exe         |                 |  - launcher (daemon)    |
       |  - ReporteTray.exe      |                 |  - tray (systray)       |
       |  - configuracion.exe    |                 |  - config (cli/gui)     |
       |  - control.exe          |                 +-------------------------+
       +-------------------------+
```

---

## 1. Backend Core (`src/`)
El backend está construido con NestJS y corre de forma agnóstica al sistema operativo:
* **Tracker (`src/tracker/`):** Mide el tiempo real entre ticks (5 s), descarta huecos por suspensión, ignora períodos inactivos (>60 s) y realiza volcados atómicos a `data.json` cada 60 segundos (y al cerrar con `app.close()`).
* **Reports (`src/reports/`):** Cron horario que envía si la semana ISO del flag `.report-sent` es anterior a la actual (recupera reportes perdidos si el equipo estuvo apagado el lunes). El envío manual no reinicia los datos.
* **Status / API (`src/status/`):** Expone endpoints locales en `http://localhost:4577`, protegidos con `X-Report-Token`:
  * `GET /status`
  * `POST /report/generate`
  * `GET /app/data-folder`
  * `POST /app/quit`
* **Metrics (`src/metrics/`):** Calcula resúmenes, totales y el rango de fechas del PDF a partir de `data.json`.
* **Common / Secrets (`src/common/`, `src/secrets/`):** Rutas centralizadas, token de API y resolución de `EMAIL_PASS` (DPAPI en Windows, `secret-tool` en Linux, texto plano sólo como legado).

---

## 2. Clientes por Plataforma (`clients/`)

### Windows (`clients/windows/`)
* **Framework:** .NET Framework 4.8 (incluido por defecto en Windows 10/11 sin necesidad de runtime extra).
* **Proyectos:**
  * `launcher/`: Inicia el backend silenciosamente (`runtime\node.exe dist\main.js`) y abre el Tray.
  * `tray/`: Icono residente en el área de notificación con menú contextual.
  * `configuracion/`: Formulario WinForms para editar `.env` y alternar autoarranque (`HKCU\Software\Microsoft\Windows\CurrentVersion\Run`).
  * `control/`: Monitor rápido del estado del servidor y botón para detenerlo.

### Linux (`clients/linux/`)
* **Lenguaje:** Go.
* **Componentes:**
  * `cmd/launcher/`: Verifica el estado de la API (con token) y lanza el backend Node.js.
  * `cmd/tray/`: Monitor de estado por consola; comprueba el servicio cada 30 s. **No** implementa AppIndicator/Systray.
  * `cmd/config/`: Configura `.env` (0600), guarda la contraseña con `secret-tool` cuando está disponible y habilita el servicio de systemd del usuario.
  * `internal/api/`: Cliente HTTP compartido que añade la cabecera `X-Report-Token`.

---

## 3. Empaquetado e Instaladores (`packaging/`)

* **`packaging/windows/`:** Script de Inno Setup (`instalador.iss`) para empaquetar ejecutables, runtime de Node y dependencias en un instalador `.exe` autoejecutable.
* **`packaging/linux/`:**
  * `reporte-semanal.service`: Unidad de `systemd` a nivel de usuario (`~/.config/systemd/user/`).
  * `install.sh`: Script de instalación para distribuciones Linux basadas en systemd.

