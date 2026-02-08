import { describe, it, expect } from "vitest";
import { calculateSM2, SM2_DEFAULTS, getQualityLabel } from "./sm2";

describe("SM-2 Algorithm", () => {
  const defaults = {
    repetitions: SM2_DEFAULTS.repetitions,
    easinessFactor: SM2_DEFAULTS.easinessFactor,
    intervalDays: SM2_DEFAULTS.intervalDays,
  };

  it("first correct answer sets interval to 1 day", () => {
    const result = calculateSM2({ ...defaults, quality: 4 });
    expect(result.intervalDays).toBe(1);
    expect(result.repetitions).toBe(1);
    expect(result.status).toBe("learning");
  });

  it("second correct answer sets interval to 6 days", () => {
    const result = calculateSM2({
      quality: 4,
      repetitions: 1,
      easinessFactor: 2.5,
      intervalDays: 1,
    });
    expect(result.intervalDays).toBe(6);
    expect(result.repetitions).toBe(2);
    expect(result.status).toBe("learning");
  });

  it("third correct answer multiplies interval by EF", () => {
    const result = calculateSM2({
      quality: 4,
      repetitions: 2,
      easinessFactor: 2.5,
      intervalDays: 6,
    });
    expect(result.intervalDays).toBe(15); // round(6 * 2.5) = 15
    expect(result.repetitions).toBe(3);
    expect(result.status).toBe("review");
  });

  it("incorrect answer resets repetitions and sets interval to 1", () => {
    const result = calculateSM2({
      quality: 1,
      repetitions: 5,
      easinessFactor: 2.5,
      intervalDays: 30,
    });
    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(1);
  });

  it("easiness factor decreases with lower quality", () => {
    const result = calculateSM2({ ...defaults, quality: 3 });
    expect(result.easinessFactor).toBeLessThan(2.5);
  });

  it("easiness factor increases with perfect quality", () => {
    const result = calculateSM2({ ...defaults, quality: 5 });
    expect(result.easinessFactor).toBeGreaterThan(2.5);
  });

  it("easiness factor never goes below 1.3", () => {
    let ef = 2.5;
    let rep = 0;
    let interval = 0;
    // Keep giving quality 0 to drive EF down
    for (let i = 0; i < 20; i++) {
      const result = calculateSM2({
        quality: 0,
        repetitions: rep,
        easinessFactor: ef,
        intervalDays: interval,
      });
      ef = result.easinessFactor;
      rep = result.repetitions;
      interval = result.intervalDays;
    }
    expect(ef).toBeGreaterThanOrEqual(1.3);
  });

  it("throws on invalid quality", () => {
    expect(() => calculateSM2({ ...defaults, quality: -1 })).toThrow();
    expect(() => calculateSM2({ ...defaults, quality: 6 })).toThrow();
  });

  it("nextReviewDate is in the future", () => {
    const now = new Date();
    const result = calculateSM2({ ...defaults, quality: 4 });
    expect(result.nextReviewDate.getTime()).toBeGreaterThan(now.getTime());
  });

  it("simulates a full learning cycle", () => {
    // First review: quality 4
    let result = calculateSM2({
      quality: 4,
      repetitions: 0,
      easinessFactor: 2.5,
      intervalDays: 0,
    });
    expect(result.intervalDays).toBe(1);
    expect(result.status).toBe("learning");

    // Second review: quality 5
    result = calculateSM2({
      quality: 5,
      repetitions: result.repetitions,
      easinessFactor: result.easinessFactor,
      intervalDays: result.intervalDays,
    });
    expect(result.intervalDays).toBe(6);
    expect(result.status).toBe("learning");

    // Third review: quality 5
    result = calculateSM2({
      quality: 5,
      repetitions: result.repetitions,
      easinessFactor: result.easinessFactor,
      intervalDays: result.intervalDays,
    });
    expect(result.intervalDays).toBeGreaterThan(6);
    expect(result.status).toBe("review");

    // Fail: quality 1 - should reset
    const failed = calculateSM2({
      quality: 1,
      repetitions: result.repetitions,
      easinessFactor: result.easinessFactor,
      intervalDays: result.intervalDays,
    });
    expect(failed.repetitions).toBe(0);
    expect(failed.intervalDays).toBe(1);
  });

  it("quality 3 sets status to learning on first review", () => {
    const result = calculateSM2({ ...defaults, quality: 3 });
    expect(result.repetitions).toBe(1);
    expect(result.status).toBe("learning");
  });

  it("quality 0 resets from any state", () => {
    const result = calculateSM2({
      quality: 0,
      repetitions: 10,
      easinessFactor: 2.5,
      intervalDays: 100,
    });
    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(1);
  });

  it("preserves EF precision to 2 decimal places", () => {
    const result = calculateSM2({ ...defaults, quality: 3 });
    const decimalPlaces =
      result.easinessFactor.toString().split(".")[1]?.length ?? 0;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });
});

describe("getQualityLabel", () => {
  it("returns correct label for each quality level", () => {
    expect(getQualityLabel(0)).toBe("완전 망각");
    expect(getQualityLabel(1)).toBe("틀림");
    expect(getQualityLabel(2)).toBe("겨우 기억");
    expect(getQualityLabel(3)).toBe("어려움");
    expect(getQualityLabel(4)).toBe("좋음");
    expect(getQualityLabel(5)).toBe("완벽");
  });

  it("returns empty string for invalid quality", () => {
    expect(getQualityLabel(-1)).toBe("");
    expect(getQualityLabel(6)).toBe("");
    expect(getQualityLabel(99)).toBe("");
  });
});
