'use server'

import { db } from '@/db'
import { decks } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createDeck(formData: FormData) {
  const name = formData.get('name') as string
  const description = (formData.get('description') as string) ?? ''

  if (!name?.trim()) {
    throw new Error('덱 이름을 입력해주세요.')
  }

  const [deck] = await db
    .insert(decks)
    .values({ name: name.trim(), description: description.trim() })
    .returning()

  revalidatePath('/')
  redirect(`/decks/${deck.id}`)
}

export async function updateDeck(id: string, formData: FormData) {
  const name = formData.get('name') as string
  const description = (formData.get('description') as string) ?? ''

  if (!name?.trim()) {
    throw new Error('덱 이름을 입력해주세요.')
  }

  await db
    .update(decks)
    .set({ name: name.trim(), description: description.trim() })
    .where(eq(decks.id, id))

  revalidatePath('/')
  revalidatePath(`/decks/${id}`)
}

export async function deleteDeck(id: string) {
  await db.delete(decks).where(eq(decks.id, id))
  revalidatePath('/')
  redirect('/')
}
