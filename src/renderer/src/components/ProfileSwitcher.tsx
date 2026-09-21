import { useEffect, useState } from 'react'

export interface ProfileInfo {
  id: string
  name: string
  description: string
}

interface ProfileSwitcherProps {
  currentId: string
  onSelect: (id: string) => void
  onClose: () => void
}

export function ProfileSwitcher({ currentId, onSelect, onClose }: ProfileSwitcherProps): JSX.Element {
  const [profiles, setProfiles] = useState<ProfileInfo[]>([])

  useEffect(() => {
    let active = true
    window.terminalAPI.listProfiles().then((list) => {
      if (active) setProfiles(list)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="theme-switcher__overlay" onClick={onClose}>
      <div className="theme-switcher" onClick={(e) => e.stopPropagation()}>
        <h3>Elegí el shell por defecto</h3>
        <p className="profile-switcher__hint">Se aplica a las pestañas nuevas.</p>
        <div className="profile-switcher__list">
          {profiles.map((p) => (
            <button
              key={p.id}
              className={`profile-item ${p.id === currentId ? 'profile-item--active' : ''}`}
              onClick={() => {
                onSelect(p.id)
                onClose()
              }}
            >
              <span className="profile-item__name">{p.name}</span>
              <span className="profile-item__desc">{p.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}