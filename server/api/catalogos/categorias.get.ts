import { db } from '../../database'
import { categoria } from '../../database/schemas'
import { requireUser } from '../../utils/require-auth'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  return db.select().from(categoria).orderBy(categoria.nombre)
})
