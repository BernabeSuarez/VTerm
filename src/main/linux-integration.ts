import { app } from 'electron'
import { homedir } from 'os'
import { chmodSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

// Registra a VTerm como manejador de carpetas en Linux. Se ejecuta en cada
// arranque de la app empaquetada y escribe de forma idempotente:
//   1. Un desktop file con MimeType=inode/directory -> permite "Abrir con VTerm".
//   2. Un script en Nautilus (GNOME Files) -> aparece "Abrir en VTerm" al hacer
//      clic derecho sobre una carpeta.
// Funciona para AppImage (vía $APPIMAGE) y para paquetes instalados (deb/rpm,
// vía process.execPath).

function appCommand(): string {
  // AppImage: $APPIMAGE apunta al archivo original fuera del mount temporal.
  if (process.env.APPIMAGE) return process.env.APPIMAGE
  return process.execPath
}

function quoteShell(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

export function installLinuxIntegration(): void {
  if (process.platform !== 'linux' || !app.isPackaged) return

  const dataHome = process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share')
  const applicationsDir = join(dataHome, 'applications')
  const nautilusDir = join(dataHome, 'nautilus', 'scripts')
  mkdirSync(applicationsDir, { recursive: true })
  mkdirSync(nautilusDir, { recursive: true })

  const cmd = appCommand()

  // Permite abrir carpetas con VTerm desde "Open With Other Application".
  const desktopEntry = [
    '[Desktop Entry]',
    'Type=Application',
    'Name=Abrir en VTerm',
    `Exec="${cmd}" %f`,
    'MimeType=inode/directory;',
    'NoDisplay=true',
    'Terminal=false'
  ].join('\n')
  writeFileSync(join(applicationsDir, 'vterm-open-folder.desktop'), `${desktopEntry}\n`)

  // Menú contextual directo en Nautilus (GNOME Files).
  const script = [
    '#!/bin/sh',
    '# Abre VTerm en las carpetas seleccionadas',
    'for dir in "$@"; do',
    '  if [ -d "$dir" ]; then',
    `    nohup ${quoteShell(cmd)} "$dir" >/dev/null 2>&1 &`,
    '  fi',
    'done'
  ].join('\n')
  const scriptPath = join(nautilusDir, 'Abrir en VTerm')
  writeFileSync(scriptPath, `${script}\n`)
  chmodSync(scriptPath, 0o755)
}