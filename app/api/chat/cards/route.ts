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
import { insertCards } from "@/features/cards/mutations";
import { revalidateCardsCache } from "@/features/cards/queries";
import { revalidateDecksCache } from "@/features/decks/queries";
import { upsertChatSession } from "@/features/chat/mutations";
import { getChatSession } from "@/features/chat/queries";

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

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
        if (cards.length > 0) {
          await insertCards(cards.map((c) => ({ deckId, ...c })));
          revalidateCardsCache(deckId);
          revalidateDecksCache();
        }

        return { success: true, count: cards.length, cards };
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

  // Load previous messages from DB instead of receiving all from client
  const session = await getChatSession(chatId);
  const previousMessages = (session?.messages as UIMessage[]) ?? [];

  // Validate messages (tools may have changed between deploys)
  let messages: UIMessage[];
  try {
    messages = await validateUIMessages({
      messages: [...previousMessages, message],
      tools: tools as Parameters<typeof validateUIMessages>[0]["tools"],
    });
  } catch {
    // Old messages may have incompatible tool schemas — start fresh
    messages = [message];
  }

  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: `당신은 암기 카드(flashcard) 제작을 도와주는 AI 어시스턴트입니다.

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
- 카드를 추가한 후에는 어떤 카드를 만들었는지 요약해서 알려주세요`,
    messages: await convertToModelMessages(messages),
    tools,
    maxOutputTokens: 4096,
    stopWhen: stepCountIs(3),
  });

  // Consume stream so onFinish fires even if client disconnects
  result.consumeStream();

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    // Server-side message ID generation for persistence consistency
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
