/**
 * 학습 카드 쿼리 및 캐싱.
 *
 * 복습 예정(due) 카드와 미학습(new) 카드를 합산하여 셔플된 학습 세트를 반환합니다.
 * 캐싱 전략은 cards/queries, decks/queries와 동일합니다.
 */

import { db } from "@/db";
import { cards } from "@/features/cards/schema";
import { cardProgress } from "./schema";
import { eq, lte, and, inArray } from "drizzle-orm";
import { cacheTag, revalidateTag, updateTag } from "next/cache";

export interface StudyCard {
  id: string;
  front: string;
  back: string;
  type: string;
  progress: {
    repetitions: number;
    easinessFactor: number;
    intervalDays: number;
    status: string;
  } | null;
}

function getStudyCardsCacheKey(deckId: string) {
  return `study-cards-${deckId}` as const;
}

/** Server Action / Server Component에서 사용. 동기적으로 학습 카드 캐시를 무효화합니다. */
export function updateStudyCardsCache(deckId: string) {
  updateTag(getStudyCardsCacheKey(deckId));
}

/** Route Handler에서 사용. 비동기적으로 학습 카드 캐시를 재검증합니다. */
export function revalidateStudyCardsCache(deckId: string) {
  revalidateTag(getStudyCardsCacheKey(deckId), "max");
}

/**
 * 학습 대상 카드 조회
 */
export async function getStudyCards(deckId: string): Promise<StudyCard[]> {
  "use cache";
  cacheTag(getStudyCardsCacheKey(deckId));

  const now = new Date();

  // Cards with progress that are due
  const dueCards = await db
    .select({
      id: cards.id,
      front: cards.front,
      back: cards.back,
      type: cards.type,
      repetitions: cardProgress.repetitions,
      easinessFactor: cardProgress.easinessFactor,
      intervalDays: cardProgress.intervalDays,
      status: cardProgress.status,
    })
    .from(cards)
    .innerJoin(cardProgress, eq(cards.id, cardProgress.cardId))
    .where(
      and(eq(cards.deckId, deckId), lte(cardProgress.nextReviewDate, now)),
    );

  // New cards (no progress record)
  const allCards = await db
    .select({ id: cards.id })
    .from(cards)
    .where(eq(cards.deckId, deckId));

  const cardsWithProgressIds = await db
    .select({ cardId: cardProgress.cardId })
    .from(cardProgress)
    .innerJoin(cards, eq(cards.id, cardProgress.cardId))
    .where(eq(cards.deckId, deckId));

  const progressSet = new Set(cardsWithProgressIds.map((c) => c.cardId));
  const newCardIds = allCards
    .filter((c) => !progressSet.has(c.id))
    .map((c) => c.id);

  let newCards: StudyCard[] = [];
  if (newCardIds.length > 0) {
    const newCardData = await db
      .select()
      .from(cards)
      .where(and(eq(cards.deckId, deckId), inArray(cards.id, newCardIds)));
    newCards = newCardData.map((c) => ({
      id: c.id,
      front: c.front,
      back: c.back,
      type: c.type,
      progress: null,
    }));
  }

  const dueStudyCards: StudyCard[] = dueCards.map((c) => ({
    id: c.id,
    front: c.front,
    back: c.back,
    type: c.type,
    progress: {
      repetitions: c.repetitions,
      easinessFactor: c.easinessFactor,
      intervalDays: c.intervalDays,
      status: c.status,
    },
  }));

  return [...shuffleArray(newCards), ...shuffleArray(dueStudyCards)];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
