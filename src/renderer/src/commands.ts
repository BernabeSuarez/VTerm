import { effectiveKeymaps, detectPlatform, matchesKeyEvent, parseAccelerator } from './keymaps'

export type CommandHandlers = Record<string, (e: KeyboardEvent) => void>

/**
 * Construye un manejador de keydown que resuelve la combinación presionada
 * contra los keymaps efectivos y ejecuta el handler del comando que coincide.
 * Devuelve `true` cuando la tecla fue consumida por un comando (el llamador
 * debe hacer preventDefault), y `false` cuando debe seguir el flujo normal.
 *
 * `handlers` puede ser un objeto fijo o un getter que se re-evalúa en cada
 * tecla (útil cuando los handlers dependen de estado que cambia).
 * Un comando reasignado a `""` en config se ignora (equivale a desactivarlo).
 */
export function makeKeyHandler(
  userOverrides: Record<string, string>,
  handlers: CommandHandlers | (() => CommandHandlers),
  skipWhenTyping = false
): (e: KeyboardEvent) => boolean {
  const platform = detectPlatform()
  const isMac = platform === 'darwin'
  const keymaps = effectiveKeymaps(platform, userOverrides)
  const resolveHandlers = typeof handlers === 'function' ? handlers : () => handlers
  const parsedCache = new Map<string, ReturnType<typeof parseAccelerator> | null>()

  return (e: KeyboardEvent): boolean => {
    if (skipWhenTyping) {
      const el = document.activeElement
      if (el instanceof HTMLElement && el.hasAttribute('data-vterm-input')) return false
    }

    const currentHandlers = resolveHandlers()
    for (const [command, acc] of Object.entries(keymaps)) {
      const handler = currentHandlers[command]
      if (!handler) continue
      if (!parsedCache.has(command)) parsedCache.set(command, parseAccelerator(acc, isMac))
      const parsed = parsedCache.get(command)
      if (!parsed) continue
      if (matchesKeyEvent(e, parsed)) {
        handler(e)
        return true
      }
    }
    return false
  }
}