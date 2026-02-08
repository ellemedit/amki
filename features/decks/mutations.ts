import { db, type Transactable } from "@/drizzle/db";
import { decks, type WriteDeck } from "./schema";
import { eq } from "drizzle-orm";

export async function insertDeck(data: WriteDeck, tx: Transactable = db) {
  const [deck] = await tx.insert(decks).values(data).returning();
  return deck;
}

export async function updateDeckById(
  id: string,
  data: WriteDeck,
  tx: Transactable = db,
) {
  await tx.update(decks).set(data).where(eq(decks.id, id));
}

export async function deleteDeckById(id: string, tx: Transactable = db) {
  await tx.delete(decks).where(eq(decks.id, id));
}
