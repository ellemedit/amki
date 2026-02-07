import { db } from "@/db";
import { decks } from "./schema";
import { eq } from "drizzle-orm";

export async function insertDeck(data: { name: string; description: string }) {
  const [deck] = await db.insert(decks).values(data).returning();
  return deck;
}

export async function updateDeckById(
  id: string,
  data: { name: string; description: string },
) {
  await db.update(decks).set(data).where(eq(decks.id, id));
}

export async function deleteDeckById(id: string) {
  await db.delete(decks).where(eq(decks.id, id));
}
