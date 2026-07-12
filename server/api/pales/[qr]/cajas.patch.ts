import { z } from 'zod'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '../../../database'
import { pale, recoleccion, loteRecoleccion } from '../../../database/schemas'
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
 * (RF-11). Se rechazan con un 400, en vez de aplicarse recortadas o a ciegas,
 * las correcciones que dejarían las cajas o los kilos del palé en negativo y
 * las que dejarían la recolección con menos kilos de los ya asignados a lotes
 * (habría lotes vendiendo kilos que ya no existen; hay que reducir antes las
 * asignaciones). */
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

  const actualizado = await db.transaction(async (tx) => {
    const [existe] = await tx
      .select({ id: pale.id, recoleccionId: pale.recoleccionId })
      .from(pale)
      .where(eq(pale.qr, qr))
      .limit(1)
    if (!existe) {
      throw createError({ statusCode: 404, statusMessage: 'Palé no encontrado' })
    }

    // Al restar kilos, bloquea la recolección: es la misma fila que bloquea el
    // alta de lote antes de asignar kilos, así que corrección y asignación
    // quedan serializadas y no pueden validarse ambas contra un estado viejo.
    if (kilos < 0) {
      await tx
        .select({ id: recoleccion.id })
        .from(recoleccion)
        .where(eq(recoleccion.id, existe.recoleccionId))
        .for('update')
    }

    // La condición de no-negatividad va en el propio WHERE para que la
    // comprobación y la actualización sean una sola operación atómica.
    const [p] = await tx
      .update(pale)
      .set({
        numCajas: sql`${pale.numCajas} + ${cajas}`,
        kilos: sql`${pale.kilos} + ${kilos}`,
      })
      .where(and(eq(pale.qr, qr), sql`${pale.numCajas} + ${cajas} >= 0`, sql`${pale.kilos} + ${kilos} >= 0`))
      .returning()
    if (!p) {
      throw createError({
        statusCode: 400,
        statusMessage: 'La corrección dejaría las cajas o los kilos del palé en negativo',
      })
    }

    // Tras una resta, la recolección debe seguir cubriendo los kilos ya
    // asignados a lotes; si no, se revierte (el throw deshace la transacción).
    if (kilos < 0) {
      const [{ cosechado }] = await tx
        .select({ cosechado: sql<string>`coalesce(sum(${pale.kilos}), 0)` })
        .from(pale)
        .where(eq(pale.recoleccionId, existe.recoleccionId))
      const [{ asignado }] = await tx
        .select({ asignado: sql<string>`coalesce(sum(${loteRecoleccion.kilos}), 0)` })
        .from(loteRecoleccion)
        .where(eq(loteRecoleccion.recoleccionId, existe.recoleccionId))
      if (Number(cosechado) < Number(asignado)) {
        throw createError({
          statusCode: 400,
          statusMessage: `La corrección dejaría la recolección con ${Number(cosechado).toFixed(2)} kg, por debajo de los ${Number(asignado).toFixed(2)} kg ya asignados a lotes; reduce antes esas asignaciones`,
        })
      }
    }

    return p
  })

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
