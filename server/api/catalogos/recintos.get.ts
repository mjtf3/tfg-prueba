import { eq } from 'drizzle-orm'
import { db } from '../../database'
import { recinto } from '../../database/schemas'
import { requireUser } from '../../utils/require-auth'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const { parcelaId } = getQuery(event)
  if (parcelaId) {
    return db.select().from(recinto).where(eq(recinto.parcelaId, Number(parcelaId))).orderBy(recinto.codigo)
  }
  return db.select().from(recinto).orderBy(recinto.codigo)
})
