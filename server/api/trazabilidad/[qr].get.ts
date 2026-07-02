import { db } from '../../database'
import { requireUser } from '../../utils/require-auth'

/**
 * Consulta de trazabilidad completa de un palé a partir de su código QR (RF-12):
 * reconstruye la cadena palé -> recolección (origen) -> lotes -> ventas.
 *
 * Accesible a ambos roles, pero devuelve solo la procedencia: se omiten los
 * datos económicos (precio de coste, precio y total de venta), que son de oficina.
 */
export default defineEventHandler(async (event) => {
  await requireUser(event)

  const qr = getRouterParam(event, 'qr')
  if (!qr) {
    throw createError({ statusCode: 400, statusMessage: 'QR no indicado' })
  }

  const p = await db.query.pale.findFirst({
    where: (t, { eq }) => eq(t.qr, qr),
    with: {
      recoleccion: {
        with: {
          producto: true,
          categoria: true,
          parcela: { with: { pueblo: true } },
          recinto: true,
          finca: true,
          proveedor: true,
          lotes: { with: { lote: { with: { ventas: true } } } },
        },
      },
    },
  })
  if (!p) {
    throw createError({ statusCode: 404, statusMessage: 'No se encontró ningún palé con ese código' })
  }

  const r = p.recoleccion
  return {
    pale: { qr: p.qr, numCajas: p.numCajas, kilos: p.kilos },
    recoleccion: {
      codigoTrazabilidad: r.codigoTrazabilidad,
      tipo: r.tipo,
      fechaRecoleccion: r.fechaRecoleccion,
      producto: r.producto?.nombre,
      categoria: r.categoria?.nombre,
      origen:
        r.tipo === 'propio'
          ? {
              pueblo: r.parcela?.pueblo?.nombre,
              parcela: r.parcela?.nombre ?? r.parcela?.codigo,
              recinto: r.recinto?.codigo,
              finca: r.finca?.nombre,
            }
          : { proveedor: r.proveedor?.nombre },
    },
    lotes: r.lotes.map((lr) => ({
      codigo: lr.lote.codigo,
      ventas: lr.lote.ventas.map((v) => ({ fechaVenta: v.fechaVenta, kilos: v.kilos })),
    })),
  }
})
