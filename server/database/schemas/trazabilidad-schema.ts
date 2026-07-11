import { relations, sql } from 'drizzle-orm'
import {
  pgTable,
  pgEnum,
  integer,
  text,
  numeric,
  date,
  timestamp,
  primaryKey,
  index,
  unique,
} from 'drizzle-orm/pg-core'
import { user } from './auth-schema'

/**
 * Esquema de la cadena de trazabilidad hortofrutícola (Agropaco S.L.).
 *
 * Flujo del dominio:
 *   - ENTRADA: una `recoleccion` (= trazabilidad) genera varios `pale`s,
 *     cada uno con su código QR. El palé agrupa cajas de cosecha (se guarda
 *     el número de cajas y los kilos, sin modelar la caja de cosecha como fila).
 *   - SALIDA: el producto se empaqueta en `caja`s de producto terminado
 *     (etiqueta externa) agrupadas en `lote`s. Una caja terminada procede de
 *     un máximo de 2 recolecciones (restricción de la empresa).
 *   - Un `lote` agrupa producto de varias recolecciones (relación N:M).
 *   - Una `venta` comercializa un lote.
 */

// ---------------------------------------------------------------------------
// Enumerados
// ---------------------------------------------------------------------------

/** Distingue cosecha propia (coste interno) de compra foránea (precio pactado). */
export const tipoRecoleccion = pgEnum('tipo_recoleccion', ['propio', 'comprado'])

// ---------------------------------------------------------------------------
// Datos maestros (catálogos)
// ---------------------------------------------------------------------------

/** Pueblo de origen (campo AA de la etiqueta interna). */
export const pueblo = pgTable('pueblo', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  codigo: text('codigo').notNull().unique(), // AA
  nombre: text('nombre').notNull(),
})

/** Parcela dentro de un pueblo (campo BB de la etiqueta interna). */
export const parcela = pgTable(
  'parcela',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    codigo: text('codigo').notNull(), // BB
    nombre: text('nombre'),
    puebloId: integer('pueblo_id')
      .notNull()
      .references(() => pueblo.id),
  },
  (t) => [index('parcela_pueblo_idx').on(t.puebloId), unique('parcela_codigo_pueblo_uq').on(t.codigo, t.puebloId)]
)

/**
 * Recinto: subdivisión dentro de la parcela (campo CCC de la etiqueta interna).
 * El significado exacto de CCC está pendiente de confirmar con la empresa, por
 * lo que su referencia desde la recolección es opcional.
 */
export const recinto = pgTable(
  'recinto',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    codigo: text('codigo').notNull(), // CCC
    parcelaId: integer('parcela_id')
      .notNull()
      .references(() => parcela.id),
  },
  (t) => [index('recinto_parcela_idx').on(t.parcelaId), unique('recinto_codigo_parcela_uq').on(t.codigo, t.parcelaId)]
)

/** Finca / huerto de origen (texto de la etiqueta interna, p. ej. CANARIO). */
export const finca = pgTable('finca', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  nombre: text('nombre').notNull().unique(),
})

/** Producto comercializado (p. ej. COLIFLOR MORADA). */
export const producto = pgTable('producto', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  nombre: text('nombre').notNull().unique(),
})

/** Categoría comercial del producto (p. ej. CAT I). */
export const categoria = pgTable('categoria', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  nombre: text('nombre').notNull().unique(),
})

/** Proveedor en compras foráneas (origen comprado). */
export const proveedor = pgTable('proveedor', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  nombre: text('nombre').notNull(),
  nif: text('nif'),
})

// ---------------------------------------------------------------------------
// Entrada: recolección (trazabilidad) y palés
// ---------------------------------------------------------------------------

/**
 * Recolección. Equivale a una trazabilidad (relación 1:1).
 *
 * `codigoTrazabilidad` es el identificador propio que genera la aplicación: la
 * etiqueta interna AA-BB-CCC-DDDDDD no sirve como clave única porque DDDDDD es
 * la fecha de recolección y dos recolecciones del mismo recinto el mismo día
 * colisionarían.
 *
 * Origen propio  -> parcela/recinto/finca cumplimentados, proveedor nulo.
 * Origen comprado -> proveedor cumplimentado; la trazabilidad la aporta el
 * productor. Por eso los campos de ubicación son opcionales. Esta regla
 * condicional se valida en la lógica de la aplicación.
 */
