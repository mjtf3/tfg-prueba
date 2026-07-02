/**
 * Middleware de página que restringe el acceso al rol `oficina`.
 * La seguridad real vive en el servidor (`requireRole`); esto es solo UX: evita
 * mostrar pantallas de oficina a un operario y lo devuelve al dashboard.
 */
export default defineNuxtRouteMiddleware(async () => {
  const { user, fetchSession } = useAuth()
  if (!user.value) {
    await fetchSession()
  }
  if (user.value?.role !== 'oficina') {
    return navigateTo('/dashboard')
  }
})
