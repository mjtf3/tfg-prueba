import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../database'
import { caja, cajaRecoleccion, loteRecoleccion } from '../../database/schemas'
import { requireRole } from '../../utils/require-auth'
import { esViolacionUnica } from '../../utils/db-errors'

const bodySchema = z.object({
  codigo: z.string().optional(),
  loteId: z.number().int(),
  // Una caja de producto terminado procede como máximo de 2 recolecciones,
  // sin repetir (la PK compuesta de caja_recoleccion rechazaría un duplicado).
  recoleccionIds: z
    .array(z.number().int())
    .min(1)
    .max(2)
    .refine((a) => new Set(a).size === a.length, 'IDs de recolección duplicados'),
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

  try {
    const creada = await db.transaction(async (tx) => {
      const [c] = await tx.insert(caja).values({ codigo: body.codigo, loteId: body.loteId }).returning()
      await tx.insert(cajaRecoleccion).values(body.recoleccionIds.map((id) => ({ cajaId: c.id, recoleccionId: id })))
      return c
    })

    setResponseStatus(event, 201)
    return creada
  } catch (e) {
    if (esViolacionUnica(e)) {
      throw createError({ statusCode: 400, statusMessage: `Ya existe una caja con el código ${body.codigo}` })
    }
    throw e
  }
})