export const recoleccion = pgTable(
  'recoleccion',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    codigoTrazabilidad: text('codigo_trazabilidad').notNull().unique(),
    tipo: tipoRecoleccion('tipo').notNull(),
    fechaRecoleccion: date('fecha_recoleccion').notNull(),
    albaran: text('albaran'),
    // Coste interno (propio) o precio de compra pactado (comprado), por kg.
    precioCoste: numeric('precio_coste', { precision: 12, scale: 2 }),
    // Ubicación (origen propio).
    parcelaId: integer('parcela_id').references(() => parcela.id),
    recintoId: integer('recinto_id').references(() => recinto.id),
    fincaId: integer('finca_id').references(() => finca.id),
    // Proveedor (origen comprado).
    proveedorId: integer('proveedor_id').references(() => proveedor.id),
    // Producto y categoría (en ambos tipos de origen).
    productoId: integer('producto_id')
      .notNull()
      .references(() => producto.id),
    categoriaId: integer('categoria_id')
      .notNull()
      .references(() => categoria.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index('recoleccion_producto_idx').on(t.productoId),
    index('recoleccion_proveedor_idx').on(t.proveedorId),
    index('recoleccion_fecha_idx').on(t.fechaRecoleccion),
  ]
)

/**
 * Palé. Una recolección se organiza en varios palés (relación 1:N).
 * Cada palé lleva un código QR único que se escanea para contar las cajas
 * de cosecha. Los kilos y el número de cajas se registran a este nivel; el
 * total de la recolección es la suma de sus palés (calculada por la aplicación).
 */
export const pale = pgTable(
  'pale',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    qr: text('qr').notNull().unique(),
    recoleccionId: integer('recoleccion_id')
      .notNull()
      .references(() => recoleccion.id, { onDelete: 'restrict' }),
    numCajas: integer('num_cajas').notNull().default(0),
    kilos: numeric('kilos', { precision: 10, scale: 2 }).notNull().default('0'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('pale_recoleccion_idx').on(t.recoleccionId)]
)

// ---------------------------------------------------------------------------
// Salida: lote, caja de producto terminado y venta
// ---------------------------------------------------------------------------

/**
 * Lote comercial (datos de la etiqueta externa). Agrupa producto de varias
 * recolecciones del mismo producto y categoría mediante la tabla puente
 * `loteRecoleccion` (relación N:M).
 */
export const lote = pgTable(
  'lote',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    codigo: text('codigo').notNull().unique(), // nº de LOTE (p. ej. 0700018)
    productoId: integer('producto_id')
      .notNull()
      .references(() => producto.id),
    categoriaId: integer('categoria_id')
      .notNull()
      .references(() => categoria.id),
    numPiezas: integer('num_piezas'),
    rgseaa: text('rgseaa'),
    ggn: text('ggn'),
    origen: text('origen'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index('lote_producto_idx').on(t.productoId)]
)

/**
 * Tabla puente N:M entre lote y recolección. `kilos` reparte la recolección
 * entre lotes: son los kilos de esa recolección asignados a este lote. La suma
 * de asignaciones de una recolección no puede superar los kilos de sus palés
 * (se valida al crear el lote); así una misma recolección repartida entre
 * varios lotes no respalda ventas por encima de lo cosechado.
 */
export const loteRecoleccion = pgTable(
  'lote_recoleccion',
  {
    loteId: integer('lote_id')
      .notNull()
      .references(() => lote.id, { onDelete: 'cascade' }),
    recoleccionId: integer('recoleccion_id')
      .notNull()
      .references(() => recoleccion.id, { onDelete: 'restrict' }),
    // El default '0' existe solo para las filas anteriores a la columna; el
    // alta de lote siempre indica los kilos asignados.
    kilos: numeric('kilos', { precision: 10, scale: 2 }).notNull().default('0'),
  },
  (t) => [primaryKey({ columns: [t.loteId, t.recoleccionId] })]
)

/**
 * Caja de producto terminado (etiqueta externa). Pertenece a un lote y procede
 * de un máximo de 2 recolecciones a través de `cajaRecoleccion`. El tope de 2
 * se valida en la lógica de la aplicación (no es expresable con una clave
 * foránea simple).
 */
export const caja = pgTable(
  'caja',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    codigo: text('codigo').unique(),
    loteId: integer('lote_id')
      .notNull()
      .references(() => lote.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('caja_lote_idx').on(t.loteId)]
)

/** Tabla puente N:M entre caja terminada y recolección (máx. 2 por caja). */
export const cajaRecoleccion = pgTable(
  'caja_recoleccion',
  {
    cajaId: integer('caja_id')
      .notNull()
      .references(() => caja.id, { onDelete: 'cascade' }),
    recoleccionId: integer('recoleccion_id')
      .notNull()
      .references(() => recoleccion.id, { onDelete: 'restrict' }),
  },
  (t) => [primaryKey({ columns: [t.cajaId, t.recoleccionId] })]
)

/**
 * Venta de un lote. Los kilos vendidos se registran directamente, por lo que
 * el total se almacena como importe de la operación. La trazabilidad completa
 * se obtiene a través del lote y sus recolecciones asociadas.
 */
