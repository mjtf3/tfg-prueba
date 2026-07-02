import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../database'
import { caja, cajaRecoleccion, loteRecoleccion } from '../../database/schemas'
import { requireRole } from '../../utils/require-auth'

const bodySchema = z.object({
  codigo: z.string().optional(),
  loteId: z.number().int(),
  // Una caja de producto terminado procede como máximo de 2 recolecciones.
  recoleccionIds: z.array(z.number().int()).min(1).max(2),
})

/** Alta de una caja de producto terminado de un lote (máx. 2 recolecciones). */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'oficina')

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Datos de la caja inválidos', data: parsed.error.flatten() })
  }
  const body = parsed.data

  // Las recolecciones de la caja deben pertenecer al lote.
  const delLote = await db.select().from(loteRecoleccion).where(eq(loteRecoleccion.loteId, body.loteId))
  if (!delLote.length) {
    throw createError({ statusCode: 400, statusMessage: 'El lote no existe o no tiene recolecciones' })
  }
  const idsDelLote = new Set(delLote.map((lr) => lr.recoleccionId))
  const fuera = body.recoleccionIds.filter((id) => !idsDelLote.has(id))
  if (fuera.length) {
    throw createError({ statusCode: 400, statusMessage: 'Las recolecciones de la caja deben pertenecer al lote' })
  }

  const creada = await db.transaction(async (tx) => {
    const [c] = await tx.insert(caja).values({ codigo: body.codigo, loteId: body.loteId }).returning()
    await tx.insert(cajaRecoleccion).values(body.recoleccionIds.map((id) => ({ cajaId: c.id, recoleccionId: id })))
    return c
  })

  setResponseStatus(event, 201)
  return creada
})
