import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../database/index'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    // El registro público está deshabilitado: las cuentas las crea el rol oficina.
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      role: {
        type: ['oficina', 'operario'],
        required: false,
        defaultValue: 'operario',
        input: false, // el rol lo asigna la oficina al crear el usuario
      },
    },
  },
})
