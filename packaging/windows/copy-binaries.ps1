$ErrorActionPreference = 'Stop'

# $PSScriptRoot = <raiz>\packaging\windows -> subir dos niveles
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

Copy-Item "$root\clients\windows\launcher\bin\Release\net48\Launcher.exe" `
  -Destination "$root\Launcher.exe" -Force
Copy-Item "$root\clients\windows\tray\bin\Release\net48\ReporteTray.exe" `
  -Destination "$root\runtime\ReporteTray.exe" -Force
Copy-Item "$root\clients\windows\configuracion\bin\Release\net48\Configuracion.exe" `
  -Destination "$root\configuracion.exe" -Force
Copy-Item "$root\clients\windows\control\bin\Release\net48\control.exe" `
  -Destination "$root\control.exe" -Force

Write-Host 'Ejecutables actualizados correctamente.'
