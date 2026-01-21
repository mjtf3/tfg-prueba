import { z } from 'zod'

import tryParseEnv from '../lib/try-parse-env'

// Polyfill para Vercel (Preview & Producción)
// Si no hay BETTER_AUTH_URL pero existe VERCEL_URL, la construimos automáticamente.
if (!process.env.BETTER_AUTH_URL && process.env.VERCEL_URL) {
  const finalUrl = `https://${process.env.VERCEL_URL}`
  console.log('Building BETTER_AUTH_URL from VERCEL_URL:', finalUrl)
  process.env.BETTER_AUTH_URL = finalUrl
}

const EnvSchema = z.object({
  NODE_ENV: z.string().nonempty(),
  DATABASE_URL: z.string().nonempty(),
  BETTER_AUTH_SECRET: z.string().nonempty(),
  BETTER_AUTH_URL: z.string().nonempty(),
  GITHUB_CLIENT_ID: z.string().nonempty(),
  GITHUB_CLIENT_SECRET: z.string().nonempty(),
  GOOGLE_CLIENT_ID: z.string().nonempty(),
  GOOGLE_CLIENT_SECRET: z.string().nonempty(),
})

export type EnvSchema = z.infer<typeof EnvSchema>

tryParseEnv(EnvSchema)

// eslint-disable-next-line node/no-process-env
export default EnvSchema.parse(process.env)
