import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../database'
import { venta, lote } from '../../database/schemas'
import { requireRole } from '../../utils/require-auth'

const bodySchema = z.object({
  loteId: z.number().int(),
  fechaVenta: z.iso.date('Fecha de venta inválida (formato esperado YYYY-MM-DD)'),
  kilos: z.number().positive(),
  precioVenta: z.number().nonnegative(),
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

  const [creada] = await db
    .insert(venta)
    .values({
      loteId: body.loteId,
      fechaVenta: body.fechaVenta,
      kilos: String(body.kilos),
      precioVenta: String(body.precioVenta),
    })
    .returning()

  setResponseStatus(event, 201)
  return creada
})
