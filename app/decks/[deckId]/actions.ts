"use server";

import { z } from "zod";
import { updateDeckById, deleteDeckById } from "@/features/decks/mutations";
import {
  updateDeckCache,
  updateDecksCache,
} from "@/features/decks/queries";
import { updateCardsCache } from "@/features/cards/queries";

// ---------------------------------------------------------------------------
// Deck actions
// ---------------------------------------------------------------------------

const updateDeckSchema = z.object({
  name: z.string().trim().min(1, "덱 이름을 입력해주세요."),
  description: z.string().trim().default(""),
});

export async function updateDeck(deckId: string, formData: FormData) {
  const result = updateDeckSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  await updateDeckById(deckId, result.data);
  // Server Action 컨텍스트이므로 updateTag 사용
  updateDeckCache(deckId);
  updateDecksCache();
}

export async function deleteDeck(deckId: string) {
  await deleteDeckById(deckId);
  // Server Action 컨텍스트이므로 updateTag 사용
  updateDecksCache();
  updateDeckCache(deckId);
  updateCardsCache(deckId);
  // 클라이언트에서 router.replace("/")로 리디렉션
}
