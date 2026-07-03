import { eq, count } from 'drizzle-orm'
import { db } from '../../database'
import { user } from '../../database/schemas'
import { requireRole } from '../../utils/require-auth'

/** Elimina un usuario (solo oficina). Las sesiones y cuentas asociadas se
 * borran en cascada. No permite eliminar la propia cuenta ni el último usuario
 * de oficina, para no dejar la aplicación sin administración. */
export default defineEventHandler(async (event) => {
  const actual = await requireRole(event, 'oficina')

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID no indicado' })
  }
  if (id === actual.id) {
    throw createError({ statusCode: 400, statusMessage: 'No puedes eliminar tu propia cuenta' })
  }

  const [objetivo] = await db.select({ role: user.role }).from(user).where(eq(user.id, id)).limit(1)
  if (!objetivo) {
    throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado' })
  }

  if (objetivo.role === 'oficina') {
    const [{ n }] = await db.select({ n: count() }).from(user).where(eq(user.role, 'oficina'))
    if (Number(n) <= 1) {
      throw createError({ statusCode: 400, statusMessage: 'No puedes eliminar el último usuario de oficina' })
    }
  }

  await db.delete(user).where(eq(user.id, id))
  return { id }
})
