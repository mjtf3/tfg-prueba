import { db } from '../../database'
import { requireRole } from '../../utils/require-auth'

/** Listado de ventas con el lote y su producto. */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'oficina')
  return db.query.venta.findMany({
    with: { lote: { with: { producto: true } } },
    orderBy: (v, { desc }) => desc(v.createdAt),
  })
})
