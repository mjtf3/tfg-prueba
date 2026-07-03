import { auth } from './auth'

export type Rol = 'oficina' | 'operario'

/**
 * Crea un usuario con credenciales (correo y contraseña) y un rol, reutilizando
 * el contexto de better-auth para el hash de la contraseña y el adaptador de
 * datos. Se usa tanto en el alta desde la oficina como en el seed inicial, ya
 * que el registro público está deshabilitado y `signUpEmail` no está disponible.
 */
export async function crearUsuario({
  name,
  email,
  password,
  role,
}: {
  name: string
  email: string
  password: string
  role: Rol
}) {
  const ctx = await auth.$context
  const user = await ctx.internalAdapter.createUser({
    email: email.toLowerCase(),
    name,
    role,
  })
  const hashed = await ctx.password.hash(password)
  await ctx.internalAdapter.linkAccount({
    accountId: user.id,
    providerId: 'credential',
    password: hashed,
    userId: user.id,
  })
  return user
}
