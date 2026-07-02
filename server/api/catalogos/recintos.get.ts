import { eq } from 'drizzle-orm'
import { db } from '../../database'
import { recinto } from '../../database/schemas'
import { requireUser } from '../../utils/require-auth'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const { parcelaId } = getQuery(event)
  if (parcelaId) {
    const id = Number(parcelaId)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'parcelaId inválido' })
    }
    return db.select().from(recinto).where(eq(recinto.parcelaId, id)).orderBy(recinto.codigo)
  }
  return db.select().from(recinto).orderBy(recinto.codigo)
})
