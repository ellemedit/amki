import { cache } from "react";
import { cacheTag } from "next/cache";
import { db } from "@/db";
import { decks } from "./schema";
import { cards } from "@/features/cards/schema";
import { cardProgress } from "@/features/study/schema";
import { eq, lte, and, count } from "drizzle-orm";

/**
 * 덱 단건 조회 (request-scoped dedup + cross-request cache)
 */
export const getDeck = cache(async (deckId: string) => {
  "use cache";
  cacheTag(`deck-${deckId}`);

  const [deck] = await db
    .select()
    .from(decks)
    .where(eq(decks.id, deckId))
    .limit(1);

  return deck ?? null;
});

/**
 * 전체 덱 목록 + 통계 (cross-request cache)
 */
export async function getDecksWithStats() {
  "use cache";
  cacheTag("decks");

  const allDecks = await db.select().from(decks).orderBy(decks.createdAt);

  const stats = await Promise.all(
    allDecks.map(async (deck) => {
      const [cardCount] = await db
        .select({ count: count() })
        .from(cards)
        .where(eq(cards.deckId, deck.id));

      const [dueCount] = await db
        .select({ count: count() })
        .from(cardProgress)
        .innerJoin(cards, eq(cards.id, cardProgress.cardId))
        .where(
          and(
            eq(cards.deckId, deck.id),
            lte(cardProgress.nextReviewDate, new Date()),
          ),
        );

      const [withProgress] = await db
        .select({ count: count() })
        .from(cardProgress)
        .innerJoin(cards, eq(cards.id, cardProgress.cardId))
        .where(eq(cards.deckId, deck.id));

      const newCards = (cardCount?.count ?? 0) - (withProgress?.count ?? 0);

      return {
        ...deck,
        totalCards: cardCount?.count ?? 0,
        dueCards: (dueCount?.count ?? 0) + newCards,
        newCards,
      };
    }),
  );

  return stats;
}
