import { useEffect, useRef, useState } from 'react'
import { ConfigProvider, useConfig } from './ConfigContext'
import { PaneTree } from './components/PaneTree'
import { TabBar } from './components/TabBar'
import { ThemeSwitcher } from './components/ThemeSwitcher'
import { ProfileSwitcher } from './components/ProfileSwitcher'
import { ShortcutsSwitcher } from './components/ShortcutsSwitcher'
import { Notification } from './components/Notification'
import { CommandPalette } from './components/CommandPalette'
import { makeKeyHandler, isTypingInTerminalInput } from './commands'
import { useTerminalManager } from './hooks/useTerminalManager'
import { TerminalService } from './services/TerminalService'
import { countPanes } from './paneTree'

function AppContent(): JSX.Element {
  const { config, loaded, setDefaultProfile } = useConfig()
  const {
    tabs,
    activeId,
    setActiveId,
    addTab,
    closeTab,
    cycleTab,
    handleSplit,
    handleClosePane,
    jumpToTab,
    jumpToLastTab,
    initialize
  } = useTerminalManager(config.defaultProfile)

  const [showThemes, setShowThemes] = useState(false)
  const [showProfiles, setShowProfiles] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [notifications, setNotifications] = useState<{ id: string; type: 'error' | 'info'; message: string }[]>([])

  const configRef = useRef(config)
  configRef.current = config

  const closeModalsRef = useRef<() => void>(() => {})
  closeModalsRef.current = () => {
    setShowThemes(false)
    setShowProfiles(false)
    setShowShortcuts(false)
    setShowPalette(false)
  }
  const modalsOpenRef = useRef(false)

  useEffect(() => {
    const unsubscribe = TerminalService.onNotify((n) => {
      const id = Math.random().toString(36).slice(2, 9)
      setNotifications((prev) => [...prev, { ...n, id }])
      setTimeout(() => {
        setNotifications((prev) => prev.filter((item) => item.id !== id))
      }, 5000)
    })
    return unsubscribe
  }, [])

  // Primera pestaña al cargar config
  useEffect(() => {
    if (!loaded || tabs.length > 0) return
    addTab()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, addTab, tabs.length])

  useEffect(() => {
    const unsubscribe = window.terminalAPI.onOpenFolder((paths) => {
      paths.forEach(p => addTab(p))
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addTab])

  const currentActive = activeId ?? tabs[0]?.id

  // --- Atajos de teclado globales ---
  const tabActionsRef = useRef((): Record<string, () => void> => ({}))
  tabActionsRef.current = () => ({
    'tab:new': () => addTab(),
    'tab:close': () => {
      if (tabs.length <= 1) return
      closeTab(currentActive || tabs[0].id)
    },
    'tab:prev': () => cycleTab(-1),
    'tab:next': () => cycleTab(1),
    'view:palette': () => setShowPalette((v) => !v),
    'view:themes': () => {
      setShowProfiles(false)
      setShowShortcuts(false)
      setShowThemes((v) => !v)
    },
    'view:profiles': () => {
      setShowThemes(false)
      setShowShortcuts(false)
      setShowProfiles((v) => !v)
    },
    'view:shortcuts': () => {
      setShowThemes(false)
      setShowProfiles(false)
      setShowShortcuts((v) => !v)
    },
    ...tabJumpHandlers()
  })

  function tabJumpHandlers(): Record<string, () => void> {
    const handlers: Record<string, () => void> = {}
    for (let i = 1; i <= 8; i++) {
      handlers[`tab:jump:${i}`] = () => jumpToTab(i - 1)
    }
    handlers['tab:jump:last'] = () => jumpToLastTab()
    return handlers
  }

  const keyHandlerRef = useRef<(e: KeyboardEvent) => boolean>(() => false)
  useEffect(() => {
    keyHandlerRef.current = makeKeyHandler(configRef.current.keymaps, () => tabActionsRef.current(), true)
  }, [config.keymaps])

  useEffect(() => {
    modalsOpenRef.current = showThemes || showProfiles || showShortcuts || showPalette
  }, [showThemes, showProfiles, showShortcuts, showPalette])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (modalsOpenRef.current && e.key === 'Escape') {
        closeModalsRef.current()
        e.preventDefault()
        e.stopPropagation()
        return
      }
      if (isTypingInTerminalInput(e)) return
      if (keyHandlerRef.current(e)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])

  if (!loaded || tabs.length === 0) return <div className="app" />

  return (
    <div className="app">
      <TabBar
        tabs={tabs.map(({ id, title }) => ({ id, title }))}
        activeId={currentActive}
        onSelect={setActiveId}
        onClose={closeTab}
        onNew={addTab}
        onOpenThemes={() => setShowThemes(true)}
        onOpenProfiles={() => setShowProfiles(true)}
        onOpenShortcuts={() => setShowShortcuts(true)}
      />
      <div className="app__terminals">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className="tab-workspace"
            style={{
              display: tab.id === currentActive ? 'block' : 'none',
              width: '100%',
              height: '100%',
              visibility: tab.id === currentActive ? 'visible' : 'hidden'
            }}
          >
            {tab.id === currentActive && (
              <PaneTree
                root={tab.root}
                tabActive={tab.id === currentActive}
                anyClosable={countPanes(tab.root) > 1}
                cwd={tab.cwd}
                profileId={tab.profileId}
                onSplit={handleSplit}
                onClose={handleClosePane}
              />
            )}
          </div>
        ))}
      </div>
      {showThemes && <ThemeSwitcher onClose={() => setShowThemes(false)} />}
      {showProfiles && <ProfileSwitcher currentId={config.defaultProfile} onSelect={setDefaultProfile} onClose={() => setShowProfiles(false)} />}
      {showShortcuts && <ShortcutsSwitcher onClose={() => setShowShortcuts(false)} />}
      {showPalette && (
        <CommandPalette
          open={showPalette}
          onClose={() => setShowPalette(false)}
          commands={[
            { id: 'tab-new', label: 'Nueva pestaña', description: 'Abre una nueva instancia de terminal', category: 'TABS', action: () => addTab() },
            { id: 'tab-close', label: 'Cerrar pestaña', description: 'Cierra la pestaña actual', category: 'TABS', action: () => closeTab(currentActive || tabs[0].id) },
            { id: 'view-themes', label: 'Cambiar Tema', description: 'Abre el selector de temas visuales', category: 'VIEW', action: () => setShowThemes(true) },
            { id: 'view-profiles', label: 'Cambiar Perfil', description: 'Cambia el shell predeterminado', category: 'VIEW', action: () => setShowProfiles(true) },
            { id: 'view-shortcuts', label: 'Ver Atajos', description: 'Muestra la lista de comandos de teclado', category: 'VIEW', action: () => setShowShortcuts(true) },
          ]}
        />
      )}
      <Notification
        notifications={notifications}
        onClose={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
      />
    </div>
  )
}

export default function App(): JSX.Element {
  return (
    <ConfigProvider>
      <AppContent />
    </ConfigProvider>
  )
}