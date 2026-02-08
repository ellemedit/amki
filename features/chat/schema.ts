import { pgTable, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { decks } from "@/features/decks/schema";

export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  deckId: uuid("deck_id")
    .notNull()
    .references(() => decks.id, { onDelete: "cascade" }),
  messages: jsonb("messages").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type ReadChatSession = typeof chatSessions.$inferSelect;
export type WriteChatSession = typeof chatSessions.$inferInsert;
