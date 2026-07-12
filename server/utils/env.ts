import { z } from 'zod'

import tryParseEnv from '../lib/try-parse-env'

// Polyfill para Vercel (Preview & Producción)
// Si no hay BETTER_AUTH_URL pero existe VERCEL_URL, la construimos automáticamente.
if (!process.env.BETTER_AUTH_URL && process.env.VERCEL_URL) {
  const finalUrl = `https://${process.env.VERCEL_URL}`
  console.debug('Building BETTER_AUTH_URL from VERCEL_URL:', finalUrl)
  process.env.BETTER_AUTH_URL = finalUrl
}

const EnvSchema = z.object({
  NODE_ENV: z.string().nonempty(),
  DATABASE_URL: z.string().nonempty(),
  BETTER_AUTH_SECRET: z.string().nonempty(),
  BETTER_AUTH_URL: z.string().nonempty(),
  // Datos regulatorios fijos de la empresa para la etiqueta externa de los
  // lotes (RGSEAA sanitario y GGN de GlobalG.A.P.). Opcionales: si no están,
  // el lote se crea sin ellos y pueden indicarse manualmente al darlo de alta.
  EMPRESA_RGSEAA: z.string().optional(),
  EMPRESA_GGN: z.string().optional(),
})

export type EnvSchema = z.infer<typeof EnvSchema>

tryParseEnv(EnvSchema)

// eslint-disable-next-line node/no-process-env
export default EnvSchema.parse(process.env)
