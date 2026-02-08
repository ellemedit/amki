import { db, type Transactable } from "@/db";
import { cardProgress, reviewLogs, type WriteReviewLog } from "./schema";
import type { SM2Result } from "@/lib/sm2";

export async function upsertProgress(
  cardId: string,
  result: SM2Result,
  tx: Transactable = db,
) {
  const fields = {
    repetitions: result.repetitions,
    easinessFactor: result.easinessFactor,
    intervalDays: result.intervalDays,
    nextReviewDate: result.nextReviewDate,
    status: result.status,
  };

  await tx
    .insert(cardProgress)
    .values({ cardId, ...fields })
    .onConflictDoUpdate({
      target: cardProgress.cardId,
      set: fields,
    });
}

export async function insertReviewLog(
  data: WriteReviewLog,
  tx: Transactable = db,
) {
  await tx.insert(reviewLogs).values(data);
}
