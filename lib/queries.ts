import { cacheTag } from 'next/cache'
import { db } from '@/db'
import { decks, cards, cardProgress } from '@/db/schema'
import { eq, lte, and, count } from 'drizzle-orm'

/**
 * 전체 덱 목록 + 통계 (캐시됨)
 * - cacheTag('decks'): 덱 생성/삭제 시 무효화
 */
export async function getDecksWithStats() {
  'use cache'
  cacheTag('decks')

  const allDecks = await db.select().from(decks).orderBy(decks.createdAt)

  const stats = await Promise.all(
    allDecks.map(async (deck) => {
      const [cardCount] = await db
        .select({ count: count() })
        .from(cards)
        .where(eq(cards.deckId, deck.id))

      const [dueCount] = await db
        .select({ count: count() })
        .from(cardProgress)
        .innerJoin(cards, eq(cards.id, cardProgress.cardId))
        .where(
          and(
            eq(cards.deckId, deck.id),
            lte(cardProgress.nextReviewDate, new Date()),
          ),
        )

      const [withProgress] = await db
        .select({ count: count() })
        .from(cardProgress)
        .innerJoin(cards, eq(cards.id, cardProgress.cardId))
        .where(eq(cards.deckId, deck.id))

      const newCards = (cardCount?.count ?? 0) - (withProgress?.count ?? 0)

      return {
        ...deck,
        totalCards: cardCount?.count ?? 0,
        dueCards: (dueCount?.count ?? 0) + newCards,
        newCards,
      }
    }),
  )

  return stats
}

/**
 * 덱 상세 + 카드 목록 + 통계 (캐시됨, deckId별)
 * - cacheTag('deck-{deckId}'): 덱 수정/삭제 시 무효화
 * - cacheTag('cards-{deckId}'): 카드 추가/삭제/복습 시 무효화
 */
export async function getDeckDetail(deckId: string) {
  'use cache'
  cacheTag(`deck-${deckId}`, `cards-${deckId}`)

  const [deck] = await db
    .select()
    .from(decks)
    .where(eq(decks.id, deckId))
    .limit(1)

  if (!deck) return null

  const deckCards = await db
    .select()
    .from(cards)
    .where(eq(cards.deckId, deckId))
    .orderBy(cards.createdAt)

  const cardsWithProgress = await Promise.all(
    deckCards.map(async (card) => {
      const [progress] = await db
        .select()
        .from(cardProgress)
        .where(eq(cardProgress.cardId, card.id))
        .limit(1)
      return { ...card, progress: progress ?? null }
    }),
  )

  const now = new Date()
  const newCount = cardsWithProgress.filter((c) => !c.progress).length
  const learningCount = cardsWithProgress.filter(
    (c) => c.progress?.status === 'learning',
  ).length
  const reviewCount = cardsWithProgress.filter(
    (c) => c.progress && c.progress.nextReviewDate <= now,
  ).length
  const dueCount = newCount + reviewCount

  return {
    deck,
    cards: cardsWithProgress,
    stats: {
      total: deckCards.length,
      newCount,
      learningCount,
      reviewCount,
      dueCount,
    },
  }
}

/**
 * 덱 단건 조회 (캐시됨)
 */
export async function getDeckById(deckId: string) {
  'use cache'
  cacheTag(`deck-${deckId}`)

  const [deck] = await db
    .select()
    .from(decks)
    .where(eq(decks.id, deckId))
    .limit(1)

  return deck ?? null
}
