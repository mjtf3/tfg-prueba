import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { db } from '../../database'
import { venta, lote, loteRecoleccion, pale } from '../../database/schemas'
import { requireRole } from '../../utils/require-auth'

const bodySchema = z.object({
  loteId: z.number().int(),
  fechaVenta: z.iso.date('Fecha de venta inválida (formato esperado YYYY-MM-DD)'),
  kilos: z.number().positive(),
  precioVenta: z.number().nonnegative(),
  // Destino de la mercancía, para la trazabilidad hacia delante (art. 18 Reglamento CE 178/2002).
  cliente: z.string().optional(),
})

/**
 * Registro de una venta de un lote (RF-05). El importe `total` lo calcula la
 * base de datos (columna generada `kilos * precio_venta`, RF-11), por eso no se
 * inserta aquí.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'oficina')

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Datos de la venta inválidos', data: parsed.error.flatten() })
  }
  const body = parsed.data

  const [existeLote] = await db.select({ id: lote.id }).from(lote).where(eq(lote.id, body.loteId)).limit(1)
  if (!existeLote) {
    throw createError({ statusCode: 400, statusMessage: 'El lote indicado no existe' })
  }

  // Kilos disponibles del lote: suma de los palés de sus recolecciones menos lo
  // ya vendido. Es solo una cota de sanidad, no un balance exacto: si una misma
  // recolección se reparte entre varios lotes, sus kilos se contarían en ambos.
  const [[{ totalPales }], [{ totalVentas }]] = await Promise.all([
    db
      .select({ totalPales: sql<string>`coalesce(sum(${pale.kilos}), 0)` })
      .from(loteRecoleccion)
      .innerJoin(pale, eq(pale.recoleccionId, loteRecoleccion.recoleccionId))
      .where(eq(loteRecoleccion.loteId, body.loteId)),
    db
      .select({ totalVentas: sql<string>`coalesce(sum(${venta.kilos}), 0)` })
      .from(venta)
      .where(eq(venta.loteId, body.loteId)),
  ])
  const disponible = Number(totalPales) - Number(totalVentas)
  if (body.kilos > disponible) {
    throw createError({
      statusCode: 400,
      statusMessage: `La venta supera los kilos disponibles del lote (quedan ${disponible.toFixed(2)} kg)`,
    })
  }

  const [creada] = await db
    .insert(venta)
    .values({
      loteId: body.loteId,
      fechaVenta: body.fechaVenta,
      kilos: String(body.kilos),
      precioVenta: String(body.precioVenta),
      cliente: body.cliente,
    })
    .returning()

  setResponseStatus(event, 201)
  return creada
})
