[Setup]
AppId={{61834A1B-73C4-479D-BD57-DB124D2F29A9}
AppName=Reporte Semanal de Productividad
AppVersion=2.0.0
AppPublisher=Juanse
AppPublisherURL=https://github.com/juanse
AppSupportURL=https://github.com/juanse
AppUpdatesURL=https://github.com/juanse
DefaultDirName={userappdata}\ReporteSemanal
DisableDirPage=yes
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
OutputDir=..\..\Output
OutputBaseFilename=ReporteSemanal-Setup
SetupIconFile=..\..\assets\icon.ico
WizardStyle=modern
Compression=lzma2
SolidCompression=yes

VersionInfoVersion=2.0.0.0
VersionInfoCompany=Juanse
VersionInfoDescription=Instalador de Reporte Semanal de Productividad
VersionInfoCopyright=Copyright (C) 2026 Juanse
VersionInfoProductName=Reporte Semanal de Productividad
VersionInfoProductVersion=2.0.0

[Files]
; Backend Node.js
Source: "..\..\dist\*";         DestDir: "{app}\dist";         Flags: recursesubdirs ignoreversion
Source: "..\..\node_modules\*"; DestDir: "{app}\node_modules"; Flags: recursesubdirs ignoreversion

; Runtime
Source: "..\..\runtime\node.exe";       DestDir: "{app}\runtime"; Flags: ignoreversion
Source: "..\..\runtime\ReporteTray.exe"; DestDir: "{app}\runtime"; Flags: ignoreversion

; Ejecutables C# (nombres exactos en minúsculas tal como los genera dotnet build)
Source: "..\..\Launcher.exe";       DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\control.exe";        DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\configuracion.exe";  DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{userstartup}\Reporte Semanal"; Filename: "{app}\Launcher.exe"; \
  IconFilename: "{app}\Launcher.exe"; Comment: "Inicia el Reporte Semanal de Productividad"

[Run]
; Configurar correo y opciones al terminar la instalación
Filename: "{app}\configuracion.exe"; \
  Description: "Configurar correo y opciones de arranque"; \
  Flags: nowait postinstall skipifsilent

[UninstallRun]
; Matar procesos antes de desinstalar (sin PowerShell para evitar falsos positivos AV)
Filename: "{sys}\taskkill.exe"; \
  Parameters: "/F /IM ReporteTray.exe /T"; \
  Flags: runhidden; RunOnceId: "MatarTray"

Filename: "{sys}\taskkill.exe"; \
  Parameters: "/F /IM node.exe /T"; \
  Flags: runhidden; RunOnceId: "MatarNode"

; Eliminar entrada del registro de autoarranque
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

