# Reporte Semanal de Productividad

![Versión](https://img.shields.io/badge/versi%C3%B3n-2.0.0-blue)
![Plataforma](https://img.shields.io/badge/plataforma-Windows-0078D6)
![Lenguaje](https://img.shields.io/badge/lenguaje-TypeScript-3178C6)
![Licencia](https://img.shields.io/badge/licencia-MIT-green)
![Release](https://img.shields.io/github/v/release/JuanSebastianRondon/Reporte-Semanal)

Aplicación de escritorio para Windows que registra automáticamente el tiempo de uso de cada aplicación abierta en pantalla, genera un reporte semanal en PDF con ese historial, y lo envía por correo electrónico cada lunes de forma automática. Una vez configurado, el usuario no necesita hacer nada manualmente.

El programa corre en segundo plano desde el arranque de Windows (si el usuario lo activa así), con un icono en la bandeja del sistema que permite ver el estado, generar un reporte manual, o apagar la app.

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

Cada lunes, si la app estuvo corriendo, se genera el PDF con el resumen de la semana y se envía al correo configurado.


### Qué NO hace esta app

- No soporta múltiples usuarios ni múltiples correos destino.
- No tiene dashboard web ni interfaz gráfica de métricas más allá del PDF.
- No soporta otros proveedores de correo distintos a Gmail (aunque `nodemailer` podría adaptarse con cambios en `mail.service.ts`).
- El reporte solo se envía si el backend está corriendo el lunes. Si la máquina estuvo apagada ese día, el reporte de esa semana no se envía, en dado caso lo haría el siguiente lunes.
- El ejecutable no está firmado con certificado de código, lo que podría generar alertas de Windows SmartScreen en algunas configuraciones.

---

## Para desarrolladores

### Stack tecnológico

**Backend (proceso principal)**
- `Node.js` (runtime portable, sin instalación requerida en la máquina del usuario)
- `NestJS` + `TypeScript`
- `get-windows`: detección de la ventana activa cada 5 segundos
- `pdfkit`: generación del reporte en PDF
- `nodemailer`: envío del reporte por correo vía Gmail SMTP
- `dotenv`: carga de credenciales desde `.env`

**Frontend / UI**
- C# / WinForms sobre .NET Framework 4.8 (preinstalado en Windows 10 y 11). Compilados con `dotnet build -c Release`
- `ReporteTray.exe`: icono en la bandeja del sistema con menú contextual
- `Launcher.exe`: punto de entrada, arranca el backend
  Archivos Powershell compilados con `ps2exe`
- `Configuracion.exe`: formulario de configuración inicial (correo, contraseña, autoarranque)
- `control.exe`: ventana de encendido/apagado manual del servicio


**Instalador**
- Inno Setup: genera un único `.exe` instalador sin requerir admin, instala en `%APPDATA%\ReporteSemanal` del usuario actual

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

El tray hace polling cada 5 segundos a `/status` para actualizar el tooltip. El launcher, `control.exe` y `configuracion.exe` también consumen esta API.

**Datos**

Todo se guarda en `%APPDATA%\ReporteSemanal`:

- `data.json`: acumula segundos por aplicación, se resetea cada lunes tras enviar el reporte
- `.env`: credenciales de Gmail (`EMAIL_USER`, `EMAIL_PASS`)
- `.report-sent`: flag que indica si el reporte del lunes ya fue enviado
- `.lock`: archivo de PID para garantizar instancia única del backend

**Seguridad y estabilidad**

- Single instance lock: si hay un proceso vivo con el PID del `.lock`, el nuevo se cierra solo.
- Lock huérfano: si el PID no existe, se sobreescribe y arranca normal.
- Error handling en el spawn del tray: si no encuentra `ReporteTray.exe`, loguea y sigue.
- El PDF se borra siempre después del envío, incluso si el envío falla (`try/finally`).

### Estructura de carpetas

```
Reporte_semanal/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── single-instance.ts
│   ├── mail/
│   │   └── mail.service.ts
│   ├── metrics/
│   │   └── metrics.service.ts
│   ├── reports/
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
├── tray/
│   ├── ReporteTray.csproj
│   ├── Program.cs
│   └── TrayApplicationContext.cs
├── launcher/
│   ├── ReporteLauncher.csproj
│   └── Program.cs
├── runtime/
│   ├── node.exe        (no en repo, descargar de nodejs.org)
│   └── ReporteTray.exe (no en repo, compilar con dotnet build)
├── images/
│   └── icon.ico
├── dist/               (generado por npm run build)
├── node_modules/       (generado por npm ci)
├── configuracion.ps1
├── control.ps1
├── Launcher.exe        (compilado con dotnet build)
├── Configuracion.exe   (compilado con ps2exe)
├── control.exe         (compilado con ps2exe)
├── instalador.iss
└── package.json
```

### Requisitos de desarrollo

- Node.js v22 (misma versión que el `node.exe` portable empacado)
- npm
- .NET SDK con soporte `net48` + .NET Framework 4.8 Developer Pack
- `ps2exe` (`Install-Module ps2exe -Scope CurrentUser`)
- Inno Setup para compilar el instalador
- Windows (el tray y el launcher usan WinForms, no compilan en otros SO)

### Compilar y empacar el instalador

```
npm ci
npm run build
npm prune --production
```

Descarga `node.exe` portable x64 de [nodejs.org](https://nodejs.org) y colócalo en `runtime\node.exe`.

```
cd tray && dotnet build -c Release
```

Copia `tray\bin\Release\net48\ReporteTray.exe` a `runtime\ReporteTray.exe`.

```
cd launcher && dotnet build -c Release
```

Copia `launcher\bin\Release\net48\ReporteSemanal.exe` a la raíz como `Launcher.exe`.

Compila `configuracion.ps1` con `ps2exe` como `Configuracion.exe` (flags: `-STA -noConsole`).

Compila `control.ps1` con `ps2exe` como `control.exe` (flags: `-STA -noConsole`).

```
iscc instalador.iss
```

El instalador queda en `Output\ReporteSemanal-Setup.exe`.

### Publicar un release

1. Actualiza la versión en `package.json` y en `instalador.iss`.
2. Compila el instalador siguiendo los pasos anteriores.
3. Crea el tag correspondiente: `git tag v2.0.0 && git push origin v2.0.0`.
4. En GitHub, ve a **Releases → Draft a new release**, selecciona el tag y sube `Output\ReporteSemanal-Setup.exe` como asset.
5. Describe los cambios respecto a la versión anterior en las notas del release.

### Comportamiento esperado tras instalar

1. El instalador copia los archivos a `%APPDATA%\ReporteSemanal` sin pedir admin.
2. Abre `Configuracion.exe` automáticamente.
3. El usuario ingresa correo Gmail y contraseña de aplicación.
4. El usuario elige si quiere arranque automático con Windows.
5. Al guardar, escribe `.env` y `data.json` en la carpeta de instalación.
6. Lanza `Launcher.exe`, que arranca el backend y el tray.
7. El tray aparece en la bandeja del sistema.
8. Cada lunes al arrancar, el backend revisa si ya envió el reporte.
9. Si no lo envió, genera el PDF y lo manda al correo configurado.
10. Resetea `data.json` y marca `.report-sent` con la fecha actual.
