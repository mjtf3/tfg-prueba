/** Forma de los errores que lanza `$fetch` (ofetch). En los 400 de validación,
 * `data.data` trae el `flatten()` de zod con los errores por campo. */
interface ErrorFetch {
  statusCode?: number
  statusMessage?: string
  data?: {
    statusMessage?: string
    data?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> }
  }
}

/** Código de estado HTTP de un error de `$fetch`, si lo tiene. */
export function estadoDe(e: unknown): number | undefined {
  return (e as ErrorFetch)?.statusCode
}

/** Mensaje legible de un error de `$fetch`: usa el `statusMessage` devuelto por
 * el servidor y, si no lo hay, el texto de reserva. Si además viene el detalle
 * de validación de zod (`fieldErrors`/`formErrors`), lo añade (máx. 3 campos
 * para no desbordar la UI). */
export function mensajeDe(e: unknown, reserva: string): string {
  const err = e as ErrorFetch
  const base = err?.data?.statusMessage || err?.statusMessage || reserva
  const detalle = err?.data?.data
  const campos = Object.entries(detalle?.fieldErrors ?? {}).filter(([, msgs]) => msgs?.length)
  if (campos.length) {
    const resumen = campos.slice(0, 3).map(([campo, msgs]) => `${campo} — ${msgs[0]}`)
    return `${base}: ${resumen.join('; ')}`
  }
  if (detalle?.formErrors?.length) {
    return `${base}: ${detalle.formErrors.slice(0, 3).join('; ')}`
  }
  return base
}
