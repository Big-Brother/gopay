; Script generated by the Inno Setup Script Wizard.
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

#define MyAppName "*USERVISIBLENAME*"
#define MyAppVersion "*VERSION*"
#define MyAppPublisher "SquarePay"
#define MyAppURL "*URL*"
#define MyAppExeName "*USERVISIBLENAME*.exe"
#define AppId "*WINDOWSAPPID*"

[Setup]
AppId={#AppId}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
;AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={pf}\{#MyAppName}
DefaultGroupName={#MyAppName}
OutputBaseFilename=*USERVISIBLENAME*
OutputDir=./
Compression=lzma
SolidCompression=yes
[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "french"; MessagesFile: "compiler:Languages\French.isl"
Name: "japanese"; MessagesFile: "compiler:Languages\Japanese.isl"
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "*USERVISIBLENAME*\win64\*USERVISIBLENAME*.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "*USERVISIBLENAME*\win64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "../www/img/app/logo.ico"; DestDir: "{app}"; DestName: "icon.ico"; Flags: ignoreversion
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}/icon.ico"
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}/icon.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Registry]
Root: HKCR; Subkey: "bitcoin"; ValueType: "string"; ValueData: "URL:Bitcoin Custom Protocol"; Flags: uninsdeletekey
Root: HKCR; Subkey: "bitcoin"; ValueType: "string"; ValueName: "URL Protocol"; ValueData: ""
Root: HKCR; Subkey: "bitcoin\DefaultIcon"; ValueType: "string"; ValueData: "{app}\{#MyAppExeName},0"
Root: HKCR; Subkey: "bitcoin\shell\open\command"; ValueType: "string"; ValueData: """{app}\{#MyAppExeName}"" ""%1"""

Root: HKCR; Subkey: "bitcoincash"; ValueType: "string"; ValueData: "URL:Bitcoin Cash Custom Protocol"; Flags: uninsdeletekey
Root: HKCR; Subkey: "bitcoincash"; ValueType: "string"; ValueName: "URL Cash Protocol"; ValueData: ""
Root: HKCR; Subkey: "bitcoincash\DefaultIcon"; ValueType: "string"; ValueData: "{app}\{#MyAppExeName},0"
Root: HKCR; Subkey: "bitcoincash\shell\open\command"; ValueType: "string"; ValueData: """{app}\{#MyAppExeName}"" ""%1"""

Root: HKCR; Subkey: "*APPURI*"; ValueType: "string"; ValueData: "URL:*USERVISIBLENAME* Custom Protocol"; Flags: uninsdeletekey
Root: HKCR; Subkey: "*APPURI*"; ValueType: "string"; ValueName: "URL Protocol"; ValueData: ""
Root: HKCR; Subkey: "*APPURI*\DefaultIcon"; ValueType: "string"; ValueData: "{app}\{#MyAppExeName},0"
Root: HKCR; Subkey: "*APPURI*\shell\open\command"; ValueType: "string"; ValueData: """{app}\{#MyAppExeName}"" ""%1"""
