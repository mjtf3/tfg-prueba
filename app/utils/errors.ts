/** Forma de los errores que lanza `$fetch` (ofetch). */
interface ErrorFetch {
  statusCode?: number
  statusMessage?: string
  data?: { statusMessage?: string }
}

/** Código de estado HTTP de un error de `$fetch`, si lo tiene. */
export function estadoDe(e: unknown): number | undefined {
  return (e as ErrorFetch)?.statusCode
}

/** Mensaje legible de un error de `$fetch`: usa el `statusMessage` devuelto por
 * el servidor y, si no lo hay, el texto de reserva. */
export function mensajeDe(e: unknown, reserva: string): string {
  const err = e as ErrorFetch
  return err?.data?.statusMessage || err?.statusMessage || reserva
}
