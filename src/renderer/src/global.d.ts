declare module '*.png' {
  const src: string
  export default src
}

declare module '*.css' {
  const src: string
  export default src
}

interface Window {
  terminalAPI: {
    spawn: (id: string, cols: number, rows: number, cwd?: string) => Promise<{ pid: number }>
    write: (id: string, data: string) => void
    resize: (id: string, cols: number, rows: number) => void
    kill: (id: string) => void
    onData: (id: string, callback: (data: string) => void) => () => void
    onExit: (id: string, callback: () => void) => () => void
    onOpenFolder: (callback: (paths: string[]) => void) => () => void
  }
}