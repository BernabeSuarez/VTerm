; Agrega la entrada "Abrir en VTerm" al menú contextual de las carpetas
; en Explorer. Se escribe en HKCU\Software\Classes (vista por-usuario de HKCR)
; para que la instalación per-user no requiera privilegios de administrador.
; %1 es la ruta de la carpeta seleccionada; %V el directorio del fondo.

!macro customInstall
  ; Clic derecho sobre la carpeta
  WriteRegStr HKCU "Software\Classes\Directory\shell\VTerm" "" "Abrir en VTerm"
  WriteRegStr HKCU "Software\Classes\Directory\shell\VTerm" "Icon" "$INSTDIR\VTerm.exe"
  WriteRegStr HKCU "Software\Classes\Directory\shell\VTerm\command" "" '"$INSTDIR\VTerm.exe" "%1"'

  ; Clic derecho sobre el fondo (dentro de la carpeta)
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\VTerm" "" "Abrir en VTerm"
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\VTerm" "Icon" "$INSTDIR\VTerm.exe"
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\VTerm\command" "" '"$INSTDIR\VTerm.exe" "%V"'
!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\Classes\Directory\shell\VTerm"
  DeleteRegKey HKCU "Software\Classes\Directory\Background\shell\VTerm"
!macroend