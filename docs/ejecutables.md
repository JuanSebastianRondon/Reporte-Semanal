# Comandos Útiles - Reporte Semanal v2.0

### Desarrollo y Ejecución
```powershell
# Compilar TypeScript
npm run build

# Ejecutar backend en desarrollo
npm run start:dev

# Ejecutar backend compilado
npm run start
```

### Probar Endpoints Locales (API en http://localhost:4577)

```powershell
# Consultar estado actual (horas acumuladas y fecha de último envío)
Invoke-RestMethod -Uri "http://localhost:4577/status"

# Forzar generación y envío del reporte de inmediato
Invoke-RestMethod -Uri "http://localhost:4577/report/generate" -Method Post

# Obtener la ruta de datos de la aplicación
Invoke-RestMethod -Uri "http://localhost:4577/app/data-folder"

# Detener el servicio limpiamente
Invoke-RestMethod -Uri "http://localhost:4577/app/quit" -Method Post
```
