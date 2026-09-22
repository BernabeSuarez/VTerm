import { app, Menu } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'

// Menú de aplicación minimalista. La idea es que NO declare aceleradores que
// colisionen con los keymaps que maneja el renderer (Cmd/Ctrl+W, Cmd/Ctrl+T,
// zoom, etc.): se deja el manejo de teclas a un único lugar (el renderer),
// como hace Hyper al delegar todo a su command-registry.
// Se conservan los roles de sistema (edición, minimizar, salir, ocultar).
export function installApplicationMenu(): void {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = []

  if (isMac) {
    template.push({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    })
  }

  template.push(
    {
      label: 'Editar',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'Ventana',
      submenu: isMac ? [{ role: 'minimize' }, { role: 'zoom' }] : [{ role: 'quit' }]
    }
  )

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}