'use server'

import { z } from 'zod'
import { db } from '@/db'
import { cards } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { updateTag } from 'next/cache'

const createCardSchema = z.object({
  front: z.string().trim().min(1, '앞면을 입력해주세요.'),
  back: z.string().trim().min(1, '뒷면을 입력해주세요.'),
  type: z.enum(['basic', 'subjective']).default('basic'),
})

export async function createCard(deckId: string, formData: FormData) {
  const result = createCardSchema.safeParse({
    front: formData.get('front'),
    back: formData.get('back'),
    type: formData.get('type') || 'basic',
  })

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { front, back, type } = result.data

  await db.insert(cards).values({ deckId, front, back, type })

  updateTag(`cards-${deckId}`)
  updateTag('decks')
}

const createMultipleCardsSchema = z.array(
  z.object({
    front: z.string().trim().min(1),
    back: z.string().trim().min(1),
    type: z.enum(['basic', 'subjective']),
  }),
)

export async function createMultipleCards(
  deckId: string,
  cardData: Array<{ front: string; back: string; type: string }>,
) {
  const result = createMultipleCardsSchema.safeParse(cardData)
  if (!result.success || result.data.length === 0) return

  await db.insert(cards).values(
    result.data.map((c) => ({
      deckId,
      front: c.front,
      back: c.back,
      type: c.type,
    })),
  )

  updateTag(`cards-${deckId}`)
  updateTag('decks')
}

export async function deleteCard(cardId: string, deckId: string) {
  await db.delete(cards).where(eq(cards.id, cardId))
  updateTag(`cards-${deckId}`)
  updateTag('decks')
}
