import { useConfig } from '../ConfigContext'
import { effectiveKeymaps, detectPlatform, formatAccelerator, type PlatformName } from '../keymaps'
import { SHORTCUTS_GROUPS } from '../shortcuts'

export function ShortcutsSwitcher({ onClose }: { onClose: () => void }): JSX.Element {
  const { config } = useConfig()
  const platform = detectPlatform() as PlatformName
  const keymaps = effectiveKeymaps(platform, config.keymaps)

  return (
    <div className="theme-switcher__overlay" onClick={onClose}>
      <div className="theme-switcher shortcuts-list" onClick={(e) => e.stopPropagation()}>
        <h3>Atajos de teclado</h3>
        {SHORTCUTS_GROUPS.map((group) => (
          <div key={group.id} className="shortcuts-group">
            <h4>{group.label}</h4>
            {group.commands.map((cmd) => {
              const acc = keymaps[cmd.id]
              const display = acc ? formatAccelerator(acc, platform) : ''
              return (
                <div key={cmd.id} className="shortcut-row">
                  <span className="shortcut-row__name">{cmd.label}</span>
                  <span className="shortcut-row__keys">{display || '—'}</span>
                </div>
              )
            })}
          </div>
        ))}
        <p className="shortcuts-list__hint">
          Presioná <kbd>esc</kbd> para cerrar. Podés reasignar cualquier atajo en la config (comando{" "}
          <code>keymaps</code>) o desactivarlo con <code>""</code>.
        </p>
      </div>
    </div>
  )
}