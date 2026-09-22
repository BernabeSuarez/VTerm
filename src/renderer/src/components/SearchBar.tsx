import { useEffect, useRef } from "react";

interface SearchBarProps {
  open: boolean;
  query: string;
  caseSensitive: boolean;
  results: { current: number; total: number } | null;
  onQueryChange: (value: string) => void;
  onCaseSensitiveChange: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export function SearchBar({
  open,
  query,
  caseSensitive,
  results,
  onQueryChange,
  onCaseSensitiveChange,
  onNext,
  onPrev,
  onClose,
}: SearchBarProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  // Foco + selección del texto previo apenas se abre.
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [open]);

  const countLabel = (): string => {
    if (!results || results.total === 0) return query ? "0" : "";
    return `${results.current + 1}/${results.total}`;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) onPrev();
      else onNext();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  return (
    <div className="search-bar" role="search">
      <input
        ref={inputRef}
        data-vterm-input=""
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Buscar…"
        spellCheck={false}
        aria-label="Buscar en terminal"
      />
      <span className="search-bar__count">{countLabel()}</span>
      <button
        onClick={onPrev}
        title="Anterior (Shift+Enter)"
        aria-label="Anterior"
      >
        ‹
      </button>
      <button
        onClick={onNext}
        title="Siguiente (Enter)"
        aria-label="Siguiente"
      >
        ›
      </button>
      <button
        className={caseSensitive ? "search-bar__toggle--on" : ""}
        onClick={onCaseSensitiveChange}
        title="Distinguir mayúsculas"
        aria-label="Distinguir mayúsculas"
        aria-pressed={caseSensitive}
      >
        Aa
      </button>
      <button onClick={onClose} title="Cerrar (Esc)" aria-label="Cerrar búsqueda">
        ✕
      </button>
    </div>
  );
}