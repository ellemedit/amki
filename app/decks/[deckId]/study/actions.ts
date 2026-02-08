"use server";

import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { cardProgress } from "@/features/study/schema";
import { eq } from "drizzle-orm";
import { calculateSM2, SM2_DEFAULTS } from "@/shared/sm2";
import { upsertProgress, insertReviewLog } from "@/features/study/mutations";
import { updateCardsCache } from "@/features/cards/queries";
import { updateDecksCache } from "@/features/decks/queries";

const submitReviewSchema = z.object({
  cardId: z.string().min(1),
  deckId: z.string().min(1),
  quality: z.number().int().min(0).max(5),
  userAnswer: z.string().optional(),
  aiFeedback: z.string().optional(),
});

export async function submitReview(
  cardId: string,
  deckId: string,
  quality: number,
  userAnswer?: string,
  aiFeedback?: string,
) {
  const parsed = submitReviewSchema.safeParse({
    cardId,
    deckId,
    quality,
    userAnswer,
    aiFeedback,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const result = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(cardProgress)
      .where(eq(cardProgress.cardId, cardId))
      .limit(1);

    const sm2Result = calculateSM2({
      quality,
      repetitions: existing?.repetitions ?? SM2_DEFAULTS.repetitions,
      easinessFactor: existing?.easinessFactor ?? SM2_DEFAULTS.easinessFactor,
      intervalDays: existing?.intervalDays ?? SM2_DEFAULTS.intervalDays,
    });

    await upsertProgress(cardId, sm2Result, tx);
    await insertReviewLog(
      {
        cardId,
        quality,
        userAnswer: userAnswer ?? null,
        aiFeedback: aiFeedback ?? null,
      },
      tx,
    );

    return sm2Result;
  });

  updateCardsCache(deckId);
  updateDecksCache();

  return result;
}

const gradingSchema = z.object({
  quality: z
    .number()
    .int()
    .min(0)
    .max(5)
    .describe(
      "SM-2 quality rating: 0=complete blackout, 1=wrong, 2=barely remembered, 3=correct with difficulty, 4=correct with hesitation, 5=perfect",
    ),
  feedback: z
    .string()
    .describe("Brief feedback in Korean explaining the grading result"),
});

const similarityThresholds = [
  [0.9, 5],
  [0.7, 4],
  [0.5, 3],
  [0.3, 2],
  [0.1, 1],
] as const;

function qualityFromSimilarity(similarity: number): number {
  return similarityThresholds.find(([t]) => similarity >= t)?.[1] ?? 0;
}

/**
 * AI를 사용하여 서술형 답안을 채점합니다.
 *
 * 전략: AI 채점(Claude Sonnet) → Jaccard 텍스트 유사도 폴백.
 * API 키 미설정이나 네트워크 오류 시 유사도 기반으로 자동 전환됩니다.
 */
export async function gradeSubjectiveAnswer(
  question: string,
  correctAnswer: string,
  userAnswer: string,
): Promise<{ quality: number; feedback: string }> {
  try {
    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      output: Output.object({ schema: gradingSchema }),
      prompt: `You are a flashcard study assistant grading a student's answer.
Compare the student's answer against the correct answer and grade it on the SM-2 scale (0-5).

Question: ${question}

Correct Answer: ${correctAnswer}

Student's Answer: ${userAnswer}

Grading criteria:
- 5 (완벽): Answer is perfectly correct and complete
- 4 (좋음): Answer is correct but with minor omissions or imprecisions
- 3 (어려움): Answer captures the core concept but has significant gaps
- 2 (겨우 기억): Answer shows some understanding but is mostly wrong
- 1 (틀림): Answer is incorrect
- 0 (완전 망각): Answer shows no understanding at all

Provide your feedback in Korean. Be concise (1-2 sentences).`,
    });

    if (!output) {
      throw new Error("AI가 유효한 응답을 생성하지 못했습니다.");
    }
    return output;
  } catch {
    const { calculateSimpleSimilarity } = await import("@/shared/similarity");
    const similarity = calculateSimpleSimilarity(correctAnswer, userAnswer);

    return {
      quality: qualityFromSimilarity(similarity),
      feedback:
        "AI 채점을 사용할 수 없어 텍스트 유사도로 채점했습니다. ANTHROPIC_API_KEY를 설정해주세요.",
    };
  }
}
