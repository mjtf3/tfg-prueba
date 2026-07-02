import { db } from '../../database'
import { requireUser } from '../../utils/require-auth'

/** Listado de recolecciones con su producto, categoría y totales agregados. */
export default defineEventHandler(async (event) => {
  await requireUser(event)
  const recolecciones = await db.query.recoleccion.findMany({
    with: { producto: true, categoria: true, proveedor: true, pales: true },
    orderBy: (r, { desc }) => desc(r.createdAt),
  })
  return recolecciones.map((r) => ({
    ...r,
    numPales: r.pales.length,
    totalKilos: r.pales.reduce((suma, p) => suma + Number(p.kilos), 0),
  }))
})
