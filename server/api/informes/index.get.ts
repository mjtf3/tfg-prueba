import { eq, sql } from 'drizzle-orm'
import { db } from '../../database'
import { venta, lote, producto, recoleccion } from '../../database/schemas'
import { requireRole } from '../../utils/require-auth'

/** Informes de gestión (RF-09, solo oficina): resumen de ventas por producto y
 * de recolecciones por tipo de origen. */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'oficina')

  const ventasPorProducto = await db
    .select({
      producto: producto.nombre,
      numVentas: sql<number>`count(*)::int`,
      totalKilos: sql<string>`coalesce(sum(${venta.kilos}), 0)`,
      totalImporte: sql<string>`coalesce(sum(${venta.total}), 0)`,
    })
    .from(venta)
    .innerJoin(lote, eq(venta.loteId, lote.id))
    .innerJoin(producto, eq(lote.productoId, producto.id))
    .groupBy(producto.nombre)

  const recoleccionesPorTipo = await db
    .select({
      tipo: recoleccion.tipo,
      numRecolecciones: sql<number>`count(*)::int`,
    })
    .from(recoleccion)
    .groupBy(recoleccion.tipo)

  return { ventasPorProducto, recoleccionesPorTipo }
})
