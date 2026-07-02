import { eq } from 'drizzle-orm'
import { db } from '../../database'
import { parcela } from '../../database/schemas'
import { requireUser } from '../../utils/require-auth'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const { puebloId } = getQuery(event)
  if (puebloId) {
    return db.select().from(parcela).where(eq(parcela.puebloId, Number(puebloId))).orderBy(parcela.codigo)
  }
  return db.select().from(parcela).orderBy(parcela.codigo)
})
