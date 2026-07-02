import { db } from '../../database'
import { pueblo } from '../../database/schemas'
import { requireUser } from '../../utils/require-auth'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  return db.select().from(pueblo).orderBy(pueblo.nombre)
})
