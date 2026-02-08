/**
 * 카드(Card) 테이블 스키마.
 *
 * 각 카드는 하나의 덱에 속하며, 앞면(질문)/뒷면(답) 쌍으로 구성됩니다.
 * - basic: 사용자가 스스로 평가하는 기본 카드
 * - subjective: AI가 서술형 답안을 채점하는 카드
 *
 * 학습 진행도는 study/schema.ts의 cardProgress 테이블에서 관리됩니다.
 */

import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { decks } from "@/features/decks/schema";

export const cardTypeEnum = ["basic", "subjective"] as const;
export type CardType = (typeof cardTypeEnum)[number];

export const cards = pgTable("cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  deckId: uuid("deck_id")
    .notNull()
    .references(() => decks.id, { onDelete: "cascade" }),
  front: text("front").notNull(),
  back: text("back").notNull(),
  type: varchar("type", { length: 20 }).notNull().default("basic"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type ReadCard = typeof cards.$inferSelect;
export type WriteCard = typeof cards.$inferInsert;
