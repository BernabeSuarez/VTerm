import { accessSync, constants, realpathSync, statSync } from 'fs'
import { fileURLToPath } from 'url'
import { vtermLog } from './log'

// --- Resolución y validación de carpetas recibidas del sistema operativo ---

// Normaliza un valor recibido del SO (ruta directa o URI file://) y lo valida:
// debe existir, ser un directorio y ser accesible. Devuelve la ruta canónica
// (los enlaces simbólicos se resuelven) o `undefined` si no es una carpeta útil.
// Se usa antes de abrir cualquier terminal para no confiar en argumentos
// arbitrarios del lanzador.
export function validateDirectory(raw: string): string | undefined {
  if (!raw || typeof raw !== 'string' || raw.length === 0) return undefined

  let candidate = raw
  if (raw.startsWith('file://')) {
    try {
      // fileURLToPath decodifica percent-encoding y caracteres Unicode.
      candidate = fileURLToPath(raw)
    } catch {
      vtermLog.warn('URI file:// inválida ignorada:', raw)
      return undefined
    }
  }
  if (!candidate || candidate.startsWith('-') || candidate === process.execPath) return undefined

  try {
    // Verifica existencia y accesibilidad a lo largo de toda la ruta.
    const real = realpathSync(candidate)
    const stat = statSync(real)
    if (!stat.isDirectory()) return undefined
    accessSync(real, constants.R_OK)
    return real
  } catch {
    // ruta inexistente, inaccesible o no es un directorio; se descarta.
    return undefined
  }
}

// Extrae la primera carpeta válida de la línea de argumentos con la que se
// lanzó la app. Soporta rutas directas y URIs file:// (argumento de algunos
// gestores de archivos en Windows/Linux). Se usa al arrancar y en
// `second-instance` para reenrutar la carpeta a la instancia ya abierta.
export function getDirectoryFromLaunchArguments(argv: string[]): string | undefined {
  for (const raw of argv) {
    if (!raw || raw.startsWith('-')) continue
    const resolved = validateDirectory(raw)
    if (resolved) {
      vtermLog.debug('[context-menu] received path:', raw)
      vtermLog.debug('[context-menu] validated directory:', resolved)
      return resolved
    }
  }
  return undefined
}