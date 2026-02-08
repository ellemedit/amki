/**
 * 덱 뮤테이션 (CRUD 쓰기 연산).
 *
 * 캐시 무효화는 이 모듈에서 수행하지 않습니다.
 * 호출자(Server Action 또는 Route Handler)가 적절한 캐시 무효화 함수를 호출해야 합니다.
 */

import { db, type Transactable } from "@/db";
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
