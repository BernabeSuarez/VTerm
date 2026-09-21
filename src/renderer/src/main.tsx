import ReactDOM from 'react-dom/client'
import '@fontsource/cascadia-code/400.css'
import '@fontsource/cascadia-code/700.css'
import App from './App'
import './index.css'

// La fuente se carga explícitamente antes de montar los terminales: xterm.js
// mide el ancho de los glifos al crearse, y si la fuente aún no está disponible
// usa el fallback y los caracteres quedan desalineados.
async function bootstrap(): Promise<void> {
  try {
    await document.fonts.ready
    await Promise.all([
      document.fonts.load('14px "Cascadia Code"'),
      document.fonts.load('bold 14px "Cascadia Code"')
    ])
  } catch {
    // si la fuente falla, se usa el fallback monospace
  }
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />)
}

bootstrap()