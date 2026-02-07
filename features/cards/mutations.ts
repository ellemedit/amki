import { db } from "@/db";
import { cards } from "./schema";
import { eq } from "drizzle-orm";

export async function insertCard(data: {
  deckId: string;
  front: string;
  back: string;
  type: string;
}) {
  await db.insert(cards).values(data);
}

export async function insertCards(
  rows: Array<{ deckId: string; front: string; back: string; type: string }>,
) {
  if (rows.length === 0) return;
  await db.insert(cards).values(rows);
}

export async function deleteCardById(cardId: string) {
  await db.delete(cards).where(eq(cards.id, cardId));
}
