# 💻 VTerm

**VTerm** es una terminal moderna, rápida y multiplataforma diseñada para desarrolladores. Construida con **Electron**, **React**, **TypeScript** y **xterm.js**, VTerm combina la potencia de una terminal nativa con la flexibilidad y belleza de una interfaz web moderna.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: macOS](https://img.shields.io/badge/platform-macOS-blue)](https://developer.apple.com/macos/)
[![Platform: Windows](https://img.shields.io/badge/platform-Windows-blue)](https://www.microsoft.com/windows)
[![Platform: Linux](https://img.shields.io/badge/platform-Linux-blue)](https://www.kernel.org/)

---

## ✨ Características Principales

- 🚀 **Rendimiento Superior**: Renderizado acelerado por GPU mediante WebGL para una experiencia fluida.
- 🪟 **Gestión de Paneles Avanzada**: Soporte para divisiones de pantalla (splits) horizontales y verticales, permitiendo organizar múltiples flujos de trabajo en una sola vista.
- ⌨️ **Command Palette**: Acceso rápido a todas las funciones de la aplicación mediante `Ctrl+Shift+P` (similar a VS Code), eliminando la fricción de navegación.
- 🎨 **Personalización Total**: Sistema de temas dinámico que afecta tanto a la terminal (ANSI) como a la interfaz de usuario (Chrome).
- 🐚 **Soporte Multi-Shell**: Detección automática y soporte para Bash, Zsh, Fish, PowerShell y WSL.
- 📂 **Integración Nativa con el SO**: "Abrir en VTerm" integrado directamente en el menú contextual de macOS (Finder), Windows (Explorer) y Linux (Nautilus).
- 🛡️ **Robustez Garantizada**: Manejo defensivo de errores con notificaciones en tiempo real y validación estricta de binarios del sistema.

---

## 🛠️ Stack Tecnológico

- **Core**: [Electron](https://www.electronjs.org/)
- **Frontend**: [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Terminal Engine**: [xterm.js](https://xtermjs.org/)
- **PTY Bridge**: [node-pty](https://github.com/microsoft/node-pty)
- **Build Tool**: [electron-vite](https://electron-vite.org/)

---

## 🚀 Instalación y Desarrollo

### Requisitos previos
- Node.js (LTS recomendado)
- npm o yarn

### Setup rápido
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/vterm.git
cd vterm

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

### Compilación y Empaquetado
VTerm puede generar instaladores nativos para cada plataforma:
```bash
npm run build:mac    # macOS (.dmg, .zip)
npm run build:win    # Windows (.exe)
npm run build:linux  # Linux (.AppImage)
```
Los archivos resultantes se encontrarán en la carpeta `dist/`.

---

## 🏗️ Arquitectura del Proyecto

VTerm sigue un patrón de diseño modular para asegurar la mantenibilidad y el escalado:

- **`src/main/`**: El cerebro de la aplicación. Gestiona el ciclo de vida de los procesos PTY, la configuración persistente y la integración con el sistema operativo.
- **`src/preload/`**: Capa de seguridad que expone una API controlada (`terminalAPI`) al proceso de renderizado.
- **`src/renderer/`**: Interfaz de usuario reactiva.
    - `services/`: Capa de abstracción (`TerminalService`) para comunicación IPC.
    - `hooks/`: Lógica de negocio desacoplada (`useTerminalManager`).
    - `components/`: UI modular y atómica.
- **`src/shared/`**: Definiciones de tipos y configuraciones compartidas entre procesos.

---

## 🤝 Contribuciones

VTerm es un proyecto **Open Source**. Las contribuciones son bienvenidas:

1. Haz un **Fork** del proyecto.
2. Crea una **Branch** para tu mejora (`git checkout -b feature/nueva-funcionalidad`).
3. Haz el **Commit** de tus cambios (`git commit -m 'Añadida funcionalidad X'`).
4. Haz un **Push** a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un **Pull Request**.

---

## 📜 Licencia

Distribuido bajo la Licencia MIT. Consulta `LICENSE` para más detalles.
