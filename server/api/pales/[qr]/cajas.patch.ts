import { z } from 'zod'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '../../../database'
import { pale } from '../../../database/schemas'
import { requireUser } from '../../../utils/require-auth'
import { resumenRecoleccion } from '../../../utils/totales'

const bodySchema = z.object({
  // Admite valores negativos: permiten corregir escaneos erróneos restando
  // cajas o kilos.
  cajas: z.number().int().default(1),
  kilos: z.number().default(0),
})

/** Añade o resta cajas y kilos a un palé (modo de escaneo consecutivo y su
 * corrección, RF-04) y devuelve los totales acumulados de la recolección
 * (RF-11). Una corrección que dejaría las cajas o los kilos en negativo se
 * rechaza con un 400 en vez de recortarse en silencio: casi siempre es un
 * error de tecleo y recortar borraría el conteo real. */
export default defineEventHandler(async (event) => {
  await requireUser(event)

  const qr = getRouterParam(event, 'qr')
  if (!qr) {
    throw createError({ statusCode: 400, statusMessage: 'QR no indicado' })
  }

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Datos inválidos' })
  }
  const { cajas, kilos } = parsed.data

  // La condición de no-negatividad va en el propio WHERE para que la
  // comprobación y la actualización sean una sola operación atómica.
  const [actualizado] = await db
    .update(pale)
    .set({
      numCajas: sql`${pale.numCajas} + ${cajas}`,
      kilos: sql`${pale.kilos} + ${kilos}`,
    })
    .where(and(eq(pale.qr, qr), sql`${pale.numCajas} + ${cajas} >= 0`, sql`${pale.kilos} + ${kilos} >= 0`))
    .returning()
  if (!actualizado) {
    const [existe] = await db.select({ id: pale.id }).from(pale).where(eq(pale.qr, qr)).limit(1)
    if (!existe) {
      throw createError({ statusCode: 404, statusMessage: 'Palé no encontrado' })
    }
    throw createError({
      statusCode: 400,
      statusMessage: 'La corrección dejaría las cajas o los kilos del palé en negativo',
    })
  }

  const rec = await db.query.recoleccion.findFirst({
    where: (r, { eq: eqRec }) => eqRec(r.id, actualizado.recoleccionId),
    with: { producto: true, categoria: true, pales: true },
  })

  return {
    qr: actualizado.qr,
    numCajas: actualizado.numCajas,
    kilos: actualizado.kilos,
    recoleccion: {
      id: rec!.id,
      codigoTrazabilidad: rec!.codigoTrazabilidad,
      producto: rec!.producto?.nombre,
      categoria: rec!.categoria?.nombre,
      numPales: rec!.pales.length,
      ...resumenRecoleccion(rec!.pales),
    },
  }
})
