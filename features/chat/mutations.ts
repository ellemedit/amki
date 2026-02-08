import { db, type Transactable } from "@/db";
import { chatSessions } from "./schema";
import { eq } from "drizzle-orm";

export async function upsertChatSession(
  id: string,
  deckId: string,
  messages: unknown[],
  tx: Transactable = db,
) {
  const [existing] = await tx
    .select({ id: chatSessions.id })
    .from(chatSessions)
    .where(eq(chatSessions.id, id))
    .limit(1);

  if (existing) {
    await tx
      .update(chatSessions)
      .set({ messages })
      .where(eq(chatSessions.id, id));
  } else {
    await tx.insert(chatSessions).values({ id, deckId, messages });
  }
}

export async function deleteChatSession(id: string, tx: Transactable = db) {
  await tx.delete(chatSessions).where(eq(chatSessions.id, id));
}
