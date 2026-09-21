import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { useTheme } from "../ThemeContext";
// El bundler procesa la hoja de estilos como un efecto secundario.
import "@xterm/xterm/css/xterm.css";

interface TerminalPaneProps {
  /** id único de esta pestaña/sesión, usado para el canal IPC */
  id: string;
  /** si esta pestaña está visible; controla el resize al volver a mostrarla */
  active: boolean;
  /** si hay más de un panel (permite cerrar este) */
  closable: boolean;
  /** directorio de trabajo inicial de la sesión (para "Abrir en VTerm") */
  terminalCwd?: string;
  onSplit: (paneId: string, direction: "horizontal" | "vertical") => void;
  onClose: (paneId: string) => void;
}

export function TerminalPane({
  id,
  active,
  closable,
  terminalCwd,
  onSplit,
  onClose,
}: TerminalPaneProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const onSplitRef = useRef(onSplit);
  const onCloseRef = useRef(onClose);
  onSplitRef.current = onSplit;
  onCloseRef.current = onClose;
  const { theme } = useTheme();

  // Crear la instancia de xterm.js y el proceso pty asociado (una sola vez)
  useEffect(() => {
    if (!containerRef.current) return;

    const xterm = new XTerm({
      fontFamily: 'Cascadia Code, Menlo, Consolas, "SF Mono", monospace',
      fontWeight: 400,
      fontWeightBold: 700,
      fontSize: 14,
      cursorBlink: true,
      allowProposedApi: true,
      theme: theme.terminal,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(new WebLinksAddon());

    xterm.open(containerRef.current);

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

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

    window.terminalAPI.spawn(id, xterm.cols, xterm.rows, terminalCwd);
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

    const isMac = /mac/i.test(navigator.platform || "");
    const handleCustomKey = (event: KeyboardEvent): boolean => {
      if (event.type !== "keydown") return true;
      const modifier = isMac ? event.metaKey : event.ctrlKey;
      const key = event.key.toLowerCase();
      if (modifier && event.shiftKey && key === "d") {
        onSplitRef.current(id, "horizontal");
        return false;
      }
      if (modifier && event.shiftKey && key === "e") {
        onSplitRef.current(id, "vertical");
        return false;
      }
      return true;
    };
    xterm.attachCustomKeyEventHandler(handleCustomKey);

    xterm.focus();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      unsubscribeData();
      unsubscribeExit();
      disposableInput.dispose();
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      xterm.dispose();
    };
    // Solo se recrea si cambia el id de la pestaña.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Aplicar el tema en caliente sin recrear la sesión
  useEffect(() => {
    if (xtermRef.current) xtermRef.current.options.theme = theme.terminal;
  }, [theme]);

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
      <div className="pane-toolbar">
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
