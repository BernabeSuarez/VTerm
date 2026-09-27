import { useState, useRef, useCallback } from 'react'
import { createRootPane, collectPaneIds, removePane, splitNode, type TreeNode } from '../paneTree'
import { TerminalService } from '../services/TerminalService'

export interface Tab {
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

export function useTerminalManager(defaultProfile: string) {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  const tabsRef = useRef(tabs)
  tabsRef.current = tabs

  const createTab = useCallback((cwd?: string): Tab => {
    const title = cwd ? folderLabel(cwd) : `Terminal ${tabsRef.current.length + 1}`
    return {
      id: createTabId(),
      title,
      root: createRootPane(),
      cwd,
      profileId: defaultProfile
    }
  }, [defaultProfile])

  const addTab = useCallback((cwd?: string) => {
    const tab = createTab(cwd)
    setTabs((prev) => [...prev, tab])
    setActiveId(tab.id)
  }, [createTab])

  const closeTab = useCallback((id: string) => {
    const prev = tabsRef.current
    if (prev.length <= 1) return
    const tab = prev.find((t) => t.id === id)
    const next = prev.filter((t) => t.id !== id)
    setTabs(next)
    if (tab) collectPaneIds(tab.root).forEach((pid) => TerminalService.kill(pid))

    // Si cerramos la activa, pasamos a la última
    setActiveId(next[next.length - 1].id)
  }, [])

  const cycleTab = useCallback((delta: number) => {
    const list = tabsRef.current
    if (list.length === 0) return
    const idx = Math.max(0, list.findIndex((t) => t.id === activeId))
    const next = list[(idx + delta + list.length) % list.length]
    setActiveId(next.id)
  }, [activeId])

  const mutateTabRoot = useCallback((tabId: string, transform: (root: TreeNode) => TreeNode | null): void => {
    const prev = tabsRef.current
    const tab = prev.find((t) => t.id === tabId)
    if (!tab) return
    const oldIds = collectPaneIds(tab.root)
    const nextRoot = transform(tab.root)
    if (!nextRoot) return
    const nextTabs = prev.map((t) => (t.id === tabId ? { ...t, root: nextRoot } : t))
    setTabs(nextTabs)
    const newIds = collectPaneIds(nextRoot)
    oldIds.filter((id) => !newIds.includes(id)).forEach((id) => TerminalService.kill(id))
  }, [])

  const handleSplit = useCallback((paneId: string, direction: 'horizontal' | 'vertical'): void => {
    const tab = tabsRef.current.find((t) => collectPaneIds(t.root).includes(paneId))
    if (!tab) return
    mutateTabRoot(tab.id, (root) => splitNode(root, paneId, direction))
  }, [mutateTabRoot])

  const handleClosePane = useCallback((paneId: string): void => {
    const tab = tabsRef.current.find((t) => collectPaneIds(t.root).includes(paneId))
    if (!tab) return
    mutateTabRoot(tab.id, (root) => {
      const next = removePane(root, paneId)
      return next ? next : root
    })
  }, [mutateTabRoot])

  const jumpToTab = useCallback((index: number) => {
    const target = tabsRef.current[index]
    if (target) setActiveId(target.id)
  }, [])

  const jumpToLastTab = useCallback(() => {
    const list = tabsRef.current
    const target = list[list.length - 1]
    if (target) setActiveId(target.id)
  }, [])

  return {
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
    // Para facilitar la primera carga
    initialize: (initialTabs: Tab[]) => {
      setTabs(initialTabs)
      if (initialTabs.length > 0) setActiveId(initialTabs[0].id)
    }
  }
}
