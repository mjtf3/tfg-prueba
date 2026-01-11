import { createAuthClient } from 'better-auth/vue'

// Cliente singleton (se crea una sola vez)
let authClient: ReturnType<typeof createAuthClient> | null = null

function getAuthClient() {
  if (!authClient) {
    const config = useRuntimeConfig()
    authClient = createAuthClient({
      baseURL: config.public.authBaseUrl as string,
    })
  }
  return authClient
}

// Composable principal
export function useAuth() {
  const client = getAuthClient()

  const githubSignIn = () => {
    client.signIn.social({ provider: 'github', callbackURL: '/login' })
  }

  return {
    session: client.useSession(),
    signOut: client.signOut,
    signUp: client.signUp,
    githubSignIn,
  }
}
