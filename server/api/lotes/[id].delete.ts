import { eq } from 'drizzle-orm'
import { db } from '../../database'
import { lote, venta } from '../../database/schemas'
import { requireRole } from '../../utils/require-auth'

/**
 * Elimina un lote (RF-06). Se rechaza si tiene ventas registradas —incluidas
 * las anuladas: son histórico auditable y no se borran—; si no las tiene, sus
 * cajas y los vínculos con recolecciones (`lote_recoleccion`) caen en cascada.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'oficina')

  const id = Number(getRouterParam(event, 'id'))
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
  }

  const [ventaDelLote] = await db.select({ id: venta.id }).from(venta).where(eq(venta.loteId, id)).limit(1)
  if (ventaDelLote) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No se puede eliminar un lote con ventas registradas (aunque estén anuladas)',
    })
  }

  const [eliminado] = await db.delete(lote).where(eq(lote.id, id)).returning({ id: lote.id })
  if (!eliminado) {
    throw createError({ statusCode: 404, statusMessage: 'Lote no encontrado' })
  }
  return { id: eliminado.id }
})
