import { eq } from 'drizzle-orm'
import { db } from '../../database'
import { parcela } from '../../database/schemas'
import { requireUser } from '../../utils/require-auth'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const { puebloId } = getQuery(event)
  if (puebloId) {
    const id = Number(puebloId)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'puebloId inválido' })
    }
    return db.select().from(parcela).where(eq(parcela.puebloId, id)).orderBy(parcela.codigo)
  }
  return db.select().from(parcela).orderBy(parcela.codigo)
})
