[Setup]
PrivilegesRequired=lowest
DefaultDirName={userappdata}\ReporteSemanal
DisableDirPage=yes

[Files]
Source: "dist\*"; DestDir: "{app}\dist"; Flags: recursesubdirs ignoreversion
Source: "node_modules\*"; DestDir: "{app}\node_modules"; Flags: recursesubdirs ignoreversion
Source: "runtime\node.exe"; DestDir: "{app}\runtime"; Flags: ignoreversion
Source: "runtime\ReporteTray.exe"; DestDir: "{app}\runtime"; Flags: ignoreversion
Source: "setup.ps1"; DestDir: "{app}"; Flags: ignoreversion

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "ReporteSemanal"; ValueData: """{app}\runtime\node.exe"" ""{app}\dist\main.js"""

[Run]
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\setup.ps1"" -AppDir ""{app}"""; Flags: runhidden waituntilterminated
Filename: "{app}\runtime\node.exe"; Parameters: "{app}\dist\main.js"; Flags: runhidden nowait