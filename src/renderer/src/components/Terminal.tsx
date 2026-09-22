import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { WebglAddon } from "@xterm/addon-webgl";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { useConfig } from "../ConfigContext";
import { makeKeyHandler } from "../commands";
import { SearchBar } from "./SearchBar";
// El bundler procesa la hoja de estilos como un efecto secundario.
import "@xterm/xterm/css/xterm.css";

interface SearchResults {
  current: number;
  total: number;
}

interface TerminalPaneProps {
  /** id único de esta pestaña/sesión, usado para el canal IPC */
  id: string;
  /** si esta pestaña está visible; controla el resize al volver a mostrarla */
  active: boolean;
  /** si hay más de un panel (permite cerrar este) */
  closable: boolean;
  /** directorio de trabajo inicial de la sesión (para "Abrir en VTerm") */
  terminalCwd?: string;
  /** id del perfil de shell a usar para esta sesión */
  terminalProfile?: string;
  onSplit: (paneId: string, direction: "horizontal" | "vertical") => void;
  onClose: (paneId: string) => void;
}

export function TerminalPane({
  id,
  active,
  closable,
  terminalCwd,
  terminalProfile,
  onSplit,
  onClose,
}: TerminalPaneProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const onSplitRef = useRef(onSplit);
  const onCloseRef = useRef(onClose);
  onSplitRef.current = onSplit;
  onCloseRef.current = onClose;
  const { theme, config, updateFont } = useConfig();

  const configRef = useRef(config);
  configRef.current = config;
  const closableRef = useRef(closable);
  closableRef.current = closable;
  const queryRef = useRef("");
  const caseSensitiveRef = useRef(false);
  const searchOpenRef = useRef(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);

  queryRef.current = query;
  caseSensitiveRef.current = caseSensitive;
  searchOpenRef.current = searchOpen;

  const openSearch = (): void => {
    searchAddonRef.current?.clearDecorations();
    setQuery("");
    setSearchResults(null);
    setSearchOpen(true);
  };

  const closeSearch = (): void => {
    setSearchOpen(false);
    setQuery("");
    setSearchResults(null);
    searchAddonRef.current?.clearDecorations();
    xtermRef.current?.focus();
  };

  const runSearch = (text: string, direction: "next" | "prev"): void => {
    const addon = searchAddonRef.current;
    if (!addon) return;
    if (!text) {
      addon.clearDecorations();
      setSearchResults(null);
      return;
    }
    const options = {
      caseSensitive: caseSensitiveRef.current,
      decorations: {
        matchOverviewRuler: theme.terminal.selectionBackground as string,
        activeMatchBackground: theme.terminal.cursor as string,
        activeMatchColorOverviewRuler: theme.terminal.cursor as string
      }
    };
    try {
      if (direction === "prev") addon.findPrevious(text, options);
      else addon.findNext(text, options);
    } catch {
      // Si el renderer no soporta decorations, se reintenta sin ellas.
      try {
        if (direction === "prev") addon.findPrevious(text);
        else addon.findNext(text);
      } catch {
        // sin match decorado: no-op
      }
    }
  };

  const searchNext = (): void => runSearch(queryRef.current, "next");
  const searchPrev = (): void => runSearch(queryRef.current, "prev");

  const handleQueryChange = (value: string): void => {
    setQuery(value);
    runSearch(value, "next");
  };

  const toggleCaseSensitive = (): void => {
    const next = !caseSensitiveRef.current;
    caseSensitiveRef.current = next;
    setCaseSensitive(next);
    runSearch(queryRef.current, "next");
  };

  const updateFontSize = (delta: number): void => {
    const size = configRef.current.font.size;
    const next = delta === 0 ? 14 : Math.max(8, Math.min(28, size + delta));
    updateFont({ size: next });
  };

  // Keymaps de este panel: los comandos que involucran a una terminal concreta
  // (pane:, editor:, zoom:) se resuelven acá, en el panel enfocado.
  const keyHandlerRef = useRef<(e: KeyboardEvent) => boolean>(() => false);
  useEffect(() => {
    keyHandlerRef.current = makeKeyHandler(configRef.current.keymaps, {
      "pane:splitRight": () => onSplitRef.current(id, "horizontal"),
      "pane:splitDown": () => onSplitRef.current(id, "vertical"),
      "pane:close": () => {
        if (closableRef.current) onCloseRef.current(id);
      },
      "editor:search": () => {
        if (searchOpenRef.current) closeSearch();
        else openSearch();
      },
      "editor:clearBuffer": () => xtermRef.current?.clear(),
      "zoom:in": () => updateFontSize(1),
      "zoom:out": () => updateFontSize(-1),
      "zoom:reset": () => updateFontSize(0)
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.keymaps, closable]);

  // Crear la instancia de xterm.js y el proceso pty asociado (una sola vez)
  useEffect(() => {
    if (!containerRef.current) return;

    const xterm = new XTerm({
      fontFamily: config.font.family,
      fontWeight: config.font.weight,
      fontWeightBold: config.font.weightBold,
      fontSize: config.font.size,
      cursorBlink: config.font.cursorBlink,
      allowProposedApi: true,
      theme: theme.terminal,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(new WebLinksAddon());

    const searchAddon = new SearchAddon();
    xterm.loadAddon(searchAddon);
    searchAddonRef.current = searchAddon;

    xterm.open(containerRef.current);

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Atajos: se resuelven contra los keymaps efectivos del panel. Si un
    // atajo coincide, se traga la tecla para que no llegue al pty.
    xterm.attachCustomKeyEventHandler((e) => {
      if (keyHandlerRef.current(e)) return false;
      if (searchOpenRef.current && e.key === "Escape") {
        closeSearch();
        return false;
      }
      return true;
    });

    // Registro de IPC: se hace de forma síncrona, sin depender del renderer.
    const unsubscribeData = window.terminalAPI.onData(id, (data) =>
      xterm.write(data),
    );
    const unsubscribeExit = window.terminalAPI.onExit(id, () =>
      xterm.write("\r\n[proceso finalizado]\r\n"),
    );

    const disposableInput = xterm.onData((data) =>
      window.terminalAPI.write(id, data),
    );
    const disposableResults = searchAddon.onDidChangeResults(
      ({ resultIndex, resultCount }) => {
        setSearchResults({ current: resultIndex, total: resultCount });
      },
    );

    window.terminalAPI.spawn(id, xterm.cols, xterm.rows, terminalCwd, terminalProfile);
    window.terminalAPI.resize(id, xterm.cols, xterm.rows);

    let disposed = false;

    const tryFit = (): boolean => {
      const container = containerRef.current;
      if (
        !container ||
        container.clientWidth === 0 ||
        container.clientHeight === 0
      )
        return false;
      try {
        fitAddon.fit();
        return true;
      } catch {
        return false;
      }
    };

    // El fit y el renderer WebGL se difieren a un frame posterior: si se ejecutan
    // con dimensiones 0, el renderer de xterm.js se rompe de forma permanente.
    const frame = window.requestAnimationFrame(() => {
      if (disposed) return;
      if (tryFit()) {
        window.terminalAPI.resize(id, xterm.cols, xterm.rows);
        try {
          xterm.loadAddon(new WebglAddon());
        } catch {
          // Si WebGL no está disponible, xterm.js cae de vuelta al renderizado por canvas.
        }
      }
    });

    const handleResize = (): void => {
      if (tryFit()) window.terminalAPI.resize(id, xterm.cols, xterm.rows);
    };
    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    xterm.focus();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      unsubscribeData();
      unsubscribeExit();
      disposableInput.dispose();
      disposableResults.dispose();
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      searchAddonRef.current = null;
      xterm.dispose();
    };
    // Solo se recrea si cambia el id de la pestaña.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Aplicar el tema en caliente sin recrear la sesión
  useEffect(() => {
    if (xtermRef.current) xtermRef.current.options.theme = theme.terminal;
  }, [theme]);

  // Aplicar cambios de fuente (familia, tamaño) en caliente y re-ajustar
  useEffect(() => {
    const xterm = xtermRef.current;
    if (!xterm) return;
    xterm.options.fontFamily = config.font.family;
    xterm.options.fontSize = config.font.size;
    xterm.options.fontWeight = config.font.weight;
    xterm.options.fontWeightBold = config.font.weightBold;
    xterm.options.cursorBlink = config.font.cursorBlink;
    try {
      fitAddonRef.current?.fit();
    } catch {
      // el contenedor aún no tiene tamaño; el ResizeObserver lo reajustará
    }
  }, [config.font]);

  // Re-ajustar tamaño y recuperar el foco cuando la pestaña vuelve a estar activa
  useEffect(() => {
    if (!active) return;
    const xterm = xtermRef.current;
    const fitAddon = fitAddonRef.current;
    if (!xterm) return;
    try {
      fitAddon?.fit();
    } catch {
      // el contenedor aún no tiene tamaño; el ResizeObserver lo reajustará
    }
    xterm.focus();
  }, [active]);

  return (
    <div
      className="pane-frame "
      style={{
        display: active ? "block" : "none",
        width: "100%",
        height: "100%",
      }}
    >
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", padding: "8px" }}
      />
      {searchOpen && (
        <SearchBar
          open={searchOpen}
          query={query}
          caseSensitive={caseSensitive}
          results={searchResults}
          onQueryChange={handleQueryChange}
          onCaseSensitiveChange={toggleCaseSensitive}
          onNext={searchNext}
          onPrev={searchPrev}
          onClose={closeSearch}
        />
      )}
      <div className="pane-toolbar">
        <button
          onClick={() => updateFont({ size: Math.min(config.font.size + 1, 28) })}
          title="Aumentar tamaño de letra"
          aria-label="Aumentar tamaño de letra"
        >
          A+
        </button>
        <button
          onClick={() => updateFont({ size: Math.max(config.font.size - 1, 8) })}
          title="Disminuir tamaño de letra"
          aria-label="Disminuir tamaño de letra"
        >
          A−
        </button>
        <button
          onClick={() => onSplit(id, "horizontal")}
          title="Dividir a la derecha (Cmd/Ctrl+Shift+D)"
          aria-label="Dividir a la derecha"
        >
          ⬌
        </button>
        <button
          onClick={() => onSplit(id, "vertical")}
          title="Dividir abajo (Cmd/Ctrl+Shift+E)"
          aria-label="Dividir abajo"
        >
          ⬍
        </button>
        {closable && (
          <button
            className="pane-toolbar__close"
            onClick={() => onClose(id)}
            title="Cerrar panel"
            aria-label="Cerrar panel"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}