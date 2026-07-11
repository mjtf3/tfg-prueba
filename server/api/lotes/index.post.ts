import { z } from 'zod'
import { inArray, sql } from 'drizzle-orm'
import { db } from '../../database'
import { lote, loteRecoleccion, recoleccion, pale } from '../../database/schemas'
import { requireRole } from '../../utils/require-auth'
import { esViolacionUnica } from '../../utils/db-errors'

const bodySchema = z.object({
  codigo: z.string().min(1),
  productoId: z.number().int(),
  categoriaId: z.number().int(),
  numPiezas: z.number().int().min(0).optional(),
  rgseaa: z.string().optional(),
  ggn: z.string().optional(),
  origen: z.string().optional(),
  recolecciones: z
    .array(
      z.object({
        recoleccionId: z.number().int(),
        // Kilos de la recolección que se asignan a este lote.
        kilos: z.number().positive('Los kilos asignados deben ser mayores que cero'),
      })
    )
    .min(1)
    // Sin duplicados: la PK compuesta de lote_recoleccion los rechazaría con un 500.
    .refine((a) => new Set(a.map((r) => r.recoleccionId)).size === a.length, 'IDs de recolección duplicados'),
})

/**
 * Alta de un lote comercial (RF-06). Agrupa varias recolecciones mediante la
 * tabla puente `lote_recoleccion`, exigiendo que todas compartan el mismo
 * producto y categoría que el lote.
 *
 * La relación lote-recolección es N:M por diseño (RF-06): una misma recolección
 * puede repartirse entre varios lotes. Para que ese reparto no infle el stock,
 * cada vínculo lleva los kilos asignados y aquí se comprueba que, sumando lo ya
 * asignado a otros lotes, no se supere lo cosechado (kilos de los palés).
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'oficina')

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Datos del lote inválidos', data: parsed.error.flatten() })
  }
  const body = parsed.data
  const ids = body.recolecciones.map((r) => r.recoleccionId)

  const recs = await db.select().from(recoleccion).where(inArray(recoleccion.id, ids))
  if (recs.length !== ids.length) {
    throw createError({ statusCode: 400, statusMessage: 'Alguna recolección indicada no existe' })
  }
  const incompatibles = recs.some((r) => r.productoId !== body.productoId || r.categoriaId !== body.categoriaId)
  if (incompatibles) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Todas las recolecciones deben ser del mismo producto y categoría que el lote',
    })
  }

  try {
    const creado = await db.transaction(async (tx) => {
      // Bloquea las recolecciones implicadas: dos altas de lote simultáneas
      // sobre la misma recolección quedan serializadas y no pueden asignarse
      // ambas los mismos kilos.
      await tx.select({ id: recoleccion.id }).from(recoleccion).where(inArray(recoleccion.id, ids)).for('update')

      const cosechado = await tx
        .select({
          recoleccionId: pale.recoleccionId,
          total: sql<string>`coalesce(sum(${pale.kilos}), 0)`,
        })
        .from(pale)
        .where(inArray(pale.recoleccionId, ids))
        .groupBy(pale.recoleccionId)
      const asignado = await tx
        .select({
          recoleccionId: loteRecoleccion.recoleccionId,
          total: sql<string>`coalesce(sum(${loteRecoleccion.kilos}), 0)`,
        })
        .from(loteRecoleccion)
        .where(inArray(loteRecoleccion.recoleccionId, ids))
        .groupBy(loteRecoleccion.recoleccionId)

      const cosechadoPorRec = new Map(cosechado.map((r) => [r.recoleccionId, Number(r.total)]))
      const asignadoPorRec = new Map(asignado.map((r) => [r.recoleccionId, Number(r.total)]))
      for (const r of body.recolecciones) {
        const disponible = (cosechadoPorRec.get(r.recoleccionId) ?? 0) - (asignadoPorRec.get(r.recoleccionId) ?? 0)
        if (r.kilos > disponible) {
          const codigo = recs.find((x) => x.id === r.recoleccionId)!.codigoTrazabilidad
          throw createError({
            statusCode: 400,
            statusMessage: `La recolección ${codigo} solo tiene ${disponible.toFixed(2)} kg sin asignar a otros lotes`,
          })
        }
      }

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
      await tx.insert(loteRecoleccion).values(
        body.recolecciones.map((r) => ({
          loteId: l.id,
          recoleccionId: r.recoleccionId,
          kilos: String(r.kilos),
        }))
      )
      return l
    })

    setResponseStatus(event, 201)
    return creado
  } catch (e) {
    // La unicidad de `codigo` la garantiza la BD; traducimos su error a un 400
    // legible (cubre también la carrera entre peticiones concurrentes).
    if (esViolacionUnica(e)) {
      throw createError({ statusCode: 400, statusMessage: `Ya existe un lote con el código ${body.codigo}` })
    }
    throw e
  }
})
