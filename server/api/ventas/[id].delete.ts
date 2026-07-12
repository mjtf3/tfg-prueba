import { z } from 'zod'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../database'
import { venta } from '../../database/schemas'
import { requireRole } from '../../utils/require-auth'

const bodySchema = z.object({ motivo: z.string().optional() }).optional()

/**
 * Anula una venta (RF-05). Es un borrado lógico: la venta deja de contar para
 * el stock del lote pero se conserva como histórico auditable (quién la anuló,
 * cuándo y por qué), como exige la trazabilidad hacia delante (art. 18
 * Reglamento CE 178/2002). No hay borrado físico de ventas.
 */
export default defineEventHandler(async (event) => {
  const usuario = await requireRole(event, 'oficina')

  const id = Number(getRouterParam(event, 'id'))
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
  }

  const parsed = bodySchema.safeParse(await readBody(event).catch(() => undefined))
  const motivo = parsed.success ? parsed.data?.motivo?.trim() || null : null

  const [anulada] = await db
    .update(venta)
    .set({ anuladaAt: new Date(), anuladaPor: usuario.id, motivoAnulacion: motivo })
    .where(and(eq(venta.id, id), isNull(venta.anuladaAt)))
    .returning({ id: venta.id })
  if (!anulada) {
    const [existe] = await db.select({ id: venta.id }).from(venta).where(eq(venta.id, id)).limit(1)
    if (!existe) {
      throw createError({ statusCode: 404, statusMessage: 'Venta no encontrada' })
    }
    throw createError({ statusCode: 400, statusMessage: 'La venta ya está anulada' })
  }
  return { id: anulada.id }
})
