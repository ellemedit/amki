/**
 * 덱(Deck) 테이블 스키마.
 *
 * 덱은 카드를 그룹으로 묶는 최상위 엔티티입니다.
 * cards 테이블이 deckId FK로 참조하며, cascade delete가 적용됩니다.
 */

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const decks = pgTable("decks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type ReadDeck = typeof decks.$inferSelect;
export type WriteDeck = typeof decks.$inferInsert;
