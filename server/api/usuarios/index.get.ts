import { db } from '../../database'
import { requireRole } from '../../utils/require-auth'

/** Listado de usuarios (solo oficina), sin datos sensibles. */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'oficina')
  return db.query.user.findMany({
    columns: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: (u, { asc }) => asc(u.name),
  })
})