export const venta = pgTable(
  'venta',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    loteId: integer('lote_id')
      .notNull()
      .references(() => lote.id),
    fechaVenta: date('fecha_venta').notNull(),
    kilos: numeric('kilos', { precision: 10, scale: 2 }).notNull(),
    precioVenta: numeric('precio_venta', { precision: 12, scale: 2 }).notNull(),
    // Destino de la mercancía, obligatorio: sin destinatario no hay
    // trazabilidad hacia delante (art. 18 Reglamento CE 178/2002).
    cliente: text('cliente').notNull(),
    // Importe de la operación, generado por PostgreSQL a partir de kilos y precio
    // de venta (RF-11). Al ser una columna generada no puede desincronizarse ni
    // insertarse manualmente.
    total: numeric('total', { precision: 14, scale: 2 })
      .notNull()
      .generatedAlwaysAs(sql`kilos * precio_venta`),
    // Anulación (borrado lógico). Una venta anulada deja de contar para el
    // stock del lote pero se conserva como histórico auditable: quién la
    // anuló, cuándo y por qué. No hay borrado físico de ventas.
    anuladaAt: timestamp('anulada_at'),
    anuladaPor: text('anulada_por').references(() => user.id),
    motivoAnulacion: text('motivo_anulacion'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('venta_lote_idx').on(t.loteId)]
)

// ---------------------------------------------------------------------------
// Relaciones (para las consultas relacionales de Drizzle)
// ---------------------------------------------------------------------------

export const puebloRelations = relations(pueblo, ({ many }) => ({
  parcelas: many(parcela),
}))

export const parcelaRelations = relations(parcela, ({ one, many }) => ({
  pueblo: one(pueblo, { fields: [parcela.puebloId], references: [pueblo.id] }),
  recintos: many(recinto),
}))

export const recintoRelations = relations(recinto, ({ one }) => ({
  parcela: one(parcela, { fields: [recinto.parcelaId], references: [parcela.id] }),
}))

export const recoleccionRelations = relations(recoleccion, ({ one, many }) => ({
  parcela: one(parcela, { fields: [recoleccion.parcelaId], references: [parcela.id] }),
  recinto: one(recinto, { fields: [recoleccion.recintoId], references: [recinto.id] }),
  finca: one(finca, { fields: [recoleccion.fincaId], references: [finca.id] }),
  proveedor: one(proveedor, {
    fields: [recoleccion.proveedorId],
    references: [proveedor.id],
  }),
  producto: one(producto, { fields: [recoleccion.productoId], references: [producto.id] }),
  categoria: one(categoria, {
    fields: [recoleccion.categoriaId],
    references: [categoria.id],
  }),
  pales: many(pale),
  lotes: many(loteRecoleccion),
  cajas: many(cajaRecoleccion),
}))

export const paleRelations = relations(pale, ({ one }) => ({
  recoleccion: one(recoleccion, {
    fields: [pale.recoleccionId],
    references: [recoleccion.id],
  }),
}))

export const loteRelations = relations(lote, ({ one, many }) => ({
  producto: one(producto, { fields: [lote.productoId], references: [producto.id] }),
  categoria: one(categoria, { fields: [lote.categoriaId], references: [categoria.id] }),
  recolecciones: many(loteRecoleccion),
  cajas: many(caja),
  ventas: many(venta),
}))

export const loteRecoleccionRelations = relations(loteRecoleccion, ({ one }) => ({
  lote: one(lote, { fields: [loteRecoleccion.loteId], references: [lote.id] }),
  recoleccion: one(recoleccion, {
    fields: [loteRecoleccion.recoleccionId],
    references: [recoleccion.id],
  }),
}))

export const cajaRelations = relations(caja, ({ one, many }) => ({
  lote: one(lote, { fields: [caja.loteId], references: [lote.id] }),
  recolecciones: many(cajaRecoleccion),
}))

export const cajaRecoleccionRelations = relations(cajaRecoleccion, ({ one }) => ({
  caja: one(caja, { fields: [cajaRecoleccion.cajaId], references: [caja.id] }),
  recoleccion: one(recoleccion, {
    fields: [cajaRecoleccion.recoleccionId],
    references: [recoleccion.id],
  }),
}))

export const ventaRelations = relations(venta, ({ one }) => ({
  lote: one(lote, { fields: [venta.loteId], references: [lote.id] }),
}))

// Lados inversos de los catálogos, necesarios para consultar desde ellos
// (p. ej. recolecciones o lotes de un producto en los informes).
export const fincaRelations = relations(finca, ({ many }) => ({
  recolecciones: many(recoleccion),
}))

export const productoRelations = relations(producto, ({ many }) => ({
  recolecciones: many(recoleccion),
  lotes: many(lote),
}))

export const categoriaRelations = relations(categoria, ({ many }) => ({
  recolecciones: many(recoleccion),
  lotes: many(lote),
}))

export const proveedorRelations = relations(proveedor, ({ many }) => ({
  recolecciones: many(recoleccion),
}))
