/**
 * 캐싱 전략:
 * - updateTag: Server Action / Server Component에서 동기적 무효화
 * - revalidateTag: Route Handler에서 비동기적 재검증
 */

import { cacheTag, revalidateTag, updateTag } from "next/cache";
import { db } from "@/drizzle/db";
import { cards } from "./schema";
import { cardProgress } from "@/features/study/schema";
import { eq } from "drizzle-orm";

function getCardsCacheKey(deckId: string) {
  return `cards-${deckId}` as const;
}

export function updateCardsCache(deckId: string) {
  updateTag(getCardsCacheKey(deckId));
}

export function revalidateCardsCache(deckId: string) {
  revalidateTag(getCardsCacheKey(deckId), "max");
}

export const getCardsWithProgress = async (deckId: string) => {
  "use cache";
  cacheTag(getCardsCacheKey(deckId));

  const deckCards = await db
    .select()
    .from(cards)
    .where(eq(cards.deckId, deckId))
    .orderBy(cards.createdAt);

  const withProgress = await Promise.all(
    deckCards.map(async (card) => {
      const [progress] = await db
        .select()
        .from(cardProgress)
        .where(eq(cardProgress.cardId, card.id))
        .limit(1);
      return { ...card, progress: progress ?? null };
    }),
  );

  return withProgress;
};
