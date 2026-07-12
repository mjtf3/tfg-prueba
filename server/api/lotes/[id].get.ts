import { db } from '../../database'
import { requireRole } from '../../utils/require-auth'

/** Detalle de un lote: producto, recolecciones agrupadas, cajas y ventas. */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'oficina')

  const id = Number(getRouterParam(event, 'id'))
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
  }

  const l = await db.query.lote.findFirst({
    where: (t, { eq }) => eq(t.id, id),
    with: {
      producto: true,
      categoria: true,
      // Trazabilidad hacia atrás (RF-12): cada recolección con su origen y palés,
      // para reconstruir desde el lote/venta hasta la procedencia.
      recolecciones: {
        with: {
          recoleccion: {
            with: {
              parcela: { with: { pueblo: true } },
              recinto: true,
              finca: true,
              proveedor: true,
              pales: true,
            },
          },
        },
      },
      cajas: { with: { recolecciones: true } },
      ventas: true,
    },
  })
  if (!l) {
    throw createError({ statusCode: 404, statusMessage: 'Lote no encontrado' })
  }
  return l
})
