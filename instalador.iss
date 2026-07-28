
[Setup]
AppId={{61834A1B-73C4-479D-BD57-DB124D2F29A9}}
AppName=Reporte Semanal de Productividad
AppVersion=2.0.0
AppPublisher=Juanse
DefaultDirName={userappdata}\ReporteSemanal
DisableDirPage=yes
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=Output
OutputBaseFilename=ReporteSemanal-Setup
SetupIconFile=images\icon.ico
Compression=lzma2
SolidCompression=yes

[Files]
Source: "dist\*"; DestDir: "{app}\dist"; Flags: recursesubdirs ignoreversion
Source: "node_modules\*"; DestDir: "{app}\node_modules"; Flags: recursesubdirs ignoreversion
Source: "runtime\node.exe"; DestDir: "{app}\runtime"; Flags: ignoreversion
Source: "runtime\ReporteTray.exe"; DestDir: "{app}\runtime"; Flags: ignoreversion
Source: "Launcher.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "control.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "Configuracion.exe"; DestDir: "{app}"; Flags: ignoreversion

[Run]

Filename: "{app}\Configuracion.exe"; \
  Flags: waituntilterminated

[UninstallRun]

Filename: "powershell.exe"; \
  Parameters: "-ExecutionPolicy Bypass -Command ""Get-CimInstance Win32_Process | Where-Object {{ $_.ExecutablePath -eq '{app}\runtime\node.exe' -or $_.ExecutablePath -eq '{app}\runtime\ReporteTray.exe' } | ForEach-Object {{ Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } """; \
  Flags: runhidden; RunOnceId: "MatarProcesos"

Filename: "reg.exe"; \
  Parameters: "delete ""HKCU\Software\Microsoft\Windows\CurrentVersion\Run"" /v ReporteSemanal /f"; \
  Flags: runhidden; RunOnceId: "BorrarRegistro"

[UninstallDelete]

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
