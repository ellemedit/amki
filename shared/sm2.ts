/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Quality ratings:
 *   0 - 완전 망각 (complete blackout)
 *   1 - 틀림, 정답을 보고도 기억나지 않음
 *   2 - 틀림, 정답을 보면 기억남
 *   3 - 맞힘, 심각한 어려움
 *   4 - 맞힘, 약간의 망설임
 *   5 - 완벽 (perfect response)
 */

export interface SM2Input {
  quality: number; // 0-5
  repetitions: number;
  easinessFactor: number;
  intervalDays: number;
}

export interface SM2Result {
  repetitions: number;
  easinessFactor: number;
  intervalDays: number;
  nextReviewDate: Date;
  status: "new" | "learning" | "review";
}

export const SM2_DEFAULTS = {
  repetitions: 0,
  easinessFactor: 2.5,
  intervalDays: 0,
  MIN_EF: 1.3,
} as const;

export function calculateSM2(input: SM2Input): SM2Result {
  const { quality } = input;
  let { repetitions, easinessFactor, intervalDays } = input;

  if (quality < 0 || quality > 5) {
    throw new Error("Quality must be between 0 and 5");
  }

  if (quality >= 3) {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easinessFactor);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    intervalDays = 1;
  }

  easinessFactor =
    easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easinessFactor < SM2_DEFAULTS.MIN_EF) {
    easinessFactor = SM2_DEFAULTS.MIN_EF;
  }

  let status: SM2Result["status"];
  if (repetitions === 0) {
    status = "new";
  } else if (repetitions <= 2) {
    status = "learning";
  } else {
    status = "review";
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

  return {
    repetitions,
    easinessFactor: Math.round(easinessFactor * 100) / 100,
    intervalDays,
    nextReviewDate,
    status,
  };
}

export function getQualityLabel(quality: number): string {
  const labels: Record<number, string> = {
    0: "완전 망각",
    1: "틀림",
    2: "겨우 기억",
    3: "어려움",
    4: "좋음",
    5: "완벽",
  };
  return labels[quality] ?? "";
}
