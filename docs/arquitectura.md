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
* **Tracker (`src/tracker/`):** Registra el tiempo de uso de la ventana activa en memoria cada 5 segundos y realiza volcados atómicos a `data.json` cada 60 segundos (y al apagar el proceso).
* **Reports (`src/reports/`):** Tarea programada (Cron) que cada lunes evalúa si corresponde enviar el reporte por correo con el PDF adjunto (`pdfkit`).
* **Status / API (`src/status/`):** Expone endpoints locales en `http://localhost:4577`:
  * `GET /status`
  * `GET /app/data-folder`
  * `POST /app/quit`
* **Metrics (`src/metrics/`):** Calcula resúmenes, totales y porcentajes a partir de `data.json`.

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
  * `cmd/launcher/`: Verifica el estado de la API y lanza el backend Node.js en segundo plano.
  * `cmd/tray/`: Indicador en la barra del entorno de escritorio (GNOME, KDE, XFCE) usando AppIndicator / Systray.
  * `cmd/config/`: Utilidad para configurar variables de entorno y habilitar el servicio de systemd del usuario.

---

## 3. Empaquetado e Instaladores (`packaging/`)

* **`packaging/windows/`:** Script de Inno Setup (`instalador.iss`) para empaquetar ejecutables, runtime de Node y dependencias en un instalador `.exe` autoejecutable.
* **`packaging/linux/`:**
  * `reporte-semanal.service`: Unidad de `systemd` a nivel de usuario (`~/.config/systemd/user/`).
  * `install.sh`: Script de instalación para distribuciones Linux basadas en systemd.

