# Reporte Semanal de Productividad

![Versión](https://img.shields.io/badge/versi%C3%B3n-2.0.4-blue)
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

La última versión compilada está disponible en la sección de [Releases](https://github.com/JuanSebastianRondon/Reporte-Semanal/releases) del repositorio.

| Archivo | Plataforma | Descripción |
|---|---|---|
| `ReporteSemanal-Setup.exe` | Windows 10/11 (x64) | Instalador guiado. No requiere permisos de administrador ni instalar Node.js. |
| `install.sh` | Linux (x86_64) | Script de instalación con soporte para `systemd` de usuario. |


## Para usuarios

### Requisitos

**Windows:**
- Windows 10 o Windows 11 (x64)
- .NET Framework 4.8 (incluido en Windows Update)

**Linux:**
- Distribución con soporte para `systemd` (Ubuntu, Debian, Fedora, Arch, etc.)
- Node.js runtime instalado en el sistema (`node >= 22`)
- Opcional: `secret-tool` para guardar la contraseña en el llavero, `xprintidle` para detectar inactividad (X11)

**Común:**
- Cuenta de Gmail con verificación en dos pasos activa
- Contraseña de aplicación de Gmail (16 caracteres)

### Cómo obtener la contraseña de aplicación de Gmail

1. Entra a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
2. Si no tienes la verificación en dos pasos activada, Google te pedirá activarla primero.
3. Escribe un nombre para identificar la app (ej. "Reporte Semanal").
4. Copia la contraseña de 16 caracteres generada y pégala en la pantalla de configuración.

### Seguridad y privacidad

- En Windows la contraseña se guarda **cifrada con DPAPI** del usuario (`EMAIL_PASS=dpapi:...`), escrita por `configuracion.exe`. En Linux se guarda en el llavero con `secret-tool` cuando está disponible; si no, se escribe en `.env` con permisos `0600`.
- La API local (`localhost:4577`) exige la cabecera `X-Report-Token`. El token se genera automáticamente la primera vez en el archivo `.token` de la carpeta de datos; los clientes lo leen de ahí. Las peticiones sin token reciben `401`.
- El timeout de inactividad (60 s) evita contar tiempo frente al PC sin interacción, y los huecos de más de 60 s (equipo suspendido) se descartan.
- El reporte se envía cuando corresponde a la semana ISO del flag `.report-sent`. Si el equipo estuvo apagado el lunes, se envía en el primer arranque de esa semana, no se pierde.
- Los reportes manuales **no reinician** el acumulado ni marcan la semana como enviada.

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
│   │   ├── configuracion/       ← configuracion.exe (credenciales cifradas con DPAPI)
│   │   ├── control/             ← control.exe (panel de control manual)
│   │   └── shared/              ← ApiAuth.cs (token de la API local)
│   │
│   └── linux/                   ← Clientes en Go
│       ├── go.mod
│       ├── internal/api/        ← Cliente HTTP con token
│       └── cmd/
│           ├── launcher/        ← Lanzador del proceso Node
│           ├── tray/            ← Monitor de estado por consola
│           └── config/          ← Configurador (.env + llavero)
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
├── test/                        ← Pruebas unitarias (node:test)
├── .github/                     ← CI (workflows) y Dependabot
├── runtime/                     ← Binarios de ejecución en Windows
├── package.json
└── tsconfig.json
```

### Mantener las dependencias actualizadas

El repositorio incluye `.github/dependabot.yml` para que GitHub revise las dependencias npm cada lunes y proponga actualizaciones mediante pull requests, incluyendo nuevas versiones mayores. La configuración empieza a aplicarse al incorporarla a la rama predeterminada. Revisa y valida cada propuesta antes de integrarla.

Conserva `package-lock.json` en el repositorio: registra las versiones exactas instaladas. Para instalar las versiones revisadas al clonar el proyecto, ejecuta `npm ci`.

```powershell
# Consultar versiones pendientes (código de salida 1 si hay actualizaciones)
npm run deps:check

# Actualizar dentro de los rangos permitidos y guardar los cambios
npm run deps:update

# Consultar vulnerabilidades conocidas, incluyendo dependencias indirectas
npm run audit

# Aplicar las correcciones compatibles disponibles
npm audit fix

# Verificar que el backend sigue compilando
npm run build
```

### Compilar el proyecto

#### 1. Backend (común)
```bash
npm run build
npm test          # compila y ejecuta 13 pruebas con node:test
```

#### 2. Clientes Windows (C#)
```powershell
npm run build:windows
```

Para actualizar los ejecutables distribuidos en raíz (script reproducible):
```powershell
npm run copy:windows
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
