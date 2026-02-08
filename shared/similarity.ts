/**
 * Jaccard 유사도 — 단어 집합 기반 텍스트 유사도.
 * AI 채점(Claude)이 불가능할 때의 폴백으로 사용됩니다.
 *
 * 한계: 어순/문맥 미고려, 동의어 미인식. 프로덕션에서는 AI 채점 권장.
 */
export function calculateSimpleSimilarity(a: string, b: string): number {
  const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;

  const wordsA = new Set(na.split(" "));
  const wordsB = new Set(nb.split(" "));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);

  return union.size > 0 ? intersection.size / union.size : 0;
}
