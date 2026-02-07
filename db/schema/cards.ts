import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { decks } from './decks'

export const cardTypeEnum = ['basic', 'subjective'] as const
export type CardType = (typeof cardTypeEnum)[number]

export const cards = pgTable('cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  deckId: uuid('deck_id')
    .notNull()
    .references(() => decks.id, { onDelete: 'cascade' }),
  front: text('front').notNull(),
  back: text('back').notNull(),
  type: varchar('type', { length: 20 }).notNull().default('basic'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type Card = typeof cards.$inferSelect
export type NewCard = typeof cards.$inferInsert
