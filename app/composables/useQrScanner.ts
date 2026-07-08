import type QrScannerType from 'qr-scanner'

/**
 * Envuelve la librería `qr-scanner` (Nimiq) para escanear con la cámara del móvil
 * (RF-03). Prioriza la cámara trasera y limita las lecturas por segundo para
 * mantener una latencia baja (RNF-02). La librería se importa dinámicamente para
 * no evaluarse durante el renderizado en servidor.
 */
export function useQrScanner(onDecode: (data: string) => void) {
  const videoRef = ref<HTMLVideoElement | null>(null)
  const scanning = ref(false)
  const error = ref('')
  let scanner: QrScannerType | null = null

  async function start() {
    error.value = ''
    if (!videoRef.value) {
      error.value = 'La cámara no está disponible en esta pantalla.'
      return
    }

    // La cámara solo está disponible en contexto seguro (HTTPS o localhost). Al
    // abrir el dev server desde el móvil por IP de red (http://…) el navegador no
    // expone getUserMedia, así que lo detectamos antes para dar un mensaje útil.
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      error.value = window.isSecureContext
        ? 'Este navegador no permite el acceso a la cámara.'
        : 'La cámara requiere una conexión segura (HTTPS). Abre la aplicación por https:// o desde localhost.'
      return
    }

    try {
      const { default: QrScanner } = await import('qr-scanner')
      if (!(await QrScanner.hasCamera())) {
        error.value = 'No se ha detectado ninguna cámara en el dispositivo.'
        return
      }
      if (!scanner) {
        scanner = new QrScanner(videoRef.value, (result) => onDecode(result.data), {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
        })
      }
      await scanner.start()
      scanning.value = true
    } catch (e) {
      const nombre = (e as Error)?.name
      error.value =
        nombre === 'NotAllowedError'
          ? 'Permiso de cámara denegado. Actívalo en los ajustes del navegador.'
          : nombre === 'NotFoundError'
            ? 'No se ha encontrado ninguna cámara disponible.'
            : 'No se pudo iniciar la cámara.'
      scanning.value = false
    }
  }

  function stop() {
    scanner?.stop()
    scanning.value = false
  }

  onBeforeUnmount(() => {
    scanner?.destroy()
    scanner = null
  })

  return { videoRef, scanning, error, start, stop }
}
