import { useEffect, useRef, useState } from 'react'
import { Search, Command, X } from 'lucide-react'

interface CommandItem {
  id: string
  label: string
  description: string
  action: () => void
  category: string
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  commands: CommandItem[]
}

export function CommandPalette({ open, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      setQuery('')
    }
  }, [open])

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  )

  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action()
        onClose()
      }
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 pointer-events-none"
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-ui-surface border border-ui-border w-full max-w-2xl rounded-xl shadow-2xl pointer-events-auto overflow-hidden animate-in zoom-in-95 fade-in duration-150"
        onMouseDown={(e) => e.preventDefault()}
      >
        <div className="flex items-center px-4 py-3 border-b border-ui-border gap-3">
          <Command size={18} className="text-ui-muted" />
          <input
            ref={inputRef}
            className="bg-transparent border-none outline-none text-ui-text w-full placeholder-ui-muted"
            placeholder="Ejecutar comando..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button onClick={onClose} className="p-1 hover:bg-ui-background rounded text-ui-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length > 0 ? (
            <div className="flex flex-col gap-1">
              {filteredCommands.map((cmd, idx) => (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action()
                    onClose()
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedIndex === idx
                      ? 'bg-ui-background text-ui-text'
                      : 'text-ui-muted hover:bg-ui-background hover:text-ui-text'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{cmd.label}</span>
                    <span className="text-xs opacity-60">{cmd.description}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-ui-background text-ui-muted border border-ui-border">
                    {cmd.category}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-ui-muted text-sm">
              No se encontraron comandos que coincidan con "{query}"
            </div>
          )}
        </div>
      </div>
      <div className="fixed inset-0 -z-10 pointer-events-auto" onClick={onClose} />
    </div>
  )
}
