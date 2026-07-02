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
      recolecciones: { with: { recoleccion: true } },
      cajas: { with: { recolecciones: true } },
      ventas: true,
    },
  })
  if (!l) {
    throw createError({ statusCode: 404, statusMessage: 'Lote no encontrado' })
  }
  return l
})
