import { defu } from 'defu'

type MiddlewareOptions =
  | false
  | {
      /**
       * Only apply auth middleware to guest or user
       */
      only?: 'guest'
      /**
       * Redirect authenticated user to this route
       */
      redirectUserTo?: string
      /**
       * Redirect guest to this route
       */
      redirectGuestTo?: string
    }

declare module '#app' {
  interface PageMeta {
    auth?: MiddlewareOptions
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    auth?: MiddlewareOptions
  }
}
/**
 * Middleware para autenticación global
 * Por defecto, si no hay meta auth, todas las rutas requieren autenticación
 * Si hay meta auth, se puede especificar si es solo para invitados o para usuarios
 * También se puede especificar a dónde redirigir si está autenticado o no
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // If auth is disabled, skip middleware
  if (to.meta?.auth === false) {
    return
  }

  const { loggedIn, options, fetchSession } = useAuth()

  // If client-side, fetch session between each navigation
  if (import.meta.client) {
    await fetchSession()
  }

  // Con defu se unen las opciones de la meta con las opciones de la configuración
  const { only, redirectUserTo, redirectGuestTo } = defu(to.meta?.auth, options)

  // If guest mode, redirect if authenticated
  if (only === 'guest') {
    if (loggedIn.value) {
      // Avoid infinite redirect
      if (to.path === redirectUserTo) {
        return
      }
      return navigateTo(redirectUserTo)
    }
    // Si es guest y NO está autenticado, permitir acceso
    return
  }

  // If user mode (or default), redirect if not authenticated
  if (!only) {
    if (!loggedIn.value) {
      // Avoid infinite redirect
      if (to.path === redirectGuestTo) {
        return
      }
      return navigateTo(redirectGuestTo)
    }
  }
})
