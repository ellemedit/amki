import {
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { cards } from "@/features/cards/schema";

// --- Card Progress ---

export const cardProgressStatusEnum = ["new", "learning", "review"] as const;
export type CardProgressStatus = (typeof cardProgressStatusEnum)[number];

export const cardProgress = pgTable("card_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardId: uuid("card_id")
    .notNull()
    .unique()
    .references(() => cards.id, { onDelete: "cascade" }),
  repetitions: integer("repetitions").notNull().default(0),
  easinessFactor: real("easiness_factor").notNull().default(2.5),
  intervalDays: integer("interval_days").notNull().default(0),
  nextReviewDate: timestamp("next_review_date", { withTimezone: true })
    .notNull()
    .defaultNow(),
  status: varchar("status", { length: 20 }).notNull().default("new"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type ReadCardProgress = typeof cardProgress.$inferSelect;
export type WriteCardProgress = typeof cardProgress.$inferInsert;

// --- Review Logs ---

export const reviewLogs = pgTable("review_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardId: uuid("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  quality: integer("quality").notNull(),
  userAnswer: text("user_answer"),
  aiFeedback: text("ai_feedback"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ReadReviewLog = typeof reviewLogs.$inferSelect;
export type WriteReviewLog = typeof reviewLogs.$inferInsert;
