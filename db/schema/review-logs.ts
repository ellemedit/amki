import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { cards } from './cards'

export const reviewLogs = pgTable('review_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  cardId: uuid('card_id')
    .notNull()
    .references(() => cards.id, { onDelete: 'cascade' }),
  quality: integer('quality').notNull(),
  userAnswer: text('user_answer'),
  aiFeedback: text('ai_feedback'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type ReviewLog = typeof reviewLogs.$inferSelect
export type NewReviewLog = typeof reviewLogs.$inferInsert
