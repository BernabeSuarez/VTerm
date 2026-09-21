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
}

/** Parche aceptado por `config:set`: la config puede actualizarse parcialmente,
 *  y `font` admite cambios de a un campo. */
export type ConfigPatch = Partial<Omit<AppConfig, 'font'>> & { font?: Partial<AppFontConfig> }