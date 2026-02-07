import { cache } from "react";
import { cacheTag } from "next/cache";
import { connection } from "next/server";
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
 * 전체 덱 목록 + 카드 수 (시간 무관 — cross-request cache)
 */
export async function getDecksWithCardCounts() {
  "use cache";
  cacheTag("decks");

  const allDecks = await db.select().from(decks).orderBy(decks.createdAt);

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

      return {
        ...deck,
        totalCards: cardCount?.count ?? 0,
        newCards: (cardCount?.count ?? 0) - (withProgress?.count ?? 0),
      };
    }),
  );

  return result;
}

/**
 * 덱별 복습 대기 카드 수 (시간 의존적 — 항상 동적 실행)
 */
export async function getDueCount(deckId: string) {
  await connection();

  const [dueCount] = await db
    .select({ count: count() })
    .from(cardProgress)
    .innerJoin(cards, eq(cards.id, cardProgress.cardId))
    .where(
      and(
        eq(cards.deckId, deckId),
        lte(cardProgress.nextReviewDate, new Date()),
      ),
    );

  const [totalCards] = await db
    .select({ count: count() })
    .from(cards)
    .where(eq(cards.deckId, deckId));

  const [withProgress] = await db
    .select({ count: count() })
    .from(cardProgress)
    .innerJoin(cards, eq(cards.id, cardProgress.cardId))
    .where(eq(cards.deckId, deckId));

  const newCards = (totalCards?.count ?? 0) - (withProgress?.count ?? 0);

  return (dueCount?.count ?? 0) + newCards;
}
