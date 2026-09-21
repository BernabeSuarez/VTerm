import { app } from 'electron'
import { statSync } from 'fs'
import { validateDirectory } from '../directories'
import { vtermLog } from '../log'

// --- Integración con macOS (Finder: "Abrir en VTerm") ---
// El addon nativo @vterm/macos-services se registra como proveedor de
// NSServices. El flujo lo define AppKit:
//   - App cerrada: macOS inicia la app y entrega el pasteboard apenas se
//     registra la conexión (los pedidos pueden llegar antes de que el
//     renderer esté listo; openTerminalAt los encola y flush los entrega).
//   - App abierta: el pedido del servicio llega al provider de la instancia
//     en ejecución y se abre una pestaña nueva.

interface MacServicesAddon {
  isSupported: boolean
  registerProvider: (callback: (payload: { paths: string[] }) => void) => boolean
}

function createDirectoryHandler(openTerminalAt: (directory: string) => void) {
  return (path: string, source: string): void => {
    vtermLog.debug(`[context-menu] received path (${source}):`, path)
    const resolved = validateDirectory(path)
    if (resolved) {
      vtermLog.debug('[context-menu] validated directory:', resolved)
      openTerminalAt(resolved)
    }
  }
}

function loadMacServicesAddon(): MacServicesAddon | undefined {
  try {
    const macServices = require('@vterm/macos-services') as MacServicesAddon
    if (!macServices.isSupported) {
      vtermLog.warn('@vterm/macos-services no disponible; integración de Finder desactivada')
      return undefined
    }
    return macServices
  } catch (error) {
    vtermLog.error('fallo al cargar @vterm/macos-services:', error)
    return undefined
  }
}

export function installMacServices(openTerminalAt: (directory: string) => void): void {
  if (process.platform !== 'darwin') return

  const requestOpenDirectory = createDirectoryHandler(openTerminalAt)

  // El provider y la conexión DO (NSPortName) deben quedar registrados para
  // que Finder muestre y entregue el servicio. En el import del módulo el
  // run loop de AppKit puede no estar listo aún y `NSConnection` falla de
  // forma intermitente, así que se reintenta cuando la app está lista; el
  // addon es idempotente (solo crea la conexión si no existe).
  const register = (): void => {
    const macServices = loadMacServicesAddon()
    if (!macServices) return
    macServices.registerProvider(({ paths }) => {
      for (const path of paths) requestOpenDirectory(path, 'NSServices')
    })
  }

  register()
  app.whenReady().then(register)

  // `open -a VTerm <carpeta>` o abrir con VTerm desde el Dock/Finder.
  app.on('open-file', (event, filePath) => {
    event.preventDefault()
    try {
      if (statSync(filePath).isDirectory()) requestOpenDirectory(filePath, 'open-file')
    } catch {
      vtermLog.debug('[context-menu] open-file ignorado:', filePath)
    }
  })
}