import { drizzle } from 'drizzle-orm/bun-sql'
// import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schemas/index'

// You can specify any property from the bun sql connection options
// export const db = drizzle({
//   connection: {
//     connectionString: process.env.DATABASE_URL!,
//     ssl: false,
//   },
//   schema,
// })

export const db = drizzle({
  connection: env.DATABASE_URL,
  schema,
})
