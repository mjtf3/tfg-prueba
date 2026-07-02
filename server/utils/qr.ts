import QRCode from 'qrcode'

/** Genera la imagen (data-URL PNG) de un código QR a partir de su contenido. */
export function generarQrDataUrl(contenido: string): Promise<string> {
  return QRCode.toDataURL(contenido, { width: 256, margin: 1 })
}
