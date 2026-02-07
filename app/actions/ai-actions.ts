'use server'

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const gradingSchema = z.object({
  quality: z
    .number()
    .int()
    .min(0)
    .max(5)
    .describe('SM-2 quality rating: 0=complete blackout, 1=wrong, 2=barely remembered, 3=correct with difficulty, 4=correct with hesitation, 5=perfect'),
  feedback: z
    .string()
    .describe('Brief feedback in Korean explaining the grading result'),
})

export async function gradeSubjectiveAnswer(
  question: string,
  correctAnswer: string,
  userAnswer: string,
): Promise<{ quality: number; feedback: string }> {
  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: gradingSchema,
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
    })

    return object
  } catch {
    // Fallback: simple string comparison if AI is not available
    const { calculateSimpleSimilarity } = await import('@/lib/similarity')
    const similarity = calculateSimpleSimilarity(correctAnswer, userAnswer)
    let quality: number
    if (similarity >= 0.9) quality = 5
    else if (similarity >= 0.7) quality = 4
    else if (similarity >= 0.5) quality = 3
    else if (similarity >= 0.3) quality = 2
    else if (similarity >= 0.1) quality = 1
    else quality = 0

    return {
      quality,
      feedback:
        'AI 채점을 사용할 수 없어 텍스트 유사도로 채점했습니다. OPENAI_API_KEY를 설정해주세요.',
    }
  }
}

