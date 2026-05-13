[Setup]
AppName=Reporte Semanal de Productividad
AppVersion=1.0.0
AppPublisher=Juan Sebastian Rondon
DefaultDirName={autopf}\ReporteSemanal
DefaultGroupName=Reporte Semanal
OutputBaseFilename=ReporteSemanal-Setup
SetupIconFile=.\images\icon.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Files]
Source: "*"; DestDir: "{app}"; Flags: recursesubdirs ignoreversion; Excludes: "*.git,node_modules,.env,*.log"

[Icons]
Name: "{group}\Reporte Semanal"; Filename: "{app}\Reporte-semanal.exe"
Name: "{commondesktop}\Reporte Semanal"; Filename: "{app}\Reporte-semanal.exe"

[Run]
Filename: "{app}\Reporte-semanal.exe"; Description: "Configurar ahora"; Flags: postinstall nowait skipifsilent