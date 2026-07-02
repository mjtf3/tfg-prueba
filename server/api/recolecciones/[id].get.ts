import { db } from '../../database'
import { requireRole } from '../../utils/require-auth'
import { generarQrDataUrl } from '../../utils/qr'

/** Detalle de una recolección con su origen, palés y las imágenes de sus QR.
 * Restringido a oficina: expone datos económicos (precio de coste, albarán). */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'oficina')

  const id = Number(getRouterParam(event, 'id'))
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
  }

  const rec = await db.query.recoleccion.findFirst({
    where: (r, { eq }) => eq(r.id, id),
    with: {
      producto: true,
      categoria: true,
      parcela: { with: { pueblo: true } },
      recinto: true,
      finca: true,
      proveedor: true,
      pales: true,
    },
  })

  if (!rec) {
    throw createError({ statusCode: 404, statusMessage: 'Recolección no encontrada' })
  }

  const pales = await Promise.all(
    rec.pales.map(async (p) => ({ ...p, qrDataUrl: await generarQrDataUrl(p.qr) }))
  )

  return {
    ...rec,
    pales,
    totalKilos: rec.pales.reduce((suma, p) => suma + Number(p.kilos), 0),
  }
})
