import process from 'node:process'
import { eq } from 'drizzle-orm'
import { db } from './index'
import { auth } from '../utils/auth'
import { pueblo, parcela, recinto, finca, producto, categoria, proveedor, user } from './schemas/index'

/**
 * Seed de desarrollo: puebla los catálogos (datos maestros) con datos de ejemplo
 * y crea un usuario inicial con rol `oficina` para poder operar la aplicación.
 *
 * Es necesario porque el registro de better-auth crea siempre usuarios `operario`
 * (`role.input = false`), por lo que no habría forma de obtener el primer `oficina`.
 *
 * Ejecutar con: `pnpm db:seed` (arranca antes la BD con docker compose).
 */

// Credenciales del usuario de arranque. Se pueden sobrescribir por entorno
// (p. ej. en staging) sin tocar el código; los valores por defecto son solo
// para el desarrollo local.
const OFICINA = {
  email: process.env.SEED_OFICINA_EMAIL ?? 'oficina@agropaco.local',
  password: process.env.SEED_OFICINA_PASSWORD ?? 'agropaco123',
  name: process.env.SEED_OFICINA_NAME ?? 'Oficina Agropaco',
}

async function seedCatalogos() {
  // Idempotencia: si ya hay parcelas, se asume que los catálogos están cargados.
  const yaHayDatos = (await db.select({ id: parcela.id }).from(parcela).limit(1)).length > 0
  if (yaHayDatos) {
    console.log('Catálogos ya poblados, se omiten.')
    return
  }

  console.log('Poblando catálogos...')

  // Transacción: si algo falla a mitad, se revierte todo y el seed sigue siendo
  // re-ejecutable (el guard de arriba volverá a ver las tablas vacías).
  await db.transaction(async (tx) => {
    await tx.insert(pueblo).values([
      { codigo: '01', nombre: 'Villena' },
      { codigo: '02', nombre: 'Sax' },
    ])
    const pueblos = await tx.select().from(pueblo)
    const puebloId = (codigo: string) => pueblos.find((p) => p.codigo === codigo)!.id

    await tx.insert(parcela).values([
      { codigo: '10', nombre: 'La Vega', puebloId: puebloId('01') },
      { codigo: '11', nombre: 'El Llano', puebloId: puebloId('01') },
      { codigo: '20', nombre: 'Camino Alto', puebloId: puebloId('02') },
    ])
    const parcelas = await tx.select().from(parcela)
    const parcelaId = (codigo: string) => parcelas.find((p) => p.codigo === codigo)!.id

    await tx.insert(recinto).values([
      { codigo: '100', parcelaId: parcelaId('10') },
      { codigo: '101', parcelaId: parcelaId('10') },
      { codigo: '110', parcelaId: parcelaId('11') },
    ])

    await tx.insert(finca).values([{ nombre: 'CANARIO' }, { nombre: 'EL PRADO' }])

    await tx
      .insert(producto)
      .values([{ nombre: 'COLIFLOR MORADA' }, { nombre: 'BRÓCOLI' }, { nombre: 'ALCACHOFA' }])

    await tx.insert(categoria).values([{ nombre: 'CAT I' }, { nombre: 'CAT II' }])

    await tx.insert(proveedor).values([
      { nombre: 'Hortícolas del Sur', nif: 'B12345678' },
      { nombre: 'Cooperativa Vecina', nif: 'F87654321' },
    ])
  })

  console.log('Catálogos poblados.')
}

async function seedOficina() {
  const [existente] = await db.select().from(user).where(eq(user.email, OFICINA.email)).limit(1)

  if (!existente) {
    console.log(`Creando usuario ${OFICINA.email}...`)
    await auth.api.signUpEmail({
      body: { email: OFICINA.email, password: OFICINA.password, name: OFICINA.name },
    })
  }

  // El rol no se puede fijar en el registro (input:false), se promociona aquí.
  await db.update(user).set({ role: 'oficina' }).where(eq(user.email, OFICINA.email))
  console.log(`Usuario ${OFICINA.email} con rol oficina listo.`)
}

async function main() {
  await seedCatalogos()
  await seedOficina()
}

main()
  .then(() => {
    console.log('Seed completado.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error en el seed:', error)
    process.exit(1)
  })
