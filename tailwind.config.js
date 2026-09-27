/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/src/**/*.{ts,tsx,html}'],
  // El tema de la app se define con variables CSS en index.css, no con la
  // paleta por defecto de Tailwind, así que acá solo se traen las utilidades.
  // Preflight queda desactivado a propósito: el CSS de la app (index.css)
  // ya aplica sus propios resets y no queremos que Tailwind los pise.
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {
      // El tema activo se aplica seteando estas variables en
      // documentElement (ver ConfigContext), así que las utilidades `ui-*`
      // siguen al theme en vivo sin necesidad de clases por tema.
      colors: {
        ui: {
          background: 'var(--ui-background)',
          surface: 'var(--ui-surface)',
          border: 'var(--ui-border)',
          text: 'var(--ui-text)',
          muted: 'var(--ui-text-muted)',
          accent: 'var(--ui-accent)'
        }
      }
    }
  },
  plugins: []
}
