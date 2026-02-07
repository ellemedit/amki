/**
 * Jaccard similarity between two strings based on word overlap.
 * Used as fallback when AI grading is unavailable.
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
