declare module '@vterm/macos-services' {
  interface OpenFolderPayload {
    paths: string[]
  }

  interface MacOSServices {
    isSupported: boolean
    registerProvider: (callback: (payload: OpenFolderPayload) => void) => boolean
  }

  const services: MacOSServices
  export default services
}