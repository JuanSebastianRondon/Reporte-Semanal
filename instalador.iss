; Reporte Semanal de Productividad - Instalador
; Requisitos previos antes de compilar este script:
;   1. npm run build                      -> genera dist/
;   2. npm prune --production             -> reduce node_modules
;   3. Descargar node.exe portable x64 y ponerlo en runtime/node.exe
;   4. dotnet build -c Release en tray/    -> copiar el .exe resultante
;      a runtime/ReporteTray.exe
;   5. setup.ps1 en la raíz del proyecto (mismo nivel que dist/, runtime/)

[Setup]
AppId={{B5D9A5C4-8F2C-4B1E-9C3D-CAMBIAR-ESTE-GUID}}
AppName=Reporte Semanal de Productividad
AppVersion=1.0.0
AppPublisher=Juanse
DefaultDirName={userappdata}\ReporteSemanal
DisableDirPage=yes
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=Output
OutputBaseFilename=ReporteSemanal-Setup
Compression=lzma2
SolidCompression=yes

[Files]
Source: "dist\*"; DestDir: "{app}\dist"; Flags: recursesubdirs ignoreversion
Source: "node_modules\*"; DestDir: "{app}\node_modules"; Flags: recursesubdirs ignoreversion
Source: "runtime\node.exe"; DestDir: "{app}\runtime"; Flags: ignoreversion
Source: "runtime\ReporteTray.exe"; DestDir: "{app}\runtime"; Flags: ignoreversion
Source: "setup.ps1"; DestDir: "{app}"; Flags: ignoreversion

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; \
  ValueType: string; ValueName: "ReporteSemanal"; \
  ValueData: """{app}\runtime\node.exe"" ""{app}\dist\main.js"""; \
  Flags: uninsdeletevalue

[Run]
; Postinstall: pide correo + contraseña de aplicación, escribe .env y data.json
Filename: "powershell.exe"; \
  Parameters: "-ExecutionPolicy Bypass -File ""{app}\setup.ps1"" -AppDir ""{app}"""; \
  Flags: runhidden waituntilterminated

; Arranca el backend (que a su vez spawnea el tray) apenas termina el postinstall
Filename: "{app}\runtime\node.exe"; \
  Parameters: """{app}\dist\main.js"""; \
  Flags: runhidden nowait

[UninstallRun]
; Mata node.exe y el tray por ruta exacta, no por nombre, para no tocar
; otros procesos node.exe que el usuario tenga corriendo en el sistema.
Filename: "powershell.exe"; \
  Parameters: "-ExecutionPolicy Bypass -Command ""Get-CimInstance Win32_Process | Where-Object {{ $_.ExecutablePath -eq '{app}\runtime\node.exe' -or $_.ExecutablePath -eq '{app}\runtime\ReporteTray.exe' } | ForEach-Object {{ Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } """; \
  Flags: runhidden; RunOnceId: "MatarProcesos"

[UninstallDelete]
; {app} es la misma carpeta donde vive el .env, data.json, .lock y
; .report-sent (instalación == carpeta de datos, según lo decidido).
; Se borra todo. Esto incluye credenciales de correo, es intencional.
Type: filesandordirs; Name: "{app}"

[Code]
function IsDotNet48Installed(): Boolean;
var
  releaseKey: Cardinal;
begin
  Result := RegQueryDWordValue(HKLM, 'SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full', 'Release', releaseKey)
    and (releaseKey >= 528040);
end;

function InitializeSetup(): Boolean;
begin
  Result := True;
  if not IsDotNet48Installed() then
  begin
    MsgBox('Este programa necesita .NET Framework 4.8, que normalmente ya viene instalado ' +
      'en Windows 10 y 11 con las actualizaciones al día. Ve a Windows Update, busca ' +
      'actualizaciones, reinicia si te lo pide, y vuelve a correr este instalador.',
      mbError, MB_OK);
    Result := False;
  end;
end;
