import DataLoader from 'dataloader'
import { cache } from 'react'
import { db } from '@/db'
import { decks, cards, cardProgress } from '@/db/schema'
import { inArray } from 'drizzle-orm'
import type { Deck, Card, CardProgress } from '@/db/schema'

// --- Batch functions ---

async function batchDecksByIds(ids: readonly string[]): Promise<(Deck | null)[]> {
  const results = await db
    .select()
    .from(decks)
    .where(inArray(decks.id, [...ids]))
  const map = new Map(results.map((d) => [d.id, d]))
  return ids.map((id) => map.get(id) ?? null)
}

async function batchCardsByDeckIds(
  deckIds: readonly string[],
): Promise<Card[][]> {
  const results = await db
    .select()
    .from(cards)
    .where(inArray(cards.deckId, [...deckIds]))
  const map = new Map<string, Card[]>()
  for (const card of results) {
    const existing = map.get(card.deckId) ?? []
    existing.push(card)
    map.set(card.deckId, existing)
  }
  return deckIds.map((id) => map.get(id) ?? [])
}

async function batchCardProgressByCardIds(
  cardIds: readonly string[],
): Promise<(CardProgress | null)[]> {
  const results = await db
    .select()
    .from(cardProgress)
    .where(inArray(cardProgress.cardId, [...cardIds]))
  const map = new Map(results.map((p) => [p.cardId, p]))
  return cardIds.map((id) => map.get(id) ?? null)
}

// --- Request-scoped loaders via React cache ---

export const getLoaders = cache(() => ({
  deckById: new DataLoader(batchDecksByIds),
  cardsByDeckId: new DataLoader(batchCardsByDeckIds),
  cardProgressByCardId: new DataLoader(batchCardProgressByCardIds),
}))
