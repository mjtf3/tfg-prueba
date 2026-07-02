import { db } from '../../database'
import { finca } from '../../database/schemas'
import { requireUser } from '../../utils/require-auth'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  return db.select().from(finca).orderBy(finca.nombre)
})
