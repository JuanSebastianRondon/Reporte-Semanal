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

VersionInfoVersion=2.0.0.0
VersionInfoCompany=Juanse
VersionInfoDescription=Instalador de Reporte Semanal de Productividad
VersionInfoCopyright=Copyright (C) 2026 Juanse
VersionInfoProductName=Reporte Semanal de Productividad
VersionInfoProductVersion=2.0.0

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
  Description: "Configurar correo y opciones de arranque"; \
  Flags: waituntilterminated

[UninstallRun]
Filename: "{sys}\taskkill.exe"; \
  Parameters: "/F /IM ReporteTray.exe /T"; \
  Flags: runhidden; RunOnceId: "MatarTray"

Filename: "{sys}\taskkill.exe"; \
  Parameters: "/F /IM node.exe /T"; \
  Flags: runhidden; RunOnceId: "MatarNode"

Filename: "{sys}\reg.exe"; \
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
