// Metadatos de atajos para mostrarlos en el panel de ayuda. Los comandos
// siguen la nomenclatura de Hyper; la lista se resuelve contra los keymaps
// efectivos (defaults de la plataforma + reasignaciones del usuario).

export interface ShortcutCommand {
  id: string
  label: string
}

export interface ShortcutGroup {
  id: string
  label: string
  commands: ShortcutCommand[]
}

const JUMP_COMMANDS: ShortcutCommand[] = []
for (let i = 1; i <= 8; i++) {
  JUMP_COMMANDS.push({ id: `tab:jump:${i}`, label: `Ir a la pestaña ${i}` })
}
JUMP_COMMANDS.push({ id: 'tab:jump:last', label: 'Ir a la última pestaña' })

export const SHORTCUTS_GROUPS: ShortcutGroup[] = [
  {
    id: 'tabs',
    label: 'Pestañas',
    commands: [
      { id: 'tab:new', label: 'Nueva pestaña' },
      { id: 'tab:close', label: 'Cerrar pestaña' },
      { id: 'tab:prev', label: 'Pestaña anterior' },
      { id: 'tab:next', label: 'Pestaña siguiente' },
      ...JUMP_COMMANDS
    ]
  },
  {
    id: 'panes',
    label: 'Paneles',
    commands: [
      { id: 'pane:splitRight', label: 'Dividir a la derecha' },
      { id: 'pane:splitDown', label: 'Dividir abajo' },
      { id: 'pane:close', label: 'Cerrar panel' }
    ]
  },
  {
    id: 'terminal',
    label: 'Terminal',
    commands: [
      { id: 'editor:search', label: 'Buscar en el terminal' },
      { id: 'editor:clearBuffer', label: 'Limpiar pantalla' }
    ]
  },
  {
    id: 'zoom',
    label: 'Zoom',
    commands: [
      { id: 'zoom:in', label: 'Aumentar tamaño de letra' },
      { id: 'zoom:out', label: 'Disminuir tamaño de letra' },
      { id: 'zoom:reset', label: 'Restablecer tamaño' }
    ]
  },
  {
    id: 'vista',
    label: 'Vista',
    commands: [
      { id: 'view:themes', label: 'Cambiar tema' },
      { id: 'view:profiles', label: 'Cambiar shell por defecto' },
      { id: 'view:shortcuts', label: 'Ver atajos de teclado' }
    ]
  }
]