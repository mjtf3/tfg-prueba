export default defineNuxtPlugin(async () => {
  const { fetchSession } = useAuth()

  // Cargar la sesión inicial una sola vez
  await callOnce(fetchSession)
})
