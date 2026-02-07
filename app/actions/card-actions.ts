'use server'

import { db } from '@/db'
import { cards } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function createCard(deckId: string, formData: FormData) {
  const front = formData.get('front') as string
  const back = formData.get('back') as string
  const type = (formData.get('type') as string) || 'basic'

  if (!front?.trim() || !back?.trim()) {
    return { error: '앞면과 뒷면을 모두 입력해주세요.' }
  }

  await db.insert(cards).values({
    deckId,
    front: front.trim(),
    back: back.trim(),
    type,
  })

  revalidatePath(`/decks/${deckId}`)
}

export async function createMultipleCards(
  deckId: string,
  cardData: Array<{ front: string; back: string; type: string }>,
) {
  if (cardData.length === 0) return

  await db.insert(cards).values(
    cardData.map((c) => ({
      deckId,
      front: c.front.trim(),
      back: c.back.trim(),
      type: c.type,
    })),
  )

  revalidatePath(`/decks/${deckId}`)
}

export async function deleteCard(cardId: string, deckId: string) {
  await db.delete(cards).where(eq(cards.id, cardId))
  revalidatePath(`/decks/${deckId}`)
}
