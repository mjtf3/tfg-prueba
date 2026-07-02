import { z } from 'zod'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../../database'
import { lote, loteRecoleccion, recoleccion } from '../../database/schemas'
import { requireRole } from '../../utils/require-auth'

const bodySchema = z.object({
  codigo: z.string().min(1),
  productoId: z.number().int(),
  categoriaId: z.number().int(),
  numPiezas: z.number().int().min(0).optional(),
  rgseaa: z.string().optional(),
  ggn: z.string().optional(),
  origen: z.string().optional(),
  recoleccionIds: z.array(z.number().int()).min(1),
})

/**
 * Alta de un lote comercial (RF-06). Agrupa varias recolecciones mediante la
 * tabla puente `lote_recoleccion`, exigiendo que todas compartan el mismo
 * producto y categoría que el lote.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'oficina')

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Datos del lote inválidos', data: parsed.error.flatten() })
  }
  const body = parsed.data

  const [duplicado] = await db.select({ id: lote.id }).from(lote).where(eq(lote.codigo, body.codigo)).limit(1)
  if (duplicado) {
    throw createError({ statusCode: 400, statusMessage: `Ya existe un lote con el código ${body.codigo}` })
  }

  const recs = await db.select().from(recoleccion).where(inArray(recoleccion.id, body.recoleccionIds))
  if (recs.length !== body.recoleccionIds.length) {
    throw createError({ statusCode: 400, statusMessage: 'Alguna recolección indicada no existe' })
  }
  const incompatibles = recs.some((r) => r.productoId !== body.productoId || r.categoriaId !== body.categoriaId)
  if (incompatibles) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Todas las recolecciones deben ser del mismo producto y categoría que el lote',
    })
  }

  const creado = await db.transaction(async (tx) => {
    const [l] = await tx
      .insert(lote)
      .values({
        codigo: body.codigo,
        productoId: body.productoId,
        categoriaId: body.categoriaId,
        numPiezas: body.numPiezas,
        rgseaa: body.rgseaa,
        ggn: body.ggn,
        origen: body.origen,
      })
      .returning()
    await tx.insert(loteRecoleccion).values(body.recoleccionIds.map((id) => ({ loteId: l.id, recoleccionId: id })))
    return l
  })

  setResponseStatus(event, 201)
  return creado
})
