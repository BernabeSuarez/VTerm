# Terminal App

Terminal multiplataforma (macOS, Windows, Linux) construida con Electron, React, TypeScript y [xterm.js](https://xtermjs.org/), con temas personalizables.

## Setup

```bash
npm install
npm run dev
```

Esto levanta Electron en modo desarrollo con hot-reload en el renderer.

## Build

```bash
npm run build:mac    # o build:win / build:linux
```

Los instaladores quedan en `dist/`.

## Cómo funciona

- **`src/main/index.ts`** — proceso principal. Crea la ventana y gestiona los procesos `node-pty` (uno por pestaña), pasando su output al renderer vía IPC.
- **`src/preload/index.ts`** — puente seguro entre el proceso principal y el renderer (`contextBridge`), expone `window.terminalAPI`.
- **`src/renderer/src/components/Terminal.tsx`** — instancia xterm.js, lo conecta al pty correspondiente y aplica el tema activo.
- **`src/renderer/src/themes/index.ts`** — catálogo de temas (colores de xterm.js + colores del chrome de la UI).
- **`src/renderer/src/ThemeContext.tsx`** — estado global del tema activo, persistido en `localStorage`.

## Agregar un tema nuevo

Sumá un objeto al array `themes` en `src/renderer/src/themes/index.ts` con:
- `terminal`: los 16 colores ANSI + fondo/texto/cursor (formato `ITheme` de xterm.js)
- `ui`: los colores del chrome (tabs, bordes, fondo de la ventana)

Aparece automáticamente en el selector de temas (🎨).

## Integración con el sistema operativo

Al instalar la app aparece una opción en el menú contextual de las carpetas:

- **macOS (Finder):** "Abrir en VTerm" (clic derecho sobre una carpeta).
- **Windows (Explorer):** "Abrir en VTerm" (registrada por `build/installer.nsh` al instalar).
- **Linux (GNOME Files/Nautilus):** "Abrir en VTerm" (registrada al primer arranque por `src/main/linux-integration.ts`).

El flujo es siempre el mismo: el SO entrega una ruta al proceso `main`, este la valida y llama a `openTerminalAt(directory)`, que encola la carpeta y la envía al renderer vía IPC (`app:open-folder`); el renderer crea una pestaña nueva con esa carpeta como `cwd`. Si la app está cerrada, la ruta queda en cola hasta que la ventana termina de cargar. Si ya está abierta, `requestSingleInstanceLock` evita una segunda instancia y la carpeta se abre como pestaña nueva sin tocar las terminales existentes.

Archivos involucrados:

- `src/main/index.ts` — single-instance lock, `second-instance`, IPC del pty, ventana.
- `src/main/directories.ts` — extracción y validación de la carpeta recibida (`validateDirectory`, `getDirectoryFromLaunchArguments`).
- `src/main/terminal-open.ts` — punto de entrada único `openTerminalAt(directory)` y cola de pendientes.
- `src/main/platform/darwin.ts` — servicio nativo de macOS (addon `@vterm/macos-services` + `open-file`).
- `src/main/platform/win32.ts` — punto de extensión para Windows (por ahora no hace nada en tiempo de ejecución).
- `src/main/linux-integration.ts` — registro de menú contextual en Linux.
- `native/vterm-macos-services/` — addon N-API que registra VTerm como proveedor de `NSServices` (macOS).
- `src/preload/index.ts` y `src/renderer/src/App.tsx` — puente IPC y creación de pestañas.

Para probar con la app empaquetada:

```bash
npm run build:mac
open -a dist/mac/VTerm.app "/ruta/a/una carpeta"   # o desde Finder: clic derecho → Abrir en VTerm
```

La integración de Finder usa el mecanismo nativo `NSServices` (declarado en `electron-builder.yml` → `mac.extendInfo`), así que requiere la app instalada/empaquetada para aparecer en el menú.

## Roadmap sugerido

- [ ] Atajos de teclado (Cmd/Ctrl+T nueva pestaña, Cmd/Ctrl+W cerrar, Cmd/Ctrl+1..9 saltar a pestaña)
- [ ] Splits (dividir el panel horizontal/verticalmente)
- [ ] Perfiles de shell configurables (bash, zsh, fish, PowerShell, WSL)
- [ ] Buscar dentro del scrollback (`xterm-addon-search` ya está instalado)
- [ ] Persistir configuración (fuente, tamaño, tema) en un archivo de config en vez de solo `localStorage`
- [ ] Auto-actualización (`electron-updater`)

## Notas de rendimiento

- Se usa `xterm-addon-webgl` para renderizado acelerado por GPU; si no está disponible cae a canvas 2D automáticamente.
- Cada pestaña destruye su proceso pty y su instancia de xterm.js al cerrarse, para no acumular procesos zombis.
