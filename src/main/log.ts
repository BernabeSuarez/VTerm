import { app } from 'electron'

// Log del proceso principal. En desarrollo se registra el detalle por área
// (context-menu, terminal); en producción se limitan los logs a lo esencial.
const isDev = !app.isPackaged

function dev(...args: unknown[]): void {
  if (isDev) console.log('[vterm]', ...args)
}

export const vtermLog = {
  // Detalle de la integración con el sistema operativo: rutas recibidas,
  // carpetas validadas, reenvío entre instancias. Solo en desarrollo.
  debug: dev,
  // Eventos relevantes (apertura de terminal). Solo en desarrollo.
  info: dev,
  // Problemas que conviene conocer incluso en producción.
  warn: (...args: unknown[]): void => console.warn('[vterm]', ...args),
  error: (...args: unknown[]): void => console.error('[vterm]', ...args)
}