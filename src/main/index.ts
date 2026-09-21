import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import * as pty from 'node-pty'
import { getDirectoryFromLaunchArguments } from './directories'
import { openTerminalAt, flushPendingDirectories } from './terminal-open'
import { loadConfig, saveConfig } from './config'
import { installLinuxIntegration } from './linux-integration'
import { installMacServices } from './platform/darwin'
import { installWindowsIntegration } from './platform/win32'
import { resolveProfile, listAvailableProfiles } from './profiles'
import { vtermLog } from './log'

// --- Integraciones de menú contextual por sistema operativo ---
// Todas derivan en `openTerminalAt(directory)`, que es el único punto de
// entrada para abrir una terminal en una carpeta desde el SO.
installMacServices(openTerminalAt)
installWindowsIntegration(openTerminalAt)

// Mapas de sesiones de terminal activas: id de pestaña -> proceso pty
const ptyProcesses = new Map<string, pty.IPty>()

// En desarrollo (sin empaquetar) la app no tiene bundle, así que no se
// usan los iconos de electron-builder; se setea el icono explícitamente.
function setDevIcons(): void {
  if (process.platform !== 'darwin' || app.isPackaged) return
  const iconPath = join(__dirname, '../../resources/icon.png')
  if (app.dock) app.dock.setIcon(iconPath)
}

function getDefaultShell(): string {
  if (process.platform === 'win32') return 'powershell.exe'
  return process.env.SHELL || '/bin/bash'
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 680,
    minWidth: 480,
    minHeight: 320,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())
  // Si una carpeta quedó en cola antes de que el renderer estuviera listo
  // (app cerrada al abrir el menú contextual), se entrega ahora.
  mainWindow.webContents.on('did-finish-load', () => flushPendingDirectories())

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// --- IPC: gestión del ciclo de vida de cada terminal (pestaña) ---

// Los callbacks del pty pueden dispararse durante el cierre de la ventana,
// cuando el webContents ya fue destruido; enviar en ese momento lanza
// "Object has been destroyed".
function sendToRenderer(sender: Electron.WebContents, channel: string, payload: unknown): void {
  if (sender.isDestroyed()) return
  sender.send(channel, payload)
}

ipcMain.handle(
  'pty:spawn',
  (
    event,
    { id, cols, rows, cwd, profile }: { id: string; cols: number; rows: number; cwd?: string; profile?: string }
  ) => {
    const existing = ptyProcesses.get(id)
    if (existing) {
      try {
        existing.resize(cols || existing.cols, rows || existing.rows)
      } catch {
        // el proceso ya terminó; se intenta crearlo de nuevo
      }
      return { pid: existing.pid }
    }

    const resolved = resolveProfile(profile)
    const shell = resolved?.shell || getDefaultShell()
    const args = resolved?.args || []
    const shellProcess = pty.spawn(shell, args, {
      name: 'xterm-256color',
      cols: cols || 80,
      rows: rows || 24,
      cwd: cwd || process.env.HOME || process.env.USERPROFILE,
      env: process.env as Record<string, string>
    })

    ptyProcesses.set(id, shellProcess)

    shellProcess.onData((data) => {
      sendToRenderer(event.sender, `pty:data:${id}`, data)
    })

    shellProcess.onExit(() => {
      sendToRenderer(event.sender, `pty:exit:${id}`, undefined)
      ptyProcesses.delete(id)
    })

    return { pid: shellProcess.pid }
  }
)

ipcMain.handle('profiles:list', () => listAvailableProfiles())

// --- Configuración persistente ===
ipcMain.handle('config:get', () => loadConfig())
ipcMain.handle('config:set', (_event, patch: Parameters<typeof saveConfig>[0]) => saveConfig(patch))

ipcMain.on('pty:write', (_event, { id, data }: { id: string; data: string }) => {
  ptyProcesses.get(id)?.write(data)
})

ipcMain.on('pty:resize', (_event, { id, cols, rows }: { id: string; cols: number; rows: number }) => {
  ptyProcesses.get(id)?.resize(cols, rows)
})

ipcMain.on('pty:kill', (_event, { id }: { id: string }) => {
  ptyProcesses.get(id)?.kill()
  ptyProcesses.delete(id)
})

// --- Instancia única ---
// Si la app ya corre y se invoca de nuevo (menú contextual, `open -a VTerm ...`),
// no se crea una segunda instancia: la primera recibe `second-instance` y
// reenvía la carpeta recibida para abrir una pestaña nueva.
const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    vtermLog.debug('[terminal] application already running; forwarding directory to existing instance')
    const launchPath = getDirectoryFromLaunchArguments(commandLine)
    if (launchPath) openTerminalAt(launchPath)
  })
}

app.whenReady().then(() => {
  setDevIcons()
  createWindow()

  if (app.isPackaged) {
    // Linux: se registra el manejo de carpetas para el gestor de archivos.
    if (process.platform === 'linux') installLinuxIntegration()
    // Windows/Linux: si la app se lanzó con una carpeta de argumento, abrirla.
    // En macOS la carpeta llega por el servicio nativo o `open-file`, no por argv.
    const launchPath = getDirectoryFromLaunchArguments(process.argv)
    if (launchPath) openTerminalAt(launchPath)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    else flushPendingDirectories()
  })
})

app.on('window-all-closed', () => {
  ptyProcesses.forEach((proc) => proc.kill())
  if (process.platform !== 'darwin') app.quit()
})