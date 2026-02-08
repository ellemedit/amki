"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { updateDeckById, deleteDeckById } from "@/features/decks/mutations";
import { updateCardById, deleteCardById } from "@/features/cards/mutations";
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
  updateDeckCache(deckId);
  updateDecksCache();
}

export async function deleteDeck(deckId: string) {
  await deleteDeckById(deckId);
  updateDecksCache();
  updateDeckCache(deckId);
  updateCardsCache(deckId);
  redirect("/");
}

// ---------------------------------------------------------------------------
// Card actions
// ---------------------------------------------------------------------------

const updateCardSchema = z.object({
  front: z.string().trim().min(1, "앞면을 입력해주세요."),
  back: z.string().trim().min(1, "뒷면을 입력해주세요."),
  type: z.enum(["basic", "subjective"]).default("basic"),
});

export async function updateCard(
  deckId: string,
  cardId: string,
  formData: FormData,
) {
  const result = updateCardSchema.safeParse({
    front: formData.get("front"),
    back: formData.get("back"),
    type: formData.get("type") || "basic",
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  await updateCardById(cardId, result.data);
  updateCardsCache(deckId);
}

export async function deleteCard(deckId: string, cardId: string) {
  await deleteCardById(cardId);
  updateCardsCache(deckId);
  updateDecksCache();
}
