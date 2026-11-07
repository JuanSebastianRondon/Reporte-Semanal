# Reporte Semanal de Productividad

![Versión](https://img.shields.io/badge/versi%C3%B3n-2.0.0-blue)
![Plataformas](https://img.shields.io/badge/plataformas-Windows%20%7C%20Linux-informational)
![Lenguajes](https://img.shields.io/badge/lenguajes-TypeScript%20%7C%20C%23%20%7C%20Go-3178C6)
![Licencia](https://img.shields.io/badge/licencia-MIT-green)
![Release](https://img.shields.io/github/v/release/JuanSebastianRondon/Reporte-Semanal)

Aplicación que registra automáticamente el tiempo de uso de cada aplicación abierta en pantalla, genera un reporte semanal en PDF con ese historial y lo envía por correo electrónico cada lunes de forma automática. Una vez configurado, no requiere intervención manual.

El programa corre en segundo plano desde el arranque del sistema operativo, con un icono en la bandeja del sistema para monitorear el estado, generar reportes bajo demanda, abrir la carpeta de datos o apagar el servicio.

---

## Documentación adicional

* [Arquitectura del Proyecto](docs/arquitectura.md): Estructura Monorepo, backend NestJS y clientes nativos por plataforma.
* [Endpoints y Ejecutables](docs/ejecutables.md): Guía detallada de la API interna (`:4577`) y binarios.
* [Documentación Técnica](docs/documentacion.md): Detalles profundos sobre persistencia, I/O atómico y módulos.

---

## Descargas

La última versión compilada está disponible en la sección de [Releases](https://github.com/usuario/reporte-semanal/releases) del repositorio.

| Archivo | Plataforma | Descripción |
|---|---|---|
| `ReporteSemanal-Setup.exe` | Windows 10/11 (x64) | Instalador guiado. No requiere permisos de administrador ni instalar Node.js. |
| `install.sh` | Linux (x86_64) | Script de instalación con soporte para `systemd` de usuario. |

---

## Para usuarios

### Requisitos

**Windows:**
- Windows 10 o Windows 11 (x64)
- .NET Framework 4.8 (incluido en Windows Update)

**Linux:**
- Distribución con soporte para `systemd` (Ubuntu, Debian, Fedora, Arch, etc.)
- Node.js runtime instalado en el sistema (`node >= 18`)

**Común:**
- Cuenta de Gmail con verificación en dos pasos activa
- Contraseña de aplicación de Gmail (16 caracteres)

### Cómo obtener la contraseña de aplicación de Gmail

1. Entra a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
2. Si no tienes la verificación en dos pasos activada, Google te pedirá activarla primero.
3. Escribe un nombre para identificar la app (ej. "Reporte Semanal").
4. Copia la contraseña de 16 caracteres generada y pégala en la pantalla de configuración.

---

## Para desarrolladores

### Estructura del proyecto

```text
Reporte_semanal/
│
├── src/                         ← Backend común (NestJS / TypeScript)
│   ├── app.module.ts
│   ├── main.ts
│   ├── mail/                    ← Servicio de envío SMTP (nodemailer)
│   ├── metrics/                 ← Cálculo de resúmenes de uso
│   ├── reports/                 ← Generación de PDF (pdfkit) y cron
│   ├── status/                  ← Endpoints HTTP (:4577)
│   └── tracker/                 ← Captura de ventanas activas y volcado atómico
│
├── clients/                     ← Clientes nativos por sistema operativo
│   ├── windows/                 ← Clientes en C# / .NET 4.8
│   │   ├── ReporteSemanal.sln
│   │   ├── launcher/            ← Launcher.exe (inicia backend y bandeja)
│   │   ├── tray/                ← ReporteTray.exe (icono en área de notificación)
│   │   ├── configuracion/       ← configuracion.exe (formulario WinForms)
│   │   └── control/             ← control.exe (panel de control manual)
│   │
│   └── linux/                   ← Clientes en Go
│       ├── go.mod
│       └── cmd/
│           ├── launcher/        ← Lanzador y supervisor del proceso Node
│           ├── tray/            ← Indicador de bandeja (systray / AppIndicator)
│           └── config/          ← Configurador de variables de entorno
│
├── packaging/                   ← Instaladores y servicios
│   ├── windows/
│   │   └── instalador.iss       ← Script de Inno Setup
│   └── linux/
│       ├── reporte-semanal.service ← Unidad de usuario systemd
│       └── install.sh           ← Instalador para Linux
│
├── assets/                      ← Iconos y recursos gráficos
├── docs/                        ← Documentación técnica
├── runtime/                     ← Binarios de ejecución en Windows
├── package.json
└── tsconfig.json
```

### Compilar el proyecto

#### 1. Backend (común)
```bash
npm run build
```

#### 2. Clientes Windows (C#)
```powershell
npm run build:windows
```

Para actualizar los ejecutables distribuidos en raíz:
```powershell
Copy-Item clients/windows/launcher/bin/Release/net48/Launcher.exe -Destination Launcher.exe
Copy-Item clients/windows/tray/bin/Release/net48/ReporteTray.exe -Destination runtime/ReporteTray.exe
Copy-Item clients/windows/configuracion/bin/Release/net48/Configuracion.exe -Destination configuracion.exe
Copy-Item clients/windows/control/bin/Release/net48/control.exe -Destination control.exe
```

#### 3. Instalador de Windows
Compila el instalador con Inno Setup:
```powershell
iscc packaging/windows/instalador.iss
```

#### 4. Clientes Linux (Go)
```bash
cd clients/linux
go build -o bin/launcher ./cmd/launcher
go build -o bin/tray ./cmd/tray
go build -o bin/config ./cmd/config
```
