import { eq } from 'drizzle-orm'
import { db } from '../../database'
import { recoleccion, pale, loteRecoleccion, cajaRecoleccion } from '../../database/schemas'
import { requireRole } from '../../utils/require-auth'

/**
 * Elimina una recolección (RF-01). Se rechaza si está vinculada a algún lote o
 * caja de producto terminado (así se preserva la trazabilidad ya emitida). Si
 * no lo está, en una transacción se borran primero sus palés (la FK de `pale`
 * es restrictiva) y después la propia recolección.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'oficina')

  const id = Number(getRouterParam(event, 'id'))
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
  }

  const [[enLote], [enCaja]] = await Promise.all([
    db
      .select({ loteId: loteRecoleccion.loteId })
      .from(loteRecoleccion)
      .where(eq(loteRecoleccion.recoleccionId, id))
      .limit(1),
    db
      .select({ cajaId: cajaRecoleccion.cajaId })
      .from(cajaRecoleccion)
      .where(eq(cajaRecoleccion.recoleccionId, id))
      .limit(1),
  ])
  if (enLote || enCaja) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No se puede eliminar una recolección vinculada a lotes o cajas',
    })
  }

  const eliminada = await db.transaction(async (tx) => {
    await tx.delete(pale).where(eq(pale.recoleccionId, id))
    const [r] = await tx.delete(recoleccion).where(eq(recoleccion.id, id)).returning({ id: recoleccion.id })
    return r
  })
  if (!eliminada) {
    throw createError({ statusCode: 404, statusMessage: 'Recolección no encontrada' })
  }
  return { id: eliminada.id }
})
