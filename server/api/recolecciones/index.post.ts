import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../database'
import { recoleccion, pale, producto, categoria, parcela, recinto, finca, proveedor } from '../../database/schemas'
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

  // Comprobación de existencia de las referencias (RF-01): sin esto, una FK
  // inválida acaba en un 500. A lo sumo una consulta por tabla implicada.
  const [prod, cat, parc, recintoRow, fin, prov] = await Promise.all([
    db.select({ id: producto.id }).from(producto).where(eq(producto.id, body.productoId)).limit(1),
    db.select({ id: categoria.id }).from(categoria).where(eq(categoria.id, body.categoriaId)).limit(1),
    body.parcelaId != null
      ? db.select({ id: parcela.id }).from(parcela).where(eq(parcela.id, body.parcelaId)).limit(1)
      : Promise.resolve([]),
    body.recintoId != null
      ? db
          .select({ id: recinto.id, parcelaId: recinto.parcelaId })
          .from(recinto)
          .where(eq(recinto.id, body.recintoId))
          .limit(1)
      : Promise.resolve([]),
    body.fincaId != null
      ? db.select({ id: finca.id }).from(finca).where(eq(finca.id, body.fincaId)).limit(1)
      : Promise.resolve([]),
    body.proveedorId != null
      ? db.select({ id: proveedor.id }).from(proveedor).where(eq(proveedor.id, body.proveedorId)).limit(1)
      : Promise.resolve([]),
  ])
  if (!prod.length) {
    throw createError({ statusCode: 400, statusMessage: 'El producto indicado no existe' })
  }
  if (!cat.length) {
    throw createError({ statusCode: 400, statusMessage: 'La categoría indicada no existe' })
  }
  if (body.parcelaId != null && !parc.length) {
    throw createError({ statusCode: 400, statusMessage: 'La parcela indicada no existe' })
  }
  if (body.recintoId != null && !recintoRow.length) {
    throw createError({ statusCode: 400, statusMessage: 'El recinto indicado no existe' })
  }
  if (body.fincaId != null && !fin.length) {
    throw createError({ statusCode: 400, statusMessage: 'La finca indicada no existe' })
  }
  if (body.proveedorId != null && !prov.length) {
    throw createError({ statusCode: 400, statusMessage: 'El proveedor indicado no existe' })
  }
  // El recinto es una subdivisión de la parcela: si se indican ambos, deben ser coherentes.
  if (body.recintoId != null && body.parcelaId != null && recintoRow[0].parcelaId !== body.parcelaId) {
    throw createError({ statusCode: 400, statusMessage: 'El recinto no pertenece a la parcela indicada' })
  }

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
