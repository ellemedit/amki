import {
  convertToModelMessages,
  createIdGenerator,
  streamText,
  tool,
  UIMessage,
  stepCountIs,
  validateUIMessages,
} from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { upsertChatSession } from "@/features/chat/mutations";
import { getChatSession } from "@/features/chat/queries";
import { parseUIMessages } from "@/features/chat/utils";
import {
  HAIKU_MODEL,
  CHAT_CARD_ASSISTANT_PROMPT,
} from "@/features/cards/ai-config";

export const maxDuration = 60;

function createTools(deckId: string) {
  return {
    generateCards: tool({
      description:
        "암기 카드를 일괄 생성합니다. 학습 자료의 핵심 개념을 직접 카드로 만들어 cards 배열에 담아주세요.",
      inputSchema: z.object({
        cards: z.array(
          z.object({
            front: z
              .string()
              .describe("카드 앞면 - 질문 또는 암기할 내용의 프롬프트"),
            back: z
              .string()
              .describe("카드 뒷면 - 정답 또는 암기할 내용의 설명"),
            type: z
              .enum(["basic", "subjective"])
              .default("basic")
              .describe(
                "카드 유형: basic(답을 보고 직접 평가) 또는 subjective(AI가 답안 채점)",
              ),
          }),
        ),
      }),
      execute: async ({ cards }) => {
        return { count: cards.length, cards };
      },
    }),
  };
}

export async function POST(req: Request) {
  const {
    message,
    deckId,
    chatId,
  }: { message: UIMessage; deckId: string; chatId: string } =
    await req.json();

  const tools = createTools(deckId);

  // 이전 메시지를 DB에서 로드 (클라이언트에서 전체 전송하지 않음)
  const session = await getChatSession(chatId);
  const previousMessages = parseUIMessages(session?.messages);

  // 메시지 검증 (배포 간 도구 스키마 변경 대응)
  let messages: UIMessage[];
  try {
    messages = await validateUIMessages({
      messages: [...previousMessages, message],
      tools: tools as Parameters<typeof validateUIMessages>[0]["tools"],
    });
  } catch {
    // 이전 메시지가 호환되지 않으면 새 메시지만으로 시작
    messages = [message];
  }

  const result = streamText({
    model: HAIKU_MODEL,
    system: CHAT_CARD_ASSISTANT_PROMPT,
    messages: await convertToModelMessages(messages),
    tools,
    maxOutputTokens: 4096,
    stopWhen: stepCountIs(3),
  });

  // 클라이언트가 연결을 끊어도 onFinish가 실행되도록 스트림을 소비
  result.consumeStream();

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    // 서버 측 메시지 ID 생성 (영속성 일관성 보장)
    generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
    onFinish: async ({ messages: finalMessages }) => {
      await upsertChatSession(chatId, deckId, finalMessages);
    },
    onError: (error) => {
      if (error instanceof Error) return error.message;
      return String(error);
    },
  });
}
