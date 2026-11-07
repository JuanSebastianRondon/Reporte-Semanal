# Documentación Técnica - Reporte Semanal de Productividad (v2.0)

---

## 1. Arquitectura General

La aplicación se compone de un backend unificado en **NestJS** y componentes auxiliares de escritorio en **C# / WinForms** (.NET Framework 4.8):

- **Backend NestJS (Node.js portable)**:
  - Corre como servicio en segundo plano escuchando en `http://localhost:4577`.
  - Registra las ventanas activas cada 5 segundos mediante `get-windows`, acumulando el tiempo de uso en memoria y persistiendo de forma atómica a `data.json` cada 60 segundos o al cerrarse.
  - Genera el reporte PDF semanal (`pdfkit`) y lo envía automáticamente por correo (`nodemailer` vía Gmail SMTP) cada lunes.
  - Lanza automáticamente el icono de bandeja del sistema (`ReporteTray.exe`) al inicializarse.
- **ReporteTray.exe (C# / WinForms)**:
  - Icono en el área de notificación (System Tray).
  - Consulta periódicamente `GET /status` para mostrar el tooltip con las horas acumuladas.
  - Ofrece menú contextual para generar reporte manual, abrir la carpeta de datos y apagar el programa.
- **Launcher.exe (C#)**:
  - Punto de entrada principal (utilizado por el registro de Windows al inicio de sesión).
  - Comprueba si el backend ya está corriendo; si no, lanza `runtime\node.exe dist\main.js` de forma invisible.
- **Configuracion.exe / control.exe**:
  - Formularios de interfaz de usuario para configurar credenciales y arranque automático, y encender/apagar el servicio.

---

## 2. API Local (Puerto 4577)

| Método | Endpoint | Descripción | Respuesta Ejemplo |
|---|---|---|---|
| `GET` | `/status` | Estado actual del acumulador semanal y fecha del último reporte | `{"weekTotal":"12.5h","lastReportSentAt":"Mon Nov 03 2026"}` |
| `POST` | `/report/generate` | Genera y envía inmediatamente el reporte semanal por correo | `{"ok":true}` |
| `GET` | `/app/data-folder` | Ruta del directorio de datos de la aplicación | `{"path":"C:\\Users\\...\\ReporteSemanal"}` |
| `POST` | `/app/quit` | Detiene y cierra el servicio de backend de manera controlada | `{"ok":true}` |

---

## 3. Módulos Internos de NestJS

```
src/
├── app.module.ts              # Módulo raíz que importa Schedule, Tracker, Mail, Metrics, Reports y Status
├── main.ts                    # Bootstrap, control de instancia única (PID lock) y spawn del Tray
├── single-instance.ts         # Mecanismo de bloqueo con .lock para garantizar proceso único
├── tracker/
│   ├── tracker.service.ts     # Detección periódica (5s), caché en memoria y persistencia atómica
│   └── tracker.module.ts
├── metrics/
│   ├── metrics.service.ts     # Agrupa segundos a minutos, calcula top 15 de apps y horas totales
│   └── metrics.module.ts
├── mail/
│   ├── mail.service.ts        # Conexión SMTP con Gmail y envío del adjunto PDF
│   └── mail.module.ts
├── reports/
│   ├── reports.service.ts     # Orquestación de envío, reintentos y programación recurrente con @Cron
│   ├── reports.module.ts
│   └── templates/
│       └── pdf.template.ts    # Maquetado y renderizado del reporte en PDF con pdfkit
└── status/
    ├── status.controller.ts   # Expone endpoints REST consumidos por el Tray y Launcher
    ├── status.service.ts
    └── status.module.ts
```

---

## 4. Persistencia y Archivos de Estado

En el directorio de la aplicación (`%APPDATA%\ReporteSemanal` en instalación, o directorio raíz en desarrollo):

- **`data.json`**: Acumulado semanal en segundos por aplicación (`{"apps": {"chrome.exe": 1200}, "totalSeconds": 1200}`).
- **`.report-sent`**: Almacena la fecha del último reporte enviado para evitar reenvíos duplicados el mismo día.
- **`.env`**: Almacena las variables de entorno `EMAIL_USER` y `EMAIL_PASS`.
- **`.lock`**: Contiene el PID del proceso en ejecución para garantizar instancia única y evitar duplicidad de puertos o procesos en segundo plano.


---

## 5. Componentes de Escritorio en C# (`csharp/`)

Todos los componentes de interfaz gráfica y ciclo de vida de escritorio están unificados en la carpeta `csharp/`:

```
csharp/
├── ReporteSemanal.sln         # Solución para compilar todos los proyectos
├── launcher/                   # Launcher.exe: Verifica el backend y lanza runtime\node.exe
├── tray/                       # ReporteTray.exe: Icono en la bandeja del sistema con menú
├── configuracion/              # Configuracion.exe: Ventana para configurar correo y autoarranque
└── control/                    # control.exe: Ventana para encender o apagar el servicio
```
