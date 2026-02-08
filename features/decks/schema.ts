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
