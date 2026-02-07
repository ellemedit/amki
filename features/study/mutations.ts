import { db } from "@/db";
import { cardProgress, reviewLogs } from "./schema";
import type { SM2Result } from "@/lib/sm2";

export async function upsertProgress(cardId: string, result: SM2Result) {
  const fields = {
    repetitions: result.repetitions,
    easinessFactor: result.easinessFactor,
    intervalDays: result.intervalDays,
    nextReviewDate: result.nextReviewDate,
    status: result.status,
  };

  await db
    .insert(cardProgress)
    .values({ cardId, ...fields })
    .onConflictDoUpdate({
      target: cardProgress.cardId,
      set: fields,
    });
}

export async function insertReviewLog(data: {
  cardId: string;
  quality: number;
  userAnswer: string | null;
  aiFeedback: string | null;
}) {
  await db.insert(reviewLogs).values(data);
}
