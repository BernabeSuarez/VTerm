import { useEffect, useRef, useState } from 'react'
import { ConfigProvider, useConfig } from './ConfigContext'
import { PaneTree } from './components/PaneTree'
import { TabBar } from './components/TabBar'
import { ThemeSwitcher } from './components/ThemeSwitcher'
import { ProfileSwitcher } from './components/ProfileSwitcher'
import { ShortcutsSwitcher } from './components/ShortcutsSwitcher'
import { makeKeyHandler } from './commands'
import {
  createRootPane,
  collectPaneIds,
  countPanes,
  removePane,
  splitNode,
  type TreeNode
} from './paneTree'

interface Tab {
  id: string
  title: string
  root: TreeNode
  cwd?: string
  profileId: string
}

function createTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function folderLabel(cwd?: string): string {
  if (!cwd) return 'Terminal'
  const base = cwd.split(/[/\\]/).filter(Boolean).pop()
  return base || cwd
}

function AppContent(): JSX.Element {
  const { config, loaded, setDefaultProfile } = useConfig()
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showThemes, setShowThemes] = useState(false)
  const [showProfiles, setShowProfiles] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const tabsRef = useRef(tabs)
  tabsRef.current = tabs
  const configRef = useRef(config)
  configRef.current = config
  const activeIdRef = useRef<string | null>(null)
  const closeModalsRef = useRef<() => void>(() => {})
  closeModalsRef.current = () => {
    setShowThemes(false)
    setShowProfiles(false)
    setShowShortcuts(false)
  }
  const modalsOpenRef = useRef(false)

  function createTab(cwd?: string): Tab {
    const title = cwd ? folderLabel(cwd) : `Terminal ${tabsRef.current.length + 1}`
    return { id: createTabId(), title, root: createRootPane(), cwd, profileId: configRef.current.defaultProfile }
  }

  // La primera pestaña se crea recién cuando la config está cargada, para que
  // herede el tema, la fuente y el perfil guardados.
  useEffect(() => {
    if (!loaded || tabsRef.current.length > 0) return
    const tab = createTab()
    setTabs([tab])
    setActiveId(tab.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  useEffect(() => {
    const unsubscribe = window.terminalAPI.onOpenFolder((paths) => {
      const queue = paths.map((p) => createTab(p))
      setTabs((prev) => [...prev, ...queue])
      if (queue.length > 0) setActiveId(queue[queue.length - 1].id)
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentActive = activeId ?? tabs[0]?.id
  activeIdRef.current = currentActive

  // --- Atajos de teclado globales (comandos de tipo tab: y view:) ---
  // Los comandos de panel y de terminal (pane:, editor:, zoom:) los maneja
  // cada TerminalPane al estar enfocado. Acá se resuelven solo los que
  // involucran a la app entera. La captura en fase de captura garantiza que
  // la combinación no llegue al pty (xterm.js la procesa después).
  const tabActionsRef = useRef((): Record<string, () => void> => ({}))
  tabActionsRef.current = () => ({
    'tab:new': () => {
      const tab = createTab()
      setTabs((prev) => [...prev, tab])
      setActiveId(tab.id)
    },
    'tab:close': () => {
      const list = tabsRef.current
      if (list.length <= 1) return
      const id = activeIdRef.current ?? list[0].id
      const tab = list.find((t) => t.id === id)
      const next = list.filter((t) => t.id !== id)
      setTabs(next)
      if (tab) collectPaneIds(tab.root).forEach((pid) => window.terminalAPI.kill(pid))
      setActiveId(next[next.length - 1].id)
    },
    'tab:prev': () => cycleTab(-1),
    'tab:next': () => cycleTab(1),
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

  const keyHandlerRef = useRef<(e: KeyboardEvent) => boolean>(() => false)
  useEffect(() => {
    keyHandlerRef.current = makeKeyHandler(configRef.current.keymaps, () => tabActionsRef.current(), true)
  }, [config.keymaps])

  useEffect(() => {
    modalsOpenRef.current = showThemes || showProfiles || showShortcuts
  }, [showThemes, showProfiles, showShortcuts])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if ((e.target as HTMLElement)?.hasAttribute?.('data-vterm-input')) return
      if (modalsOpenRef.current && e.key === 'Escape') {
        closeModalsRef.current()
        e.preventDefault()
        e.stopPropagation()
        return
      }
      if (keyHandlerRef.current(e)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])

  function cycleTab(delta: number): void {
    const list = tabsRef.current
    if (list.length === 0) return
    const idx = Math.max(0, list.findIndex((t) => t.id === activeIdRef.current))
    const next = list[(idx + delta + list.length) % list.length]
    setActiveId(next.id)
  }

  function tabJumpHandlers(): Record<string, () => void> {
    const handlers: Record<string, () => void> = {}
    for (let i = 1; i <= 8; i++) {
      handlers[`tab:jump:${i}`] = () => {
        const target = tabsRef.current[i - 1]
        if (target) setActiveId(target.id)
      }
    }
    handlers['tab:jump:last'] = () => {
      const list = tabsRef.current
      const target = list[list.length - 1]
      if (target) setActiveId(target.id)
    }
    return handlers
  }

  if (!loaded || tabs.length === 0) return <div className="app" />

  const mutateTabRoot = (tabId: string, transform: (root: TreeNode) => TreeNode | null): void => {
    const prev = tabsRef.current
    const tab = prev.find((t) => t.id === tabId)
    if (!tab) return
    const oldIds = collectPaneIds(tab.root)
    const nextRoot = transform(tab.root)
    if (!nextRoot) return
    const nextTabs = prev.map((t) => (t.id === tabId ? { ...t, root: nextRoot } : t))
    setTabs(nextTabs)
    const newIds = collectPaneIds(nextRoot)
    oldIds.filter((id) => !newIds.includes(id)).forEach((id) => window.terminalAPI.kill(id))
  }

  const findTabWithPane = (paneId: string): Tab | undefined =>
    tabsRef.current.find((t) => collectPaneIds(t.root).includes(paneId))

  const handleSplit = (paneId: string, direction: 'horizontal' | 'vertical'): void => {
    const tab = findTabWithPane(paneId)
    if (!tab) return
    mutateTabRoot(tab.id, (root) => splitNode(root, paneId, direction))
  }

  const handleClosePane = (paneId: string): void => {
    const tab = findTabWithPane(paneId)
    if (!tab) return
    mutateTabRoot(tab.id, (root) => {
      const next = removePane(root, paneId)
      return next ? next : root
    })
  }

  const addTab = (): void => {
    const tab = createTab()
    setTabs((prev) => [...prev, tab])
    setActiveId(tab.id)
  }

  const closeTab = (id: string): void => {
    const prev = tabsRef.current
    if (prev.length <= 1) return
    const tab = prev.find((t) => t.id === id)
    const next = prev.filter((t) => t.id !== id)
    setTabs(next)
    if (tab) collectPaneIds(tab.root).forEach((pid) => window.terminalAPI.kill(pid))
    if (id === currentActive) setActiveId(next[next.length - 1].id)
  }

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
            style={{ display: tab.id === currentActive ? 'block' : 'none', width: '100%', height: '100%' }}
          >
            <PaneTree
              root={tab.root}
              tabActive={tab.id === currentActive}
              anyClosable={countPanes(tab.root) > 1}
              cwd={tab.cwd}
              profileId={tab.profileId}
              onSplit={handleSplit}
              onClose={handleClosePane}
            />
          </div>
        ))}
      </div>
      {showThemes && <ThemeSwitcher onClose={() => setShowThemes(false)} />}
      {showProfiles && <ProfileSwitcher currentId={config.defaultProfile} onSelect={setDefaultProfile} onClose={() => setShowProfiles(false)} />}
      {showShortcuts && <ShortcutsSwitcher onClose={() => setShowShortcuts(false)} />}
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