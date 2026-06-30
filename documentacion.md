# Documentación Técnica - Reporte Semanal de Productividad

---

## Arquitectura general

El proyecto tiene dos procesos independientes que corren en paralelo bajo pm2:

- **tracker.mjs**: Proceso Node.js puro que monitorea la ventana activa cada 5 segundos y guarda los datos en `data.json`.
- **reporte-semanal**: Aplicación NestJS que expone un endpoint HTTP y envía el reporte los lunes al iniciar.

---

## Estructura de archivos

```
raiz/
├── src/
│   ├── mail/
│   │   ├── mail.module.ts
│   │   └── mail.service.ts          # Envío de correo con nodemailer
│   ├── metrics/
│   │   ├── metrics.module.ts
│   │   └── metrics.service.ts       # Lectura y procesamiento de data.json
│   ├── reports/
│   │   ├── templates/
│   │   │   └── pdf.template.ts      # Generación del PDF con pdfkit
│   │   ├── reports.controller.ts    # Endpoint POST /reports/send
│   │   ├── reports.module.ts
│   │   └── reports.service.ts       # Lógica principal del reporte
│   ├── app.module.ts
│   └── main.ts                      # Bootstrap de NestJS en puerto 3000
├── tracker.mjs                      # Proceso de tracking independiente
├── data.json                        # Datos de uso acumulados de la semana
├── .report-sent                     # Flag para evitar envíos duplicados
├── instalar.ps1                     # Instalador Windows con GUI
├── control.ps1                      # Toggle para encender/apagar pm2
├── instalar-linux.mjs               # Instalador Linux con inquirer
└── .env                             # Credenciales (no incluido en el repo)
```

---

## tracker.mjs

Proceso independiente que no depende de NestJS.

**Funcionamiento:**
- Cada 5 segundos consulta la ventana activa con `active-win`.
- Suma 5 segundos al contador de la aplicación activa en `data.json`.
- Suma 5 segundos al contador total `totalSeconds`.
- Guarda los datos inmediatamente después de cada lectura.

**Estructura de data.json:**
```json
{
  "apps": {
    "chrome.exe": 3600,
    "code.exe": 1800
  },
  "totalSeconds": 5400
}
```

Los valores están en segundos.

---

## metrics.service.ts

Lee `data.json` y lo transforma para el reporte.

**getWeeklyMetrics():**
- Lee el archivo `data.json` desde `process.cwd()`.
- Convierte segundos a minutos redondeados.
- Ordena las apps de mayor a menor uso.
- Retorna el top 25 de apps y el total de horas formateado.

**Interfaz WeeklyMetrics:**
```typescript
{
  apps: { name: string; minutes: number }[];
  totalHours: string;
}
```

---

## reports.service.ts

Controla cuándo y cómo se envía el reporte.

**onModuleInit():**
- Se ejecuta automáticamente cada vez que NestJS arranca.
- Verifica si es lunes (`getDay() === 1`).
- Verifica si ya se envió el reporte hoy leyendo `.report-sent`.
- Si es lunes y no se ha enviado, llama a `sendWeeklyReport()`.

**sendWeeklyReport():**
- Obtiene las métricas de `MetricsService`.
- Genera el PDF con `generatePDF()`.
- Envía el correo con el PDF adjunto.
- Elimina el PDF temporal.
- Escribe la fecha de hoy en `.report-sent`.
- Reinicia `data.json` para la nueva semana.

**Endpoint manual:**
```
POST http://localhost:3000/reports/send
```

---

## pdf.template.ts

Genera el PDF usando pdfkit.

**Estructura del PDF:**
- Encabezado azul con el título y el total de horas.
- Lista de apps con nombre, minutos, horas y barra de progreso proporcional.
- Footer con texto generado automáticamente.

**Paleta de colores:**
- Encabezado: `#2563eb`
- Barras: gradiente de azules desde `#1d4ed8` hasta `#bfdbfe`
- Texto principal: `#111827`
- Texto secundario: `#6b7280`

---

## Variables de entorno (.env)

| Variable | Descripción |
|----------|-------------|
| EMAIL_USER | Correo Gmail remitente |
| EMAIL_PASS | Contraseña de aplicación de Gmail (16 caracteres) |

---

## Scripts de npm

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compila TypeScript a JavaScript en `/dist` |
| `npm run start` | Inicia la app compilada |
| `npm run start:dev` | Inicia en modo desarrollo con ts-node |
| `npm run start:all` | Inicia tracker y app en paralelo con concurrently |

---

## Procesos pm2

| Nombre | Archivo | Descripción |
|--------|---------|-------------|
| reporte-semanal | dist/main.js | Aplicación NestJS |
| tracker | tracker.mjs | Proceso de tracking |

---

## Flujo completo

```
PC enciende
    └── pm2 resurrect
            ├── tracker.mjs         → empieza a registrar uso cada 5s
            └── dist/main.js        → NestJS arranca
                    └── onModuleInit()
                            ├── ¿Es lunes?
                            │       └── ¿Ya se envió hoy?
                            │               └── No → sendWeeklyReport()
                            │                           ├── Genera PDF
                            │                           ├── Envía correo
                            │                           ├── Borra PDF
                            │                           ├── Marca .report-sent
                            │                           └── Reinicia data.json
                            └── No es lunes → no hace nada
```