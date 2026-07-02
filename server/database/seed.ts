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

const OFICINA = {
  email: 'oficina@agropaco.local',
  password: 'agropaco123',
  name: 'Oficina Agropaco',
}

async function seedCatalogos() {
  // Idempotencia: si ya hay parcelas, se asume que los catálogos están cargados.
  const yaHayDatos = (await db.select({ id: parcela.id }).from(parcela).limit(1)).length > 0
  if (yaHayDatos) {
    console.log('Catálogos ya poblados, se omiten.')
    return
  }

  console.log('Poblando catálogos...')

  await db
    .insert(pueblo)
    .values([
      { codigo: '01', nombre: 'Villena' },
      { codigo: '02', nombre: 'Sax' },
    ])
    .onConflictDoNothing()
  const pueblos = await db.select().from(pueblo)
  const puebloId = (codigo: string) => pueblos.find((p) => p.codigo === codigo)!.id

  await db.insert(parcela).values([
    { codigo: '10', nombre: 'La Vega', puebloId: puebloId('01') },
    { codigo: '11', nombre: 'El Llano', puebloId: puebloId('01') },
    { codigo: '20', nombre: 'Camino Alto', puebloId: puebloId('02') },
  ])
  const parcelas = await db.select().from(parcela)
  const parcelaId = (codigo: string) => parcelas.find((p) => p.codigo === codigo)!.id

  await db.insert(recinto).values([
    { codigo: '100', parcelaId: parcelaId('10') },
    { codigo: '101', parcelaId: parcelaId('10') },
    { codigo: '110', parcelaId: parcelaId('11') },
  ])

  await db
    .insert(finca)
    .values([{ nombre: 'CANARIO' }, { nombre: 'EL PRADO' }])
    .onConflictDoNothing()

  await db
    .insert(producto)
    .values([{ nombre: 'COLIFLOR MORADA' }, { nombre: 'BRÓCOLI' }, { nombre: 'ALCACHOFA' }])
    .onConflictDoNothing()

  await db
    .insert(categoria)
    .values([{ nombre: 'CAT I' }, { nombre: 'CAT II' }])
    .onConflictDoNothing()

  await db.insert(proveedor).values([
    { nombre: 'Hortícolas del Sur', nif: 'B12345678' },
    { nombre: 'Cooperativa Vecina', nif: 'F87654321' },
  ])

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
  console.log(`Usuario ${OFICINA.email} con rol oficina (contraseña: ${OFICINA.password}).`)
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
