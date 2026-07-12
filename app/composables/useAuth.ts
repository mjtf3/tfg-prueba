/// Ejemplo sacado de la template nuxthub-better-auth https://github.com/atinux/nuxthub-better-auth
import { createAuthClient } from 'better-auth/client'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import type { InferSessionFromClient, InferUserFromClient, BetterAuthClientOptions } from 'better-auth/client'
import type { RouteLocationRaw } from 'vue-router'

type SessionData =
  | {
      session: InferSessionFromClient<BetterAuthClientOptions>
      user: InferUserFromClient<BetterAuthClientOptions>
    }
  | null
  | undefined

// Variable a nivel de módulo (no dentro de useAuth) para que TODAS las llamadas a fetchSession
// en el cliente compartan la misma petición en curso: si ya hay un fetch en vuelo, quien llega
// después espera su resultado en vez de recibir la sesión aún vacía (evita la condición de
// carrera con el listener de $sessionSignal y el middleware de auth tras el login).
// Solo se usa en cliente: en servidor una variable de módulo sería común a peticiones
// concurrentes de usuarios distintos dentro del mismo proceso Nitro.
let sessionPromise: Promise<SessionData> | null = null

export function useAuth() {
  const url = useRequestURL()
  const headers = import.meta.server ? useRequestHeaders() : undefined

  const client = createAuthClient({
    baseURL: url.origin,
    fetchOptions: {
      headers,
    },
    // Expone el campo `role` (additionalFields del servidor) en la sesión del cliente.
    plugins: [inferAdditionalFields({ user: { role: { type: 'string' } } })],
  })

  const options = { redirectUserTo: '/dashboard', redirectGuestTo: '/login' }
  const session = useState<InferSessionFromClient<BetterAuthClientOptions> | null>('auth:session', () => null)
  const user = useState<InferUserFromClient<BetterAuthClientOptions> | null>('auth:user', () => null)

  const fetchSession = () => {
    const consultar = async (): Promise<SessionData> => {
      const { data } = await client.getSession({
        fetchOptions: {
          headers,
        },
      })
      session.value = data?.session || null
      user.value = data?.user || null
      return data
    }

    // En servidor no se comparte la promesa: cada petición hace su propio fetch.
    if (import.meta.server) return consultar()

    // Si ya hay una petición en vuelo, se devuelve la misma promesa en lugar de lanzar otra:
    // así los que llegan tarde esperan el resultado real en vez de saltárselo. Se limpia
    // siempre (también en error) para no dejar el estado de auth congelado.
    if (!sessionPromise) {
      sessionPromise = consultar().finally(() => {
        sessionPromise = null
      })
    }
    return sessionPromise
  }

  if (import.meta.client) {
    client.$store.listen('$sessionSignal', async (signal) => {
      if (!signal) return
      await fetchSession()
    })
  }

  return {
    session,
    user,
    loggedIn: computed(() => !!session.value),
    signIn: client.signIn,
    async signOut({ redirectTo }: { redirectTo?: RouteLocationRaw } = {}) {
      const res = await client.signOut()
      session.value = null
      user.value = null
      if (redirectTo) {
        await navigateTo(redirectTo)
      }
      return res
    },
    options,
    fetchSession,
    client,
  }
}
