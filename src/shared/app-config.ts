export type FontWeight = number | 'normal' | 'bold'

export interface AppFontConfig {
  family: string
  size: number
  weight: FontWeight
  weightBold: FontWeight
  cursorBlink: boolean
}

export interface AppConfig {
  themeId: string
  defaultProfile: string
  font: AppFontConfig
  /** Reasignación de atajos de teclado: `command -> acelerador` (p. ej. `"Tab+Nuevo": "cmd+t"`).
   *  Vacío en `""` para deshabilitar el atajo por defecto de un comando. */
  keymaps: Record<string, string>
}

/** Parche aceptado por `config:set`: la config puede actualizarse parcialmente,
 *  y `font` admite cambios de a un campo. */
export type ConfigPatch = Partial<Omit<AppConfig, 'font' | 'keymaps'>> & { font?: Partial<AppFontConfig>; keymaps?: Record<string, string> }