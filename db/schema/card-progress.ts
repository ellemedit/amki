import {
  integer,
  pgTable,
  real,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { cards } from './cards'

export const cardProgressStatusEnum = ['new', 'learning', 'review'] as const
export type CardProgressStatus = (typeof cardProgressStatusEnum)[number]

export const cardProgress = pgTable('card_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  cardId: uuid('card_id')
    .notNull()
    .unique()
    .references(() => cards.id, { onDelete: 'cascade' }),
  repetitions: integer('repetitions').notNull().default(0),
  easinessFactor: real('easiness_factor').notNull().default(2.5),
  intervalDays: integer('interval_days').notNull().default(0),
  nextReviewDate: timestamp('next_review_date', { withTimezone: true })
    .notNull()
    .defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('new'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type CardProgress = typeof cardProgress.$inferSelect
export type NewCardProgress = typeof cardProgress.$inferInsert
