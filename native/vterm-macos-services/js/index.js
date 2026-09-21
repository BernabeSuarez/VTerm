const path = require('path')

// El binario se compila para el ABI de Electron con @electron/rebuild.
const candidates = [path.join(__dirname, '..', 'build', 'Release', 'vterm_macos_services.node')]

let binding = null
for (const file of candidates) {
  try {
    binding = require(file)
    break
  } catch {
    // probar el siguiente candidato
  }
}

const isMac = process.platform === 'darwin'

module.exports = {
  isSupported: isMac && Boolean(binding),
  registerProvider(callback) {
    if (!isMac || !binding) return false
    binding.registerProvider(callback)
    return true
  }
}