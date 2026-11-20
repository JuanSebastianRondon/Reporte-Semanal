[Setup]
AppId={{61834A1B-73C4-479D-BD57-DB124D2F29A9}
AppName=Reporte Semanal de Productividad
AppVersion=2.0.3
AppPublisher=Juanse
AppPublisherURL=https://github.com/JuanSebastianRondon/Reporte-Semanal
AppSupportURL=https://github.com/JuanSebastianRondon/Reporte-Semanal
AppUpdatesURL=https://github.com/JuanSebastianRondon/Reporte-Semanal/releases
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

VersionInfoVersion=2.0.3.0
VersionInfoCompany=Juanse
VersionInfoDescription=Instalador de Reporte Semanal de Productividad
VersionInfoCopyright=Copyright (C) 2026 Juanse
VersionInfoProductName=Reporte Semanal de Productividad
VersionInfoProductVersion=2.0.3

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

[InstallDelete]
; Autoarranque único: se gestiona con HKCU\...\Run desde configuracion.exe.
; Se elimina el acceso directo de versiones anteriores para evitar duplicados.
Type: files; Name: "{userstartup}\Reporte Semanal.lnk"

[Run]
; Configurar correo y opciones al terminar la instalación
Filename: "{app}\configuracion.exe"; \
  Description: "Configurar correo y opciones de arranque"; \
  Flags: nowait postinstall skipifsilent

[UninstallRun]
; Se cierra el Tray por su nombre (es un ejecutable propio). El proceso Node
; se termina por PID leyendo .lock en [Code], para no matar otros Node del sistema.
Filename: "{sys}\taskkill.exe"; \
  Parameters: "/F /IM ReporteTray.exe /T"; \
  Flags: runhidden; RunOnceId: "MatarTray"

; Limpieza de la entrada de autoarranque (puede venir de versiones anteriores)
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

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  lockPath: string;
  ansiPid: AnsiString;
  pidText: string;
  exitCode: Integer;
begin
  if CurUninstallStep <> usUninstall then Exit;

  lockPath := ExpandConstant('{app}\.lock');
  if not FileExists(lockPath) then Exit;
  if not LoadStringFromFile(lockPath, ansiPid) then Exit;

  pidText := Trim(String(ansiPid));
  if (pidText = '') or (StrToIntDef(pidText, 0) <= 0) then Exit;

  Exec(ExpandConstant('{sys}\taskkill.exe'), '/F /PID ' + pidText + ' /T',
    '', SW_HIDE, ewWaitUntilTerminated, exitCode);
end;
