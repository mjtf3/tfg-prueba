import { db } from '../../database'
import { proveedor } from '../../database/schemas'
import { requireUser } from '../../utils/require-auth'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  return db.select().from(proveedor).orderBy(proveedor.nombre)
})
