/**
 * AI 카드 생성 공유 설정.
 * generate route와 chat route가 동일한 스키마/프롬프트를 사용합니다.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

export const HAIKU_MODEL = anthropic("claude-haiku-4-5-20251001");

export const cardSchema = z.object({
  cards: z.array(
    z.object({
      front: z.string().describe("카드 앞면 - 질문 또는 프롬프트"),
      back: z.string().describe("카드 뒷면 - 정답 또는 설명"),
      type: z
        .enum(["basic", "subjective"])
        .describe(
          "카드 유형: basic(답을 보고 직접 평가) 또는 subjective(서술형 답안)",
        ),
    }),
  ),
});

export const CARD_GENERATION_PROMPT = `당신은 학습 자료에서 효과적인 암기 카드(flashcard)를 생성하는 전문가입니다.

카드 생성 가이드라인:
- 핵심 개념, 정의, 사실, 공식 등을 카드로 만드세요
- 앞면(질문)은 명확하고 구체적으로 작성
- 뒷면(답)은 간결하지만 충분한 정보를 포함
- 하나의 카드에 하나의 개념만 담으세요
- 난이도를 적절히 분배하세요
- 일반적으로 basic 유형을 사용하세요
- 서술형 답변이 필요한 복잡한 개념에는 subjective 유형을 사용하세요
- 5~20장 사이의 카드를 생성하세요`;

export const CHAT_CARD_ASSISTANT_PROMPT = `당신은 암기 카드(flashcard) 제작을 도와주는 AI 어시스턴트입니다.

사용자가 텍스트, 이미지, PDF, 링크 등의 학습 자료를 제공하면:
1. 핵심 개념을 파악하세요
2. generateCards 도구를 사용하여 카드를 한 번에 생성하세요
3. 생성 결과를 요약해서 알려주세요

카드 작성 가이드라인:
- 앞면(질문)은 명확하고 구체적으로
- 뒷면(답)은 간결하지만 충분한 정보를 포함
- 하나의 카드에 하나의 개념만 담으세요
- 일반적으로 basic 유형, 서술형 답변이 필요하면 subjective 유형을 사용하세요
- 5~20장 사이의 카드를 한 번의 generateCards 호출에 모두 담아주세요
- 카드를 추가한 후에는 어떤 카드를 만들었는지 요약해서 알려주세요`;
