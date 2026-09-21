import { BrowserWindow } from 'electron'
import { validateDirectory } from './directories'
import { vtermLog } from './log'

// --- Apertura de terminales desde el sistema operativo ---
// Es el punto de entrada único para abrir una terminal en una carpeta,
// independientemente del origen del pedido (Finder en macOS, menú contextual
// en Windows/Linux, `open-file`, una futura integración nueva...).

let pendingDirectories: string[] = []

function broadcastDirectories(): void {
  const win = BrowserWindow.getAllWindows()[0]
  if (!win || win.webContents.isDestroyed() || win.webContents.isLoading()) return
  if (pendingDirectories.length === 0) return
  const batch = pendingDirectories.splice(0)
  win.webContents.send('app:open-folder', { paths: batch })
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
}

// Abre una terminal nueva en `directory`. Si la ventana aún no está lista
// (arranque de la app), la ruta queda en cola y se entrega cuando el
// renderer termina de cargar; si hay una ventana disponible, se envía y el
// renderer crea una pestaña nueva sin tocar las existentes.
export function openTerminalAt(directory: string): void {
  const resolved = validateDirectory(directory)
  if (!resolved) {
    vtermLog.warn('ruta no válida ignorada:', directory)
    return
  }
  vtermLog.info('[terminal] opening with cwd:', resolved)
  pendingDirectories.push(resolved)
  broadcastDirectories()
}

// Entrega las carpetas en cola; se llama cuando el renderer termina de cargar.
export function flushPendingDirectories(): void {
  broadcastDirectories()
}