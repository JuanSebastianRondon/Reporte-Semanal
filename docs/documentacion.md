# Documentación Técnica - Reporte Semanal de Productividad (v2.0.4)

---

## 1. Arquitectura General

Backend unificado en **NestJS** más componentes de escritorio en **C# / WinForms** (.NET Framework 4.8) y **Go**:

- **Backend NestJS (Node.js portable):**
  - Corre como servicio en segundo plano escuchando en `http://localhost:4577`.
  - Mide el tiempo real entre ticks de 5 s con `get-windows`, descarta huecos >60 s (suspensión) e ignora períodos con >60 s de inactividad. Persiste de forma atómica en `data.json` cada 60 s o al cerrarse.
  - Genera el PDF semanal (`pdfkit`) y lo envía por Gmail SMTP (`nodemailer`).
  - Lanza `runtime/ReporteTray.exe` al iniciarse (`detached`, sin bloquear la salida del proceso).
- **ReporteTray.exe (C# / WinForms):** icono del área de notificación, consulta `/status` cada 5 s y ofrece generar reporte, abrir datos y salir.
- **Launcher.exe (C#):** comprueba `/status` y, si no responde, lanza `runtime\node.exe dist\main.js` oculto.
- **Configuracion.exe / control.exe:** credenciales cifradas con DPAPI y encendido/apagado del servicio.
- **Clientes Linux (Go):** launcher, monitor de estado por consola y configurador con llavero.

---

## 2. API Local (Puerto 4577)

Todas las rutas exigen la cabecera `X-Report-Token`, cuyo valor se lee de `.token`:

| Método | Endpoint | Descripción | Respuesta Ejemplo |
|---|---|---|---|
| `GET` | `/status` | Estado del acumulador y semana del último reporte | `{"weekTotal":"12.5h","lastReportSentAt":"2026-W46"}` |
| `POST` | `/report/generate` | Genera y envía el reporte **sin** reiniciar datos ni cerrar la semana | `{"ok":true}` |
| `POST` | `/reports/send` | Igual que el anterior | `{"message":"Reporte enviado correctamente"}` |
| `GET` | `/app/data-folder` | Ruta del directorio de datos | `{"path":"C:\\Users\\...\\ReporteSemanal"}` |
| `POST` | `/app/quit` | Cierre controlado (`app.close()` → `flush()`) | `{"ok":true}` |

Sin token, cualquier endpoint responde `401 {"error":"No autorizado"}`.

---

## 3. Módulos Internos de NestJS

```
src/
├── app.module.ts              # Módulo raíz + ApiTokenMiddleware
├── main.ts                    # Bootstrap, lock, token, dotenv, Tray y handler de cierre
├── single-instance.ts         # .lock con PID + control de EADDRINUSE en main
├── common/
│   ├── paths.ts               # getAppDir() centralizado
│   ├── api-token.ts           # Generación/lectura de .token
│   └── api-token.middleware.ts# Verificación timing-safe de la cabecera
├── secrets/
│   ├── secrets.service.ts     # dpapi: / keyring: / texto plano (legado)
│   └── secrets.module.ts
├── tracker/
│   ├── tracker.service.ts     # Tiempo real, I/O atómico, flush al cerrar
│   ├── idle-detector.ts       # GetLastInputInfo (Windows) / xprintidle (Linux)
│   └── tracker.module.ts
├── metrics/
│   ├── metrics.service.ts     # Top 15 en minutos + horas totales
│   └── metrics.module.ts
├── mail/
│   ├── mail.service.ts        # SMTP con timeouts, destinatario configurable
│   └── mail.module.ts
├── reports/
│   ├── reports.service.ts     # Semana ISO, mutex de envío, reintentos
│   ├── week.ts                # getWeekKey / isDueForWeeklyReport
│   ├── reports.module.ts
│   └── templates/pdf.template.ts
└── status/
    ├── status.controller.ts
    ├── status.service.ts      # setShutdownHandler() para cierre graceful
    └── status.module.ts
```

---

## 4. Persistencia y Archivos de Estado

En `%APPDATA%\ReporteSemanal` (instalación) o raíz del proyecto (desarrollo):

- **`data.json`**: acumulado en segundos por aplicación (`{"apps":{"chrome.exe":1200},"totalSeconds":1200}`).
- **`.report-sent`**: semana ISO del último envío automático (`2026-W47`). Acepta el formato antiguo (`Mon Nov 09 2026`) para migrar.
- **`.env`**: `EMAIL_USER`, `EMAIL_PASS` (`dpapi:...` / `keyring:` / legado), `REPORT_RECEIVER` opcional y `REPORT_PDF_PALETTE` (`oceano`, `azul` o `grafito`; default `oceano`) para elegir los colores del PDF.
- **Vista previa de paletas**: `npm run preview:pdf` genera un `index.html` con muestras de colores y un PDF de ejemplo por paleta en la carpeta temporal del sistema.
- **`.lock`**: PID del proceso en ejecución. El desinstalador lo lee para matar **sólo** ese proceso.
- **`.token`**: token hexadecimal de 64 caracteres para la API local (0600 en sistemas POSIX).

### Regla semanal

`isDueForWeeklyReport()` compara la semana ISO del flag con la actual. Si el equipo estuvo apagado el lunes, el primer arranque de esa semana envía el reporte. El envío automático es el único que escribe el flag y reinicia `data.json`; los envíos manuales conservan el acumulado.

Para no bloquear `app.listen()`, el envío del arranque se programa con `setTimeout(..., 30000)` sin `await`. Un mutex (`inFlight`) evita duplicados entre cron, arranque y peticiones manuales.

---

## 5. Clientes de Escritorio

### Windows (`clients/windows/`)

```
clients/windows/
├── ReporteSemanal.sln
├── shared/ApiAuth.cs          # HttpClient con X-Report-Token
├── launcher/                  # Launcher.exe
├── tray/                      # ReporteTray.exe
├── configuracion/             # Configuracion.exe (DPAPI + HKCU Run)
└── control/                   # control.exe
```

- El autoarranque se gestiona **únicamente** con `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`. El instalador elimina el acceso directo obsoleto de `Startup` para evitar dos instancias y el modal “El servicio ya está corriendo”.
- `configuracion.exe` cifra `EMAIL_PASS` con `ProtectedData.Protect(..., CurrentUser)`.
- El desinstalador lee `.lock` y ejecuta `taskkill /PID <pid> /T`: ya no cierra otros procesos Node del sistema.

### Linux (`clients/linux/`)

- `cmd/launcher/`: lanza `node dist/main.js` (ruta calculada desde `bin/`).
- `cmd/tray/`: monitor de consola (no hay AppIndicator implementado).
- `cmd/config/`: guarda `.env` con `0600` y delega la contraseña a `secret-tool` si existe.
- `internal/api/`: petición HTTP con token.

---

## 6. Calidad y Verificación

- `npm test` compila con `tsc` y ejecuta 13 pruebas con `node --test` (sin dependencias extra): semanas ISO, métricas, PDF, flag/reintentos/mutex, token y middleware.
- `.github/workflows/ci.yml` ejecuta build + tests + `npm audit` en Linux y compila los clientes C# en Windows.
- `.github/dependabot.yml` revisa npm semanalmente los lunes (`America/Bogota`).
- `.github/workflows/release.yml` se dispara con tags `vX.Y.Z` o manualmente (`workflow_dispatch`, pidiendo el tag como input): valida la versión (`npm run version:check`), compila backend y clientes, genera `ReporteSemanal-Setup.exe` (Inno Setup) y `reporte-semanal-vX.Y.Z-linux.tar.gz`, y publica el release con `softprops/action-gh-release` y notas automáticas. El job de publicación es el único con `contents: write`. Sube el commit y el tag en push separados: `--follow-tags` puede registrar solo el evento de rama.
- `tsconfig.json` mantiene `strict: false` por compatibilidad con el código legado; las pruebas cubren los puntos críticos de lógica.
