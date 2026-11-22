# Comandos Útiles - Reporte Semanal v2.0.4

### Desarrollo y Ejecución
```powershell
# Compilar TypeScript
npm run build

# Ejecutar backend en desarrollo
npm run start:dev

# Ejecutar backend compilado
npm run start

# Compilar + ejecutar pruebas
npm test
```

### Probar Endpoints Locales (API en http://localhost:4577)

La API exige el token generado en `.token`. En PowerShell:

```powershell
$token = (Get-Content .token).Trim()

# Consultar estado actual (horas acumuladas y semana del último envío)
Invoke-RestMethod -Uri "http://localhost:4577/status" -Headers @{ "X-Report-Token" = $token }

# Forzar envío manual del reporte (no reinicia los datos)
Invoke-RestMethod -Uri "http://localhost:4577/report/generate" -Method Post -Headers @{ "X-Report-Token" = $token }

# Obtener la ruta de datos de la aplicación
Invoke-RestMethod -Uri "http://localhost:4577/app/data-folder" -Headers @{ "X-Report-Token" = $token }

# Detener el servicio limpiamente (flushes + cierre del Tray)
Invoke-RestMethod -Uri "http://localhost:4577/app/quit" -Method Post -Headers @{ "X-Report-Token" = $token }
```

En Linux:

```bash
TOKEN=$(cat .token)
curl -H "X-Report-Token: $TOKEN" http://localhost:4577/status
curl -X POST -H "X-Report-Token: $TOKEN" http://localhost:4577/app/quit
```
