'use server'

import { z } from 'zod'
import { db } from '@/db'
import { decks } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'

const deckSchema = z.object({
  name: z.string().trim().min(1, '덱 이름을 입력해주세요.'),
  description: z.string().trim().default(''),
})

export async function createDeck(formData: FormData) {
  const result = deckSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') ?? '',
  })

  if (!result.success) {
    throw new Error(result.error.issues[0].message)
  }

  const { name, description } = result.data

  const [deck] = await db
    .insert(decks)
    .values({ name, description })
    .returning()

  updateTag('decks')
  redirect(`/decks/${deck.id}`)
}

export async function updateDeck(id: string, formData: FormData) {
  const result = deckSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') ?? '',
  })

  if (!result.success) {
    throw new Error(result.error.issues[0].message)
  }

  const { name, description } = result.data

  await db
    .update(decks)
    .set({ name, description })
    .where(eq(decks.id, id))

  updateTag('decks')
  updateTag(`deck-${id}`)
}

export async function deleteDeck(id: string) {
  await db.delete(decks).where(eq(decks.id, id))
  updateTag('decks')
  updateTag(`deck-${id}`)
  updateTag(`cards-${id}`)
  redirect('/')
}
