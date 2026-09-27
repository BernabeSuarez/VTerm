import { effectiveKeymaps, detectPlatform, matchesKeyEvent, parseAccelerator } from './keymaps'

export type CommandHandlers = Record<string, (e: KeyboardEvent) => void>

/**
 * true cuando la tecla viene de un input de escritura (el textarea auxiliar de
 * xterm o la barra de búsqueda, ambos marcados con `data-vterm-input`) y sin
 * modificador. Sólo se frenan las teclas sueltas: un comando reasignado a una
 * tecla sin modificador no debe dispararse mientras el usuario escribe, pero
 * los atajos normales (cmd/ctrl/alt + tecla) sí tienen que funcionar desde
 * adentro de la terminal.
 */
export function isTypingInTerminalInput(e: KeyboardEvent): boolean {
  const el = document.activeElement
  if (!(el instanceof HTMLElement) || !el.hasAttribute('data-vterm-input')) return false
  return !e.metaKey && !e.ctrlKey && !e.altKey
}

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
    if (skipWhenTyping && isTypingInTerminalInput(e)) return false

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