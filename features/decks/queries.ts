import { cacheTag, revalidateTag, updateTag } from "next/cache";
import { db } from "@/db";
import { decks } from "./schema";
import { cards } from "@/features/cards/schema";
import { cardProgress } from "@/features/study/schema";
import { eq, lte, and, count, desc } from "drizzle-orm";

function getDeckCacheKey(deckId: string) {
  return `deck-${deckId}` as const;
}
function getDecksCacheKey() {
  return "decks" as const;
}

export function updateDeckCache(deckId: string) {
  updateTag(getDeckCacheKey(deckId));
}
export function revalidateDeckCache(deckId: string) {
  revalidateTag(getDeckCacheKey(deckId), "max");
}

export function updateDecksCache() {
  updateTag(getDecksCacheKey());
}
export function revalidateDecksCache() {
  revalidateTag(getDecksCacheKey(), "max");
}

/**
 * 덱 단건 조회 (request-scoped dedup + cross-request cache)
 */
export const getDeck = async (deckId: string) => {
  "use cache";
  cacheTag(getDeckCacheKey(deckId));

  const [deck] = await db
    .select()
    .from(decks)
    .where(eq(decks.id, deckId))
    .limit(1);

  return deck ?? null;
};

/**
 * 전체 덱 목록 + 카드 수 (시간 무관 — cross-request cache)
 */
export async function getDecksWithCardCounts() {
  "use cache";
  cacheTag(getDecksCacheKey());

  const allDecks = await db.select().from(decks).orderBy(desc(decks.createdAt));

  const result = await Promise.all(
    allDecks.map(async (deck) => {
      const [cardCount] = await db
        .select({ count: count() })
        .from(cards)
        .where(eq(cards.deckId, deck.id));

      const [withProgress] = await db
        .select({ count: count() })
        .from(cardProgress)
        .innerJoin(cards, eq(cards.id, cardProgress.cardId))
        .where(eq(cards.deckId, deck.id));

      const [dueReview] = await db
        .select({ count: count() })
        .from(cardProgress)
        .innerJoin(cards, eq(cards.id, cardProgress.cardId))
        .where(
          and(
            eq(cards.deckId, deck.id),
            lte(cardProgress.nextReviewDate, new Date()),
          ),
        );

      const totalCards = cardCount?.count ?? 0;
      const newCards = totalCards - (withProgress?.count ?? 0);
      const dueCount = (dueReview?.count ?? 0) + newCards;

      return {
        ...deck,
        totalCards,
        newCards,
        dueCount,
      };
    }),
  );

  return result;
}
