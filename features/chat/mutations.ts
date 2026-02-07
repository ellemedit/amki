import { db } from "@/db";
import { chatSessions } from "./schema";
import { eq } from "drizzle-orm";

export async function upsertChatSession(
  id: string,
  deckId: string,
  messages: unknown[],
) {
  const [existing] = await db
    .select({ id: chatSessions.id })
    .from(chatSessions)
    .where(eq(chatSessions.id, id))
    .limit(1);

  if (existing) {
    await db
      .update(chatSessions)
      .set({ messages })
      .where(eq(chatSessions.id, id));
  } else {
    await db.insert(chatSessions).values({ id, deckId, messages });
  }
}

export async function deleteChatSession(id: string) {
  await db.delete(chatSessions).where(eq(chatSessions.id, id));
}
