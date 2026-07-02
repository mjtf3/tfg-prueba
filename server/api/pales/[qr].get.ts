import { db } from '../../database'
import { requireUser } from '../../utils/require-auth'
import { resumenRecoleccion } from '../../utils/totales'

/** Localiza un palé por el contenido de su QR (RF-03) y devuelve su recolección
 * con los totales acumulados, para mostrar el contexto al escanear. */
export default defineEventHandler(async (event) => {
  await requireUser(event)

  const qr = getRouterParam(event, 'qr')
  if (!qr) {
    throw createError({ statusCode: 400, statusMessage: 'QR no indicado' })
  }

  const p = await db.query.pale.findFirst({
    where: (t, { eq }) => eq(t.qr, qr),
    with: { recoleccion: { with: { producto: true, categoria: true, pales: true } } },
  })
  if (!p) {
    throw createError({ statusCode: 404, statusMessage: 'Palé no encontrado' })
  }

  const rec = p.recoleccion
  return {
    qr: p.qr,
    numCajas: p.numCajas,
    kilos: p.kilos,
    recoleccion: {
      id: rec.id,
      codigoTrazabilidad: rec.codigoTrazabilidad,
      producto: rec.producto?.nombre,
      categoria: rec.categoria?.nombre,
      numPales: rec.pales.length,
      ...resumenRecoleccion(rec.pales),
    },
  }
})
