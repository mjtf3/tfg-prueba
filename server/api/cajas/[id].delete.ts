import { eq } from 'drizzle-orm'
import { db } from '../../database'
import { caja } from '../../database/schemas'
import { requireRole } from '../../utils/require-auth'

/** Elimina una caja de producto terminado. Borrado simple: sus vínculos con
 * recolecciones (`caja_recoleccion`) caen en cascada. */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'oficina')

  const id = Number(getRouterParam(event, 'id'))
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
  }

  const [eliminada] = await db.delete(caja).where(eq(caja.id, id)).returning({ id: caja.id })
  if (!eliminada) {
    throw createError({ statusCode: 404, statusMessage: 'Caja no encontrada' })
  }
  return { id: eliminada.id }
})
