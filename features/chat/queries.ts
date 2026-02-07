import { db } from "@/db";
import { chatSessions } from "./schema";
import { eq, desc } from "drizzle-orm";

export async function getLatestChatSession(deckId: string) {
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.deckId, deckId))
    .orderBy(desc(chatSessions.updatedAt))
    .limit(1);

  return session ?? null;
}

export async function getChatSession(id: string) {
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, id))
    .limit(1);

  return session ?? null;
}
