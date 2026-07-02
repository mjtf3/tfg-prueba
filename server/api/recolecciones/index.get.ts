import { db } from '../../database'
import { requireRole } from '../../utils/require-auth'

/** Listado de recolecciones con su producto, categoría y totales agregados.
 * Restringido a oficina: expone datos económicos (precio de coste, albarán). */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'oficina')
  const recolecciones = await db.query.recoleccion.findMany({
    with: { producto: true, categoria: true, proveedor: true, pales: true },
    orderBy: (r, { desc }) => desc(r.createdAt),
  })
  // No devolvemos el array de palés en el listado; solo los agregados.
  return recolecciones.map(({ pales, ...resto }) => ({
    ...resto,
    numPales: pales.length,
    totalKilos: pales.reduce((suma, p) => suma + Number(p.kilos), 0),
  }))
})
