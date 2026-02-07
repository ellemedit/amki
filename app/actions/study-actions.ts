'use server'

import { db } from '@/db'
import { cards, cardProgress, reviewLogs } from '@/db/schema'
import { eq, lte, and, inArray } from 'drizzle-orm'
import { calculateSM2, SM2_DEFAULTS } from '@/lib/sm2'
import { revalidatePath } from 'next/cache'

export interface StudyCard {
  id: string
  front: string
  back: string
  type: string
  progress: {
    repetitions: number
    easinessFactor: number
    intervalDays: number
    status: string
  } | null
}

export async function getStudyCards(deckId: string): Promise<StudyCard[]> {
  const now = new Date()

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
    )

  // New cards (no progress record)
  const allCards = await db
    .select({ id: cards.id })
    .from(cards)
    .where(eq(cards.deckId, deckId))

  const cardsWithProgressIds = await db
    .select({ cardId: cardProgress.cardId })
    .from(cardProgress)
    .innerJoin(cards, eq(cards.id, cardProgress.cardId))
    .where(eq(cards.deckId, deckId))

  const progressSet = new Set(cardsWithProgressIds.map((c) => c.cardId))
  const newCardIds = allCards
    .filter((c) => !progressSet.has(c.id))
    .map((c) => c.id)

  let newCards: StudyCard[] = []
  if (newCardIds.length > 0) {
    const newCardData = await db
      .select()
      .from(cards)
      .where(
        and(eq(cards.deckId, deckId), inArray(cards.id, newCardIds)),
      )
    newCards = newCardData.map((c) => ({
      id: c.id,
      front: c.front,
      back: c.back,
      type: c.type,
      progress: null,
    }))
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
  }))

  // Shuffle: new cards first, then due cards
  return [...shuffleArray(newCards), ...shuffleArray(dueStudyCards)]
}

export async function submitReview(
  cardId: string,
  deckId: string,
  quality: number,
  userAnswer?: string,
  aiFeedback?: string,
) {
  // Get existing progress
  const [existing] = await db
    .select()
    .from(cardProgress)
    .where(eq(cardProgress.cardId, cardId))
    .limit(1)

  const input = {
    quality,
    repetitions: existing?.repetitions ?? SM2_DEFAULTS.repetitions,
    easinessFactor: existing?.easinessFactor ?? SM2_DEFAULTS.easinessFactor,
    intervalDays: existing?.intervalDays ?? SM2_DEFAULTS.intervalDays,
  }

  const result = calculateSM2(input)

  // Upsert progress
  if (existing) {
    await db
      .update(cardProgress)
      .set({
        repetitions: result.repetitions,
        easinessFactor: result.easinessFactor,
        intervalDays: result.intervalDays,
        nextReviewDate: result.nextReviewDate,
        status: result.status,
      })
      .where(eq(cardProgress.cardId, cardId))
  } else {
    await db.insert(cardProgress).values({
      cardId,
      repetitions: result.repetitions,
      easinessFactor: result.easinessFactor,
      intervalDays: result.intervalDays,
      nextReviewDate: result.nextReviewDate,
      status: result.status,
    })
  }

  // Log review
  await db.insert(reviewLogs).values({
    cardId,
    quality,
    userAnswer: userAnswer ?? null,
    aiFeedback: aiFeedback ?? null,
  })

  revalidatePath(`/decks/${deckId}`)
  revalidatePath(`/decks/${deckId}/study`)

  return result
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
