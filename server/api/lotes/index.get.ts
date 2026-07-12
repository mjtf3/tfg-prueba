import { eq, sql, desc } from 'drizzle-orm'
import { db } from '../../database'
import { lote, producto, categoria, loteRecoleccion, venta } from '../../database/schemas'
import { requireRole } from '../../utils/require-auth'

/** Listado de lotes con su producto, categoría y recuentos agregados.
 * Los recuentos se obtienen con subconsultas correlacionadas para no traer
 * todas las filas de recolecciones y ventas solo para contarlas. */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'oficina')
  return db
    .select({
      id: lote.id,
      codigo: lote.codigo,
      productoId: lote.productoId,
      categoriaId: lote.categoriaId,
      rgseaa: lote.rgseaa,
      ggn: lote.ggn,
      origen: lote.origen,
      createdAt: lote.createdAt,
      updatedAt: lote.updatedAt,
      producto: { nombre: producto.nombre },
      categoria: { nombre: categoria.nombre },
      numRecolecciones: sql<number>`(select count(*)::int from ${loteRecoleccion} where ${loteRecoleccion.loteId} = ${lote.id})`,
      numVentas: sql<number>`(select count(*)::int from ${venta} where ${venta.loteId} = ${lote.id})`,
    })
    .from(lote)
    .leftJoin(producto, eq(lote.productoId, producto.id))
    .leftJoin(categoria, eq(lote.categoriaId, categoria.id))
    .orderBy(desc(lote.createdAt))
})
