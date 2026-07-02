import { db } from '../../database'
import { requireRole } from '../../utils/require-auth'

/** Listado de lotes con su producto, categoría y recuentos agregados. */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'oficina')
  const lotes = await db.query.lote.findMany({
    with: { producto: true, categoria: true, recolecciones: true, ventas: true },
    orderBy: (l, { desc }) => desc(l.createdAt),
  })
  return lotes.map(({ recolecciones, ventas, ...resto }) => ({
    ...resto,
    numRecolecciones: recolecciones.length,
    numVentas: ventas.length,
  }))
})
