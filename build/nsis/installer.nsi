Unicode true
!include "MUI2.nsh"
!include "FileFunc.nsh"
!define APPNAME "Apple Widgets"
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!define PUBLISHER "Arsenii & Fynn"
!define UNKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\AppleWidgets"
Name "${APPNAME}"
OutFile "..\..\dist\AppleWidgets-Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\Apple Widgets"
InstallDirRegKey HKCU "${UNKEY}" "InstallLocation"
RequestExecutionLevel user
SetCompressor /SOLID lzma
BrandingText "Apple Widgets · made by Arsenii and Fynn"
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "${APPNAME}"
VIAddVersionKey "CompanyName" "${PUBLISHER}"
VIAddVersionKey "FileDescription" "Apple Widgets Installer"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "LegalCopyright" "Arsenii & Fynn"

!define MUI_ICON "..\icon.ico"
!define MUI_UNICON "..\icon.ico"
!define MUI_WELCOMEFINISHPAGE_BITMAP "sidebar.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "sidebar.bmp"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_RIGHT
!define MUI_HEADERIMAGE_BITMAP "header.bmp"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Willkommen bei Apple Widgets"
!define MUI_WELCOMEPAGE_TEXT "Widgets im Apple-Stil für deinen Windows-Desktop.$\r$\n$\r$\nDer Assistent installiert Apple Widgets auf deinem Computer und legt ein Symbol im Startmenü und auf dem Desktop an.$\r$\n$\r$\nmade by Arsenii and Fynn"
!define MUI_FINISHPAGE_TITLE "Apple Widgets ist installiert"
!define MUI_FINISHPAGE_TEXT "Du findest Apple Widgets jetzt im Startmenü und auf dem Desktop."
!define MUI_FINISHPAGE_RUN "$INSTDIR\Apple Widgets.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Apple Widgets jetzt starten"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "German"

Section "Install"
  nsExec::Exec 'taskkill /F /IM "Apple Widgets.exe"'
  nsExec::Exec 'taskkill /F /IM "AppleWidgets.exe"'
  Sleep 800
  SetOutPath "$INSTDIR"
  File /r "..\..\dist\win-unpacked\*.*"
  WriteUninstaller "$INSTDIR\Deinstallieren.exe"
  CreateShortCut "$SMPROGRAMS\Apple Widgets.lnk" "$INSTDIR\Apple Widgets.exe" "" "$INSTDIR\Apple Widgets.exe" 0
  CreateShortCut "$DESKTOP\Apple Widgets.lnk" "$INSTDIR\Apple Widgets.exe" "" "$INSTDIR\Apple Widgets.exe" 0
  WriteRegStr HKCU "${UNKEY}" "DisplayName" "${APPNAME}"
  WriteRegStr HKCU "${UNKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNKEY}" "Publisher" "${PUBLISHER}"
  WriteRegStr HKCU "${UNKEY}" "DisplayIcon" "$INSTDIR\Apple Widgets.exe"
  WriteRegStr HKCU "${UNKEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNKEY}" "UninstallString" '"$INSTDIR\Deinstallieren.exe"'
  WriteRegDWORD HKCU "${UNKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNKEY}" "NoRepair" 1
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  WriteRegDWORD HKCU "${UNKEY}" "EstimatedSize" $0
SectionEnd

Section "Uninstall"
  nsExec::Exec 'taskkill /F /IM "Apple Widgets.exe"'
  Sleep 800
  Delete "$SMPROGRAMS\Apple Widgets.lnk"
  Delete "$DESKTOP\Apple Widgets.lnk"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "electron.app.Apple Widgets"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "ch.arsenii-fynn.applewidgets"
  DeleteRegKey HKCU "${UNKEY}"
  RMDir /r "$INSTDIR"
SectionEnd
