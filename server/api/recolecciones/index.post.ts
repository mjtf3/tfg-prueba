import { z } from 'zod'
import { db } from '../../database'
import { recoleccion, pale } from '../../database/schemas'
import { requireRole } from '../../utils/require-auth'
import { generarCodigoTrazabilidad, generarQrPale } from '../../utils/ids'

const paleInput = z.object({
  numCajas: z.number().int().min(0).default(0),
  kilos: z.number().min(0).default(0),
})

const bodySchema = z
  .object({
    tipo: z.enum(['propio', 'comprado']),
    fechaRecoleccion: z.iso.date('Fecha de recolección inválida (formato esperado YYYY-MM-DD)'),
    albaran: z.string().optional(),
    precioCoste: z.number().nonnegative().optional(),
    productoId: z.number().int(),
    categoriaId: z.number().int(),
    parcelaId: z.number().int().optional(),
    recintoId: z.number().int().optional(),
    fincaId: z.number().int().optional(),
    proveedorId: z.number().int().optional(),
    pales: z.array(paleInput).min(1),
  })
  // Origen propio: la parcela de origen es obligatoria (RF-01).
  .refine((d) => d.tipo !== 'propio' || d.parcelaId != null, {
    message: 'La parcela de origen es obligatoria en una recolección propia',
    path: ['parcelaId'],
  })
  // Origen comprado: el proveedor es obligatorio (RF-01).
  .refine((d) => d.tipo !== 'comprado' || d.proveedorId != null, {
    message: 'El proveedor es obligatorio en una compra foránea',
    path: ['proveedorId'],
  })

/**
 * Alta de una recolección (RF-01). Genera su código de trazabilidad (RF-07) y un
 * palé por cada entrada indicada, cada uno con su código QR único (RF-02), todo
 * dentro de una transacción.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'oficina')

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Datos de la recolección inválidos',
      data: parsed.error.flatten(),
    })
  }
  const body = parsed.data
  const esPropio = body.tipo === 'propio'
  const codigo = generarCodigoTrazabilidad()

  const creada = await db.transaction(async (tx) => {
    const [rec] = await tx
      .insert(recoleccion)
      .values({
        codigoTrazabilidad: codigo,
        tipo: body.tipo,
        fechaRecoleccion: body.fechaRecoleccion,
        albaran: body.albaran,
        precioCoste: body.precioCoste == null ? null : String(body.precioCoste),
        parcelaId: esPropio ? body.parcelaId : null,
        recintoId: esPropio ? body.recintoId : null,
        fincaId: esPropio ? body.fincaId : null,
        proveedorId: esPropio ? null : body.proveedorId,
        productoId: body.productoId,
        categoriaId: body.categoriaId,
      })
      .returning()

    await tx.insert(pale).values(
      body.pales.map((p, i) => ({
        qr: generarQrPale(codigo, i + 1),
        recoleccionId: rec.id,
        numCajas: p.numCajas,
        kilos: String(p.kilos),
      }))
    )

    return rec
  })

  setResponseStatus(event, 201)
  return creada
})
