import { eq } from 'drizzle-orm'
import { db } from '../../database'
import { venta } from '../../database/schemas'
import { requireRole } from '../../utils/require-auth'

/** Elimina una venta (RF-05). Borrado simple: no tiene tablas dependientes. */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'oficina')

  const id = Number(getRouterParam(event, 'id'))
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
  }

  const [eliminada] = await db.delete(venta).where(eq(venta.id, id)).returning({ id: venta.id })
  if (!eliminada) {
    throw createError({ statusCode: 404, statusMessage: 'Venta no encontrada' })
  }
  return { id: eliminada.id }
})
