import { integer, pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'

export const postsTable = pgTable('posts', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  content: text(),
  authorId: integer().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
})
