// Recompila el addon nativo @vterm/macos-services para el ABI de Electron.
// En Windows/Linux no aplica, así que se omite.
import { execSync } from 'node:child_process'
import process from 'node:process'

if (process.platform !== 'darwin') process.exit(0)

const version = process.env.npm_config_electron_version || ''
const extraArgs = version ? ` --version ${version}` : ''

try {
  execSync(`npx electron-rebuild -f -w @vterm/macos-services${extraArgs}`, {
    stdio: 'inherit'
  })
} catch (err) {
  console.warn(
    '[vterm] No se pudo recompilar el addon de servicios macOS:',
    String(err.message || err)
  )
  process.exit(0)
}