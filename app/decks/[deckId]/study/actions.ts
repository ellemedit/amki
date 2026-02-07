"use server";

import { updateTag } from "next/cache";
import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { db } from "@/db";
import { cardProgress } from "@/features/study/schema";
import { eq } from "drizzle-orm";
import { calculateSM2, SM2_DEFAULTS } from "@/lib/sm2";
import { upsertProgress, insertReviewLog } from "@/features/study/mutations";

// ---------------------------------------------------------------------------
// submitReview
// ---------------------------------------------------------------------------

export async function submitReview(
  cardId: string,
  deckId: string,
  quality: number,
  userAnswer?: string,
  aiFeedback?: string,
) {
  const [existing] = await db
    .select()
    .from(cardProgress)
    .where(eq(cardProgress.cardId, cardId))
    .limit(1);

  const result = calculateSM2({
    quality,
    repetitions: existing?.repetitions ?? SM2_DEFAULTS.repetitions,
    easinessFactor: existing?.easinessFactor ?? SM2_DEFAULTS.easinessFactor,
    intervalDays: existing?.intervalDays ?? SM2_DEFAULTS.intervalDays,
  });

  await upsertProgress(cardId, result);
  await insertReviewLog({
    cardId,
    quality,
    userAnswer: userAnswer ?? null,
    aiFeedback: aiFeedback ?? null,
  });

  updateTag(`cards-${deckId}`);
  updateTag("decks");

  return result;
}

// ---------------------------------------------------------------------------
// gradeSubjectiveAnswer
// ---------------------------------------------------------------------------

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

export async function gradeSubjectiveAnswer(
  question: string,
  correctAnswer: string,
  userAnswer: string,
): Promise<{ quality: number; feedback: string }> {
  try {
    const { output } = await generateText({
      model: openai("gpt-4o-mini"),
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
    const { calculateSimpleSimilarity } = await import("@/lib/similarity");
    const similarity = calculateSimpleSimilarity(correctAnswer, userAnswer);
    let quality: number;
    if (similarity >= 0.9) quality = 5;
    else if (similarity >= 0.7) quality = 4;
    else if (similarity >= 0.5) quality = 3;
    else if (similarity >= 0.3) quality = 2;
    else if (similarity >= 0.1) quality = 1;
    else quality = 0;

    return {
      quality,
      feedback:
        "AI 채점을 사용할 수 없어 텍스트 유사도로 채점했습니다. OPENAI_API_KEY를 설정해주세요.",
    };
  }
}
