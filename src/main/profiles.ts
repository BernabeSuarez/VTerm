import { existsSync } from 'fs'
import { join } from 'path'

export interface ShellProfile {
  id: string
  name: string
  description: string
  platforms: NodeJS.Platform[]
  resolve: () => string | null
  args: (shell: string) => string[]
}

export interface ResolvedShell {
  shell: string
  args: string[]
}

export interface ProfileInfo {
  id: string
  name: string
  description: string
}

const isWindows = process.platform === 'win32'

function pathExists(p: string): boolean {
  try {
    return existsSync(p)
  } catch {
    return false
  }
}

function which(bin: string): string | null {
  const sep = isWindows ? ';' : ':'
  const paths = (process.env.PATH || '').split(sep).filter(Boolean)
  for (const dir of paths) {
    const candidate = join(dir, bin)
    if (pathExists(candidate)) return candidate
  }
  return null
}

function firstExisting(...candidates: Array<string | null>): string | null {
  for (const c of candidates) {
    if (c && pathExists(c)) return c
  }
  return null
}

const gitBashCandidates = (): Array<string | null> => [
  'C:\\Program Files\\Git\\bin\\bash.exe',
  'C:\\Program Files\\Git\\usr\\bin\\bash.exe',
  process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Programs\\Git\\bin\\bash.exe') : null,
  which('bash.exe')
]

const profiles: ShellProfile[] = [
  {
    id: 'default',
    name: 'Predeterminado',
    description: 'Detecta el shell del sistema (variable SHELL o powershell.exe en Windows)',
    platforms: ['darwin', 'linux', 'win32'],
    resolve: () => {
      if (isWindows) return 'powershell.exe'
      return process.env.SHELL || '/bin/bash'
    },
    args: () => []
  },
  {
    id: 'bash',
    name: 'Bash',
    description: 'GNU Bash del sistema o Git Bash en Windows',
    platforms: ['darwin', 'linux', 'win32'],
    resolve: () => {
      if (isWindows) return firstExisting(...gitBashCandidates())
      return firstExisting('/bin/bash', '/usr/bin/bash', which('bash'))
    },
    args: () => ['-l']
  },
  {
    id: 'zsh',
    name: 'Zsh',
    description: 'Z shell, el shell por defecto de macOS',
    platforms: ['darwin', 'linux'],
    resolve: () => firstExisting('/bin/zsh', '/usr/bin/zsh', which('zsh')),
    args: () => ['-l']
  },
  {
    id: 'fish',
    name: 'Fish',
    description: 'Friendly Interactive Shell',
    platforms: ['darwin', 'linux'],
    resolve: () => firstExisting('/usr/local/bin/fish', '/opt/homebrew/bin/fish', which('fish')),
    args: () => ['-l']
  },
  {
    id: 'powershell',
    name: 'PowerShell',
    description: 'Windows PowerShell o PowerShell Core (pwsh)',
    platforms: ['darwin', 'linux', 'win32'],
    resolve: () => {
      if (isWindows) return firstExisting(which('powershell.exe'), which('pwsh.exe'))
      return which('pwsh')
    },
    args: (shell) => {
      const base = shell.toLowerCase()
      return base.includes('pwsh') ? [] : ['-NoLogo']
    }
  },
  {
    id: 'wsl',
    name: 'WSL',
    description: 'Subsistema de Windows para Linux (distribución predeterminada)',
    platforms: ['win32'],
    resolve: () => firstExisting('C:\\Windows\\System32\\wsl.exe', which('wsl.exe')),
    args: () => []
  }
]

const defaultProfile = profiles[0]

export function resolveProfile(profileId?: string): ResolvedShell | null {
  const profile = profiles.find((p) => p.id === profileId) ?? defaultProfile
  if (!profile.platforms.includes(process.platform)) return null
  const shell = profile.resolve()
  if (!shell) return null
  return { shell, args: profile.args(shell) }
}

export function listAvailableProfiles(): ProfileInfo[] {
  return profiles
    .filter((p) => p.platforms.includes(process.platform) && p.resolve())
    .map((p) => ({ id: p.id, name: p.name, description: p.description }))
}