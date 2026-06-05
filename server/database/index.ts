import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schemas/index'

export const db = drizzle({
  connection: {
    connectionString: env.DATABASE_URL,
  },
  schema,
})
