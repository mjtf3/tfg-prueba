import { z } from 'zod'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { db } from '../../database'
import { venta, lote, loteRecoleccion } from '../../database/schemas'
import { requireRole } from '../../utils/require-auth'

const bodySchema = z.object({
  loteId: z.number().int(),
  fechaVenta: z.iso.date('Fecha de venta inválida (formato esperado YYYY-MM-DD)'),
  kilos: z.number().positive(),
  precioVenta: z.number().nonnegative(),
  // Destino de la mercancía, obligatorio: sin destinatario no hay trazabilidad
  // hacia delante (art. 18 Reglamento CE 178/2002).
  cliente: z.string().trim().min(1, 'El cliente/destino es obligatorio'),
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

  const creada = await db.transaction(async (tx) => {
    // Bloquea el lote: la comprobación de kilos disponibles y el insert quedan
    // serializados frente a otras ventas simultáneas del mismo lote, evitando
    // que dos peticiones vean el mismo disponible y ambas vendan.
    const [existeLote] = await tx.select({ id: lote.id }).from(lote).where(eq(lote.id, body.loteId)).for('update')
    if (!existeLote) {
      throw createError({ statusCode: 400, statusMessage: 'El lote indicado no existe' })
    }

    // Kilos disponibles del lote: los asignados desde sus recolecciones
    // (`lote_recoleccion.kilos`) menos lo ya vendido sin anular. Como la
    // asignación por lote es excluyente, una recolección repartida entre
    // varios lotes no puede respaldar ventas duplicadas.
    const [{ asignado }] = await tx
      .select({ asignado: sql<string>`coalesce(sum(${loteRecoleccion.kilos}), 0)` })
      .from(loteRecoleccion)
      .where(eq(loteRecoleccion.loteId, body.loteId))
    const [{ vendido }] = await tx
      .select({ vendido: sql<string>`coalesce(sum(${venta.kilos}), 0)` })
      .from(venta)
      .where(and(eq(venta.loteId, body.loteId), isNull(venta.anuladaAt)))
    const disponible = Number(asignado) - Number(vendido)
    if (body.kilos > disponible) {
      throw createError({
        statusCode: 400,
        statusMessage: `La venta supera los kilos disponibles del lote (quedan ${disponible.toFixed(2)} kg)`,
      })
    }

    const [v] = await tx
      .insert(venta)
      .values({
        loteId: body.loteId,
        fechaVenta: body.fechaVenta,
        kilos: String(body.kilos),
        precioVenta: String(body.precioVenta),
        cliente: body.cliente,
      })
      .returning()
    return v
  })

  setResponseStatus(event, 201)
  return creada
})
