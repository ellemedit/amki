"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { insertDeck } from "@/features/decks/mutations";
import { insertCards } from "@/features/cards/mutations";
import { updateDecksCache } from "@/features/decks/queries";

const schema = z.object({
  name: z.string().trim().min(1, "덱 이름을 입력해주세요."),
  description: z.string().trim().default(""),
  cards: z.array(
    z.object({
      front: z.string().min(1),
      back: z.string().min(1),
      type: z.enum(["basic", "subjective"]).default("basic"),
    }),
  ),
});

export type CreateDeckWithCardsInput = z.input<typeof schema>;

export async function createDeckWithCards(input: CreateDeckWithCardsInput) {
  const result = schema.safeParse(input);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { name, description, cards } = result.data;

  const deck = await db.transaction(async (tx) => {
    const created = await insertDeck({ name, description }, tx);
    if (cards.length > 0) {
      await insertCards(
        cards.map((c) => ({ deckId: created.id, ...c })),
        tx,
      );
    }
    return created;
  });

  updateDecksCache();
  redirect(`/decks/${deck.id}`);
}
