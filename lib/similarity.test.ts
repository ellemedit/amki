import { describe, it, expect } from "vitest";
import { calculateSimpleSimilarity } from "./similarity";

describe("calculateSimpleSimilarity", () => {
  it("returns 1 for identical strings", () => {
    expect(calculateSimpleSimilarity("hello world", "hello world")).toBe(1);
  });

  it("returns 1 for strings that differ only in casing", () => {
    expect(calculateSimpleSimilarity("Hello World", "hello world")).toBe(1);
  });

  it("returns 1 for strings that differ only in whitespace", () => {
    expect(calculateSimpleSimilarity("  hello   world  ", "hello world")).toBe(
      1,
    );
  });

  it("returns 0 for completely different strings", () => {
    expect(calculateSimpleSimilarity("apple banana", "cherry date")).toBe(0);
  });

  it("returns partial similarity for overlapping words", () => {
    // "the quick brown fox" ∩ "the slow brown dog" = {"the", "brown"} = 2
    // union = {"the", "quick", "brown", "fox", "slow", "dog"} = 6
    const sim = calculateSimpleSimilarity(
      "the quick brown fox",
      "the slow brown dog",
    );
    expect(sim).toBeCloseTo(2 / 6);
  });

  it("returns 0.5 for half-overlapping two-word strings", () => {
    // "hello world" ∩ "hello there" = {"hello"} = 1
    // union = {"hello", "world", "there"} = 3
    const sim = calculateSimpleSimilarity("hello world", "hello there");
    expect(sim).toBeCloseTo(1 / 3);
  });

  it("handles empty strings gracefully", () => {
    expect(calculateSimpleSimilarity("", "")).toBe(1); // both normalize to same empty string
  });

  it("handles single word match", () => {
    expect(calculateSimpleSimilarity("apple", "apple")).toBe(1);
  });

  it("handles single word non-match", () => {
    expect(calculateSimpleSimilarity("apple", "banana")).toBe(0);
  });

  it("handles Korean text", () => {
    const sim = calculateSimpleSimilarity(
      "리액트는 UI 라이브러리입니다",
      "리액트는 자바스크립트 라이브러리입니다",
    );
    // "리액트는" and "라이브러리입니다" overlap
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
  });
});
