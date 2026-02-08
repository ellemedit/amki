"use server";

import { z } from "zod";
import {
  insertCards,
  updateCardById,
  deleteCardById,
} from "@/features/cards/mutations";
import { updateCardsCache } from "@/features/cards/queries";
import { updateDecksCache } from "@/features/decks/queries";

const addCardSchema = z.array(
  z.object({
    front: z.string().trim().min(1, "앞면을 입력해주세요."),
    back: z.string().trim().min(1, "뒷면을 입력해주세요."),
    type: z.enum(["basic", "subjective"]).default("basic"),
  }),
);

export async function addCards(
  deckId: string,
  cards: { front: string; back: string; type: string }[],
) {
  const result = addCardSchema.safeParse(cards);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  await insertCards(result.data.map((c) => ({ deckId, ...c })));
  updateCardsCache(deckId);
  updateDecksCache();
  return { count: result.data.length };
}

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
