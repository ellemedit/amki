import { db, type Transactable } from "@/db";
import { cards, type WriteCard } from "./schema";
import { eq } from "drizzle-orm";

export async function insertCard(data: WriteCard, tx: Transactable = db) {
  await tx.insert(cards).values(data);
}

export async function insertCards(rows: WriteCard[], tx: Transactable = db) {
  if (rows.length === 0) return;
  await tx.insert(cards).values(rows);
}

export async function updateCardById(
  cardId: string,
  data: Partial<Pick<WriteCard, "front" | "back" | "type">>,
  tx: Transactable = db,
) {
  await tx.update(cards).set(data).where(eq(cards.id, cardId));
}

export async function deleteCardById(cardId: string, tx: Transactable = db) {
  await tx.delete(cards).where(eq(cards.id, cardId));
}
