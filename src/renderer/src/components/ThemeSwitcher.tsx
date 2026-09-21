import { useTheme } from '../ThemeContext'

export function ThemeSwitcher({ onClose }: { onClose: () => void }): JSX.Element {
  const { theme, setThemeById, allThemes } = useTheme()

  return (
    <div className="theme-switcher__overlay" onClick={onClose}>
      <div className="theme-switcher" onClick={(e) => e.stopPropagation()}>
        <h3>Elegí un tema</h3>
        <div className="theme-switcher__grid">
          {allThemes.map((t) => (
            <button
              key={t.id}
              className={`theme-swatch ${t.id === theme.id ? 'theme-swatch--active' : ''}`}
              style={{ background: t.terminal.background as string, color: t.terminal.foreground as string }}
              onClick={() => {
                setThemeById(t.id)
                onClose()
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
