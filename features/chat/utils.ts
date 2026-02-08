import type { UIMessage } from "ai";

/**
 * DB JSONB에서 읽은 raw 데이터를 UIMessage[]로 안전하게 변환합니다.
 * 구조가 유효하지 않으면 빈 배열을 반환합니다.
 */
export function parseUIMessages(raw: unknown): UIMessage[] {
  if (!Array.isArray(raw)) return [];

  return raw.filter(
    (msg): msg is UIMessage =>
      typeof msg === "object" &&
      msg !== null &&
      "id" in msg &&
      "role" in msg &&
      "parts" in msg &&
      Array.isArray(msg.parts),
  );
}
