# Reporte Semanal de Productividad

![Versión](https://img.shields.io/badge/versi%C3%B3n-2.0.0-blue)
![Plataforma](https://img.shields.io/badge/plataforma-Windows-0078D6)
![Lenguaje](https://img.shields.io/badge/lenguaje-TypeScript%20%2F%20C%23-3178C6)
![Licencia](https://img.shields.io/badge/licencia-MIT-green)
![Release](https://img.shields.io/github/v/release/JuanSebastianRondon/Reporte-Semanal)

Aplicación de escritorio para Windows que registra automáticamente el tiempo de uso de cada aplicación abierta en pantalla, genera un reporte semanal en PDF con ese historial, y lo envía por correo electrónico cada lunes de forma automática. Una vez configurado, el usuario no necesita hacer nada manualmente.

El programa corre en segundo plano desde el arranque de Windows (si el usuario lo activa así), con un icono en la bandeja del sistema que permite ver el estado, generar un reporte manual, abrir la carpeta de datos o apagar la app.

---

## Descargas

La última versión compilada está disponible en la sección de [Releases](https://github.com/usuario/reporte-semanal/releases) del repositorio.

| Archivo | Descripción |
|---|---|
| `ReporteSemanal-Setup.exe` | Instalador para Windows 10/11 (x64). No requiere permisos de administrador. |

No hace falta tener Node.js instalado. El instalador incluye un `node.exe` portable.

---

## Para usuarios

### Requisitos

- Windows 10 o Windows 11 (x64)
- .NET Framework 4.8 (viene preinstalado y se actualiza mediante Windows Update)
- Cuenta de Gmail con verificación en dos pasos activa
- Una contraseña de aplicación de Gmail (ver guía abajo)

### Cómo obtener la contraseña de aplicación de Gmail

Gmail no permite usar tu contraseña normal para enviar correos desde aplicaciones externas. Necesitas generar una contraseña de aplicación:

1. Entra a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
2. Si no tienes la verificación en dos pasos activada, Google te pedirá activarla primero. Es obligatorio, no hay forma de saltar este paso.
3. Una vez dentro, escribe un nombre para identificar la app, por ejemplo "Reporte Semanal".
4. Haz clic en generar. Google te mostrará una contraseña de 16 caracteres, en grupos de 4.
5. Copia esa contraseña completa (sin espacios) y pégala en el campo correspondiente durante la configuración de la app.
6. Esa contraseña no se puede volver a ver después, así que si la pierdes tendrás que generar una nueva.

### Instalación

1. Descarga `ReporteSemanal-Setup.exe` desde [Releases](https://github.com/usuario/reporte-semanal/releases).
2. Ejecútalo. Se instala en `%APPDATA%\ReporteSemanal`, sin pedir permisos de administrador.
3. Se abrirá automáticamente la pantalla de configuración.
4. Ingresa tu correo de Gmail y la contraseña de aplicación (no tu contraseña normal).
5. Elige si quieres que la app arranque automáticamente con Windows.
6. Guarda. La app arranca sola y verás el icono en la bandeja del sistema.

Cada lunes, si la app está corriendo o al iniciar sesión, se genera el PDF con el resumen de la semana y se envía al correo configurado.

### Qué NO hace esta app

- No soporta múltiples usuarios ni múltiples correos destino.
- No tiene dashboard web ni interfaz gráfica de métricas más allá del PDF.
- No soporta otros proveedores de correo distintos a Gmail (aunque `nodemailer` podría adaptarse con cambios en `mail.service.ts`).
- No requiere permisos de administrador para instalarse ni ejecutarse.

---

## Para desarrolladores

### Stack tecnológico

**Backend (proceso principal)**
- `Node.js` (runtime portable empacado en `runtime\node.exe`)
- `NestJS` + `TypeScript`
- `get-windows`: detección de la ventana activa cada 5 segundos
- `pdfkit`: generación del reporte en PDF
- `nodemailer`: envío del reporte por correo vía Gmail SMTP
- `dotenv`: carga de credenciales desde `.env`
- `@nestjs/schedule`: temporización automática y cron jobs

**Frontend / UI (C# nativo)**
- C# / WinForms sobre .NET Framework 4.8 (100% nativo, sin dependencias externas):
  - `ReporteTray.exe`: icono en la bandeja del sistema con menú contextual y tooltip de horas acumuladas
  - `Launcher.exe`: punto de entrada que arranca el backend de forma segura
  - `Configuracion.exe`: formulario nativo de configuración inicial (correo, contraseña, autoarranque)
  - `control.exe`: ventana de encendido/apagado manual del servicio

**Instalador**
- Inno Setup: genera un instalador `.exe` sin requerir permisos de administrador, instalando en `%APPDATA%\ReporteSemanal`

### Arquitectura

**Flujo de arranque**

1. Windows lanza `Launcher.exe` al iniciar sesión (si el autoarranque está activado).
2. `Launcher.exe` verifica si el backend ya corre (`GET localhost:4577/status`).
3. Si no corre, lanza `runtime\node.exe dist\main.js` con el directorio correcto.
4. El backend NestJS arranca y levanta el servidor HTTP en `localhost:4577`.
5. El backend lanza `runtime\ReporteTray.exe` como proceso hijo.
6. El tray aparece en la bandeja del sistema.

**Comunicación interna**

El backend expone una API HTTP local en `localhost:4577`:

- `GET /status`
- `POST /report/generate`
- `POST /app/quit`
- `GET /app/data-folder`

El tray hace polling cada 5 segundos a `/status` para actualizar el tooltip. El launcher, `control.exe` y `Configuracion.exe` también consumen esta API.

**Datos**

Todo se guarda en `%APPDATA%\ReporteSemanal`:

- `data.json`: acumula segundos por aplicación en memoria y persiste a disco cada 60s
- `.env`: credenciales de Gmail (`EMAIL_USER`, `EMAIL_PASS`)
- `.report-sent`: flag con la fecha de hoy para evitar envíos duplicados el lunes
- `.lock`: archivo de PID para garantizar instancia única del backend

### Estructura de carpetas

```
Reporte_semanal/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── single-instance.ts
│   ├── mail/
│   │   ├── mail.module.ts
│   │   └── mail.service.ts
│   ├── metrics/
│   │   ├── metrics.module.ts
│   │   └── metrics.service.ts
│   ├── reports/
│   │   ├── reports.controller.ts
│   │   ├── reports.module.ts
│   │   ├── reports.service.ts
│   │   └── templates/
│   │       └── pdf.template.ts
│   ├── status/
│   │   ├── status.controller.ts
│   │   ├── status.module.ts
│   │   └── status.service.ts
│   └── tracker/
│       ├── tracker.module.ts
│       └── tracker.service.ts
├── csharp/
│   ├── ReporteSemanal.sln
│   ├── launcher/
│   │   ├── ReporteLauncher.csproj
│   │   └── Program.cs
│   ├── tray/
│   │   ├── ReporteTray.csproj
│   │   ├── Program.cs
│   │   └── TrayApplicationContext.cs
│   ├── configuracion/
│   │   ├── ReporteConfiguracion.csproj
│   │   └── Program.cs
│   └── control/
│       ├── ReporteControl.csproj
│       └── Program.cs
├── runtime/
│   ├── node.exe        (portable node runtime)
│   └── ReporteTray.exe (compilado con dotnet build)
├── images/
│   ├── icon.ico
│   ├── configuracion-de-sobres.ico
│   ├── cronometro.ico
│   └── encendido.ico
├── dist/               (generado por npm run build)
├── node_modules/
├── Launcher.exe        (compilado con dotnet build)
├── Configuracion.exe   (compilado con dotnet build)
├── control.exe         (compilado con dotnet build)
├── instalador.iss
└── package.json
```

### Requisitos de desarrollo

- Node.js v22
- npm
- .NET SDK con soporte `net48` (o .NET Framework 4.8 Developer Pack)
- Inno Setup (opcional, para compilar el instalador `iscc instalador.iss`)

### Compilar todo el proyecto

```powershell
# 1. Compilar Backend NestJS
npm run build

# 2. Compilar todas las aplicaciones C#
npm run build:csharp

# 3. Copiar ejecutables a producción
Copy-Item csharp/launcher/bin/Release/net48/Launcher.exe -Destination Launcher.exe
Copy-Item csharp/tray/bin/Release/net48/ReporteTray.exe -Destination runtime/ReporteTray.exe
Copy-Item csharp/configuracion/bin/Release/net48/Configuracion.exe -Destination Configuracion.exe
Copy-Item csharp/control/bin/Release/net48/control.exe -Destination control.exe

# 4. Compilar instalador
iscc instalador.iss
```
