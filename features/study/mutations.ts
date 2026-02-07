import { db } from "@/db";
import { cardProgress, reviewLogs } from "./schema";
import { eq } from "drizzle-orm";
import type { SM2Result } from "@/lib/sm2";

export async function upsertProgress(cardId: string, result: SM2Result) {
  const [existing] = await db
    .select({ id: cardProgress.id })
    .from(cardProgress)
    .where(eq(cardProgress.cardId, cardId))
    .limit(1);

  if (existing) {
    await db
      .update(cardProgress)
      .set({
        repetitions: result.repetitions,
        easinessFactor: result.easinessFactor,
        intervalDays: result.intervalDays,
        nextReviewDate: result.nextReviewDate,
        status: result.status,
      })
      .where(eq(cardProgress.cardId, cardId));
  } else {
    await db.insert(cardProgress).values({
      cardId,
      repetitions: result.repetitions,
      easinessFactor: result.easinessFactor,
      intervalDays: result.intervalDays,
      nextReviewDate: result.nextReviewDate,
      status: result.status,
    });
  }
}

export async function insertReviewLog(data: {
  cardId: string;
  quality: number;
  userAnswer: string | null;
  aiFeedback: string | null;
}) {
  await db.insert(reviewLogs).values(data);
}
