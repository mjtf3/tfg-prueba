import { randomUUID } from 'node:crypto'

/**
 * Genera el código de trazabilidad propio de la aplicación (RF-07).
 *
 * Es independiente de la etiqueta interna `AA-BB-CCC-DDDDDD`, cuya componente de
 * fecha impide usarla como clave única. La restricción `unique` de la columna
 * `codigo_trazabilidad` garantiza que no haya colisiones.
 */
export function generarCodigoTrazabilidad(): string {
  return `TRZ-${randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`
}

/**
 * Contenido único del código QR de un palé (RF-02): el código de trazabilidad de
 * la recolección más el índice del palé dentro de ella (p. ej. `TRZ-…-P01`).
 */
export function generarQrPale(codigoTrazabilidad: string, indice: number): string {
  return `${codigoTrazabilidad}-P${String(indice).padStart(2, '0')}`
}
