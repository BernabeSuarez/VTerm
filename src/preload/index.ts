import { contextBridge, ipcRenderer } from 'electron'

const terminalAPI = {
  spawn: (id: string, cols: number, rows: number, cwd?: string) =>
    ipcRenderer.invoke('pty:spawn', { id, cols, rows, cwd }),

  write: (id: string, data: string) => ipcRenderer.send('pty:write', { id, data }),

  resize: (id: string, cols: number, rows: number) => ipcRenderer.send('pty:resize', { id, cols, rows }),

  kill: (id: string) => ipcRenderer.send('pty:kill', { id }),

  onData: (id: string, callback: (data: string) => void) => {
    const channel = `pty:data:${id}`
    const listener = (_event: Electron.IpcRendererEvent, data: string) => callback(data)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },

  onExit: (id: string, callback: () => void) => {
    const channel = `pty:exit:${id}`
    const listener = () => callback()
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },

  onOpenFolder: (callback: (paths: string[]) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: { paths: string[] }) =>
      callback(payload.paths)
    ipcRenderer.on('app:open-folder', listener)
    return () => ipcRenderer.removeListener('app:open-folder', listener)
  }
}

contextBridge.exposeInMainWorld('terminalAPI', terminalAPI)

export type TerminalAPI = typeof terminalAPI