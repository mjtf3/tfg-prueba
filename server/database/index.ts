import { drizzle } from 'drizzle-orm/node-postgres'
import env from '../utils/env'
import * as schema from './schemas/index'

export const db = drizzle({
  connection: {
    connectionString: env.DATABASE_URL,
  },
  schema,
})
