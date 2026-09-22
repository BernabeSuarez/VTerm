// Atajos de teclado por comando, con defaults según la plataforma.
// La sintaxis de un acelerador es la de los accels de Electron:
//   "cmd+shift+t", "ctrl+alt+left", "cmd+=", ...
// Los comandos que viven acá siguen la nomenclatura de Hyper (tab:, pane:,
// editor:, zoom:, view:). Cada capa (App y Terminal) registra los handlers de
// los comandos que le corresponden y usa este mismo mapa para la reasignación
// del usuario, que se persiste en `config.keymaps`.

export type PlatformName = 'darwin' | 'win32' | 'linux'

export function detectPlatform(): PlatformName {
  const p = (typeof navigator !== 'undefined' && navigator.platform) || ''
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || ''
  if (/mac/i.test(p)) return 'darwin'
  if (/win/i.test(p) || /windows/i.test(ua)) return 'win32'
  return 'linux'
}

export function isMacPlatform(): boolean {
  return detectPlatform() === 'darwin'
}

const TAB_JUMP_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const

/** Defaults por plataforma. En darwin el modificador primario es cmd; en
 *  win32/linux es ctrl. La navegación de pestañas usa alt+arrows en mac y
 *  pageup/pagedown en el resto, igual que Hyper. */
export function defaultKeymaps(platform: PlatformName): Record<string, string> {
  const mod = platform === 'darwin' ? 'cmd' : 'ctrl'
  const prevNextTab =
    platform === 'darwin'
      ? { 'tab:prev': 'cmd+alt+left', 'tab:next': 'cmd+alt+right' }
      : { 'tab:prev': 'ctrl+pageup', 'tab:next': 'ctrl+pagedown' }

  const jumps: Record<string, string> = {}
  TAB_JUMP_KEYS.forEach((idx, i) => {
    jumps[`tab:jump:${i + 1}`] = `${mod}+${idx}`
  })
  jumps['tab:jump:last'] = `${mod}+9`

  return {
    'tab:new': `${mod}+t`,
    'tab:close': `${mod}+w`,
    ...prevNextTab,
    ...jumps,
    'pane:splitRight': `${mod}+shift+d`,
    'pane:splitDown': `${mod}+shift+e`,
    'pane:close': `${mod}+shift+w`,
    'editor:search': `${mod}+f`,
    'editor:clearBuffer': `${mod}+k`,
    'zoom:in': `${mod}+=`,
    'zoom:out': `${mod}+-`,
    'zoom:reset': `${mod}+0`,
    'view:themes': `${mod}+,`,
    'view:shortcuts': `${mod}+/`
  }
}

/** Efectivas = defaults de la plataforma + reasignaciones del usuario. */
export function effectiveKeymaps(
  platform: PlatformName,
  userOverrides: Record<string, string> = {}
): Record<string, string> {
  return { ...defaultKeymaps(platform), ...userOverrides }
}

interface ParsedAccelerator {
  meta: boolean
  ctrl: boolean
  alt: boolean
  shift: boolean
  key: string
  /** true cuando la tecla es un símbolo (ej: "=", "-", "]") que en la mayoría
   *  de los teclados requiere shift: en esos casos no se exige que shift
   *  coincida, para que "cmd+=" siga funcione aunque el evento reporte shift. */
  symbol: boolean
}

const MODIFIER_TOKENS: Record<string, 'meta' | 'ctrl' | 'alt' | 'shift'> = {
  cmd: 'meta',
  command: 'meta',
  super: 'meta',
  meta: 'meta',
  mod: 'meta',
  ctrl: 'ctrl',
  control: 'ctrl',
  alt: 'alt',
  option: 'alt',
  opt: 'alt',
  shift: 'shift'
}

export function parseAccelerator(acc: string, isMac: boolean): ParsedAccelerator | null {
  const tokens = acc
    .trim()
    .toLowerCase()
    .split('+')
    .map((t) => t.trim())
    .filter(Boolean)
  if (tokens.length === 0) return null

  const parsed: ParsedAccelerator = { meta: false, ctrl: false, alt: false, shift: false, key: '', symbol: false }

  for (const token of tokens) {
    const mod = MODIFIER_TOKENS[token]
    if (mod) {
      if (mod === 'meta') {
        // "cmd"/"command"/"mod" se mapean a meta en macOS y a ctrl en el resto.
        if (isMac) parsed.meta = true
        else parsed.ctrl = true
      } else if (mod === 'ctrl') {
        parsed.ctrl = true
      } else if (mod === 'alt') {
        parsed.alt = true
      } else {
        parsed.shift = true
      }
      continue
    }
    if (parsed.key) return null // token inválido o doble tecla
    parsed.key = token
  }

  if (!parsed.key) return null
  parsed.symbol = !/[a-z0-9]/.test(parsed.key)
  return parsed
}

const KEY_ALIASES: Record<string, string> = {
  space: 'space',
  spacebar: 'space',
  escape: 'esc',
  esc: 'esc',
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  pageup: 'pageup',
  pagedown: 'pagedown',
  enter: 'enter',
  return: 'enter',
  backspace: 'backspace',
  delete: 'del',
  tab: 'tab'
}

function eventKeyName(e: KeyboardEvent): string {
  const key = e.key.toLowerCase()
  return KEY_ALIASES[key] ?? key
}

export function matchesKeyEvent(e: KeyboardEvent, parsed: ParsedAccelerator): boolean {
  if (eventKeyName(e) !== parsed.key) return false
  if (e.metaKey !== parsed.meta) return false
  if (e.ctrlKey !== parsed.ctrl) return false
  if (e.altKey !== parsed.alt) return false
  if (parsed.shift) {
    if (!e.shiftKey) return false
  } else if (!parsed.symbol && e.shiftKey) {
    return false
  }
  return true
}

const KEY_DISPLAY: Record<string, string> = {
  left: '←',
  right: '→',
  up: '↑',
  down: '↓',
  pageup: 'PageUp',
  pagedown: 'PageDown',
  enter: 'Enter',
  return: 'Enter',
  esc: 'Esc',
  space: 'Espacio',
  tab: 'Tab',
  backspace: '⌫',
  del: '⌦'
}

function displayKey(key: string): string {
  return KEY_DISPLAY[key] ?? key.toUpperCase()
}

/** Convierte un acelerador (ej: "cmd+shift+d") a texto legible, con notación
 *  de símbolos en macOS (⌘⇧D) y de texto en Windows/Linux (Ctrl+Shift+D). */
export function formatAccelerator(acc: string, platform: PlatformName): string {
  const tokens = acc
    .trim()
    .toLowerCase()
    .split('+')
    .map((t) => t.trim())
    .filter(Boolean)
  if (tokens.length === 0) return ''
  const isMac = platform === 'darwin'
  const parts: string[] = []
  for (const token of tokens) {
    const t = token.toLowerCase()
    if (['cmd', 'command', 'super', 'meta', 'mod'].includes(t)) {
      parts.push(isMac ? '⌘' : 'Ctrl')
    } else if (['ctrl', 'control'].includes(t)) {
      parts.push(isMac ? '⌃' : 'Ctrl')
    } else if (['alt', 'option', 'opt'].includes(t)) {
      parts.push(isMac ? '⌥' : 'Alt')
    } else if (t === 'shift') {
      parts.push(isMac ? '⇧' : 'Shift')
    } else {
      parts.push(displayKey(t))
    }
  }
  return isMac ? parts.join('') : parts.join('+')
}