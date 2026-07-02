import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { db } from '../../../database'
import { pale } from '../../../database/schemas'
import { requireUser } from '../../../utils/require-auth'
import { resumenRecoleccion } from '../../../utils/totales'

const bodySchema = z.object({
  cajas: z.number().int().default(1),
  kilos: z.number().default(0),
})

/** Añade cajas o kilos a un palé (modo de escaneo consecutivo, RF-04) y devuelve
 * los totales acumulados de la recolección (RF-11). */
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

  const [actualizado] = await db
    .update(pale)
    .set({
      numCajas: sql`${pale.numCajas} + ${cajas}`,
      kilos: sql`${pale.kilos} + ${kilos}`,
    })
    .where(eq(pale.qr, qr))
    .returning()
  if (!actualizado) {
    throw createError({ statusCode: 404, statusMessage: 'Palé no encontrado' })
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
