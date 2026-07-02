import { db } from '../../database'
import { producto } from '../../database/schemas'
import { requireUser } from '../../utils/require-auth'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  return db.select().from(producto).orderBy(producto.nombre)
})
