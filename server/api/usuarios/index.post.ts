import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../database'
import { user } from '../../database/schemas'
import { requireRole } from '../../utils/require-auth'
import { crearUsuario } from '../../utils/crear-usuario'

const bodySchema = z.object({
  name: z.string().min(1),
  email: z.email('Correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum(['oficina', 'operario']),
})

/** Alta de un usuario por parte de la oficina, indicando su rol. Sustituye al
 * registro público, que está deshabilitado. */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'oficina')

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Datos de usuario inválidos', data: parsed.error.flatten() })
  }
  const { name, password, role } = parsed.data
  const email = parsed.data.email.toLowerCase()

  const [existe] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1)
  if (existe) {
    throw createError({ statusCode: 400, statusMessage: 'Ya existe un usuario con ese correo' })
  }

  const creado = await crearUsuario({ name, email, password, role })
  setResponseStatus(event, 201)
  return { id: creado.id, name: creado.name, email: creado.email, role }
})
