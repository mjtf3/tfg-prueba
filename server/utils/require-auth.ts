import { createError, type H3Event } from 'h3'
import { auth } from './auth'

/** Roles disponibles en el control de acceso. */
export type Role = 'oficina' | 'operario'

/**
 * Devuelve el usuario de la sesión actual o lanza 401 si no hay sesión.
 * La sesión se resuelve con better-auth a partir de las cabeceras de la petición.
 */
export async function requireUser(event: H3Event) {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }
  return session.user
}

/**
 * Exige que el usuario autenticado tenga uno de los roles indicados.
 * Lanza 401 si no hay sesión y 403 si el rol no está autorizado.
 *
 * Mapa de acceso: `oficina` gestiona compras, lotes, ventas e informes (RF-09);
 * `operario` accede al escaneo y conteo (RF-10). La consulta de trazabilidad la
 * comparten ambos roles.
 */
export async function requireRole(event: H3Event, ...roles: Role[]) {
  const user = await requireUser(event)
  if (!roles.includes(user.role as Role)) {
    throw createError({ statusCode: 403, statusMessage: 'Acceso denegado' })
  }
  return user
}
