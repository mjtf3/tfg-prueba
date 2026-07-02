/**
 * Detecta una violación de restricción única de PostgreSQL (SQLSTATE 23505),
 * ya venga el error directo o envuelto por Drizzle en su cadena de `cause`.
 */
export function esViolacionUnica(e: unknown): boolean {
  let actual: unknown = e
  for (let i = 0; i < 4 && actual; i++) {
    if ((actual as { code?: string }).code === '23505') return true
    actual = (actual as { cause?: unknown }).cause
  }
  return false
}
