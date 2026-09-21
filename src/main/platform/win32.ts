// --- Integración con Windows (Explorer: "Abrir en VTerm") ---
// El instalador NSIS (`build/installer.nsh`) ya registra las entradas de menú
// contextual y lanza la app con la carpeta como argumento. El flujo funciona
// con el mecanismo genérico: `second-instance` reenvía la carpeta a la
// instancia ya abierta vía `getDirectoryFromLaunchArguments` y `openTerminalAt`,
// así que aquí solo se deja el punto de extensión por si en el futuro hacen
// falta acciones específicas de Explorer.

export function installWindowsIntegration(_openTerminalAt: (directory: string) => void): void {
  if (process.platform !== 'win32') return
}