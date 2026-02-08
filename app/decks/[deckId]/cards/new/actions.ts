"use server";

import { z } from "zod";
import { insertCard } from "@/features/cards/mutations";
import { updateCardsCache } from "@/features/cards/queries";
import { updateDecksCache } from "@/features/decks/queries";

const createCardSchema = z.object({
  front: z.string().trim().min(1, "앞면을 입력해주세요."),
  back: z.string().trim().min(1, "뒷면을 입력해주세요."),
  type: z.enum(["basic", "subjective"]).default("basic"),
});

export async function createCard(deckId: string, formData: FormData) {
  const result = createCardSchema.safeParse({
    front: formData.get("front"),
    back: formData.get("back"),
    type: formData.get("type") || "basic",
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  await insertCard({ deckId, ...result.data });

  updateCardsCache(deckId);
  updateDecksCache();
}
